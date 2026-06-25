import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import "@/lib/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const { id } = await params;
  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const workEntries = db.prepare(
    "SELECT * FROM work_entries WHERE client_id = ? ORDER BY date DESC, created_at DESC"
  ).all(id);

  const invoices = db.prepare(
    "SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC"
  ).all(id);

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
      const existing = db.prepare("SELECT id FROM clients WHERE portal_token = ? AND id != ?").get(slug, id);
      if (existing) {
        return NextResponse.json({ error: "This slug is already taken" }, { status: 409 });
      }
      newSlug = slug;
    }
  }

  // Build update dynamically based on what's changing
  if (pinHash && newSlug) {
    db.prepare(
      "UPDATE clients SET name=?, email=?, phone=?, address=?, pin_hash=?, portal_token=? WHERE id=?"
    ).run(name, email ?? null, phone ?? null, address ?? null, pinHash, newSlug, id);
  } else if (pinHash) {
    db.prepare(
      "UPDATE clients SET name=?, email=?, phone=?, address=?, pin_hash=? WHERE id=?"
    ).run(name, email ?? null, phone ?? null, address ?? null, pinHash, id);
  } else if (newSlug) {
    db.prepare(
      "UPDATE clients SET name=?, email=?, phone=?, address=?, portal_token=? WHERE id=?"
    ).run(name, email ?? null, phone ?? null, address ?? null, newSlug, id);
  } else {
    db.prepare(
      "UPDATE clients SET name=?, email=?, phone=?, address=? WHERE id=?"
    ).run(name, email ?? null, phone ?? null, address ?? null, id);
  }

  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
  return NextResponse.json(client);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const { id } = await params;
  db.prepare("DELETE FROM clients WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
