import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import "@/lib/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const { id } = await params;
  const client = (await db`SELECT * FROM clients WHERE id = ${id}`)[0];
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const workEntries = await db`
    SELECT * FROM work_entries WHERE client_id = ${id} ORDER BY date DESC, created_at DESC
  `;

  const invoices = await db`
    SELECT * FROM invoices WHERE client_id = ${id} ORDER BY created_at DESC
  `;

  return NextResponse.json({ client, workEntries, invoices });
}

export async function PUT(req: NextRequest, { params }: Params) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const { id } = await params;
  const { name, email, phone, address, pin, customSlug } = await req.json();

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  let pinHash: string | undefined;
  if (pin) {
    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
    }
    pinHash = await bcrypt.hash(pin, 10);
  }

  let newSlug: string | undefined;
  if (customSlug !== undefined && customSlug !== null) {
    const slug = customSlug.trim().toLowerCase();
    if (slug) {
      if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug)) {
        return NextResponse.json(
          { error: "Slug must be 3–50 characters: lowercase letters, numbers, and hyphens only (no leading/trailing hyphens)" },
          { status: 400 }
        );
      }
      const existing = (await db`SELECT id FROM clients WHERE portal_token = ${slug} AND id != ${id}`)[0];
      if (existing) {
        return NextResponse.json({ error: "This slug is already taken" }, { status: 409 });
      }
      newSlug = slug;
    }
  }

  // Build update dynamically based on what's changing
  if (pinHash && newSlug) {
    await db`
      UPDATE clients SET name=${name}, email=${email ?? null}, phone=${phone ?? null}, address=${address ?? null}, pin_hash=${pinHash}, portal_token=${newSlug} WHERE id=${id}
    `;
  } else if (pinHash) {
    await db`
      UPDATE clients SET name=${name}, email=${email ?? null}, phone=${phone ?? null}, address=${address ?? null}, pin_hash=${pinHash} WHERE id=${id}
    `;
  } else if (newSlug) {
    await db`
      UPDATE clients SET name=${name}, email=${email ?? null}, phone=${phone ?? null}, address=${address ?? null}, portal_token=${newSlug} WHERE id=${id}
    `;
  } else {
    await db`
      UPDATE clients SET name=${name}, email=${email ?? null}, phone=${phone ?? null}, address=${address ?? null} WHERE id=${id}
    `;
  }

  const client = (await db`SELECT * FROM clients WHERE id = ${id}`)[0];
  return NextResponse.json(client);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const { id } = await params;
  await db`DELETE FROM clients WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
