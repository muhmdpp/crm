import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import "@/lib/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth";
import { generatePortalToken } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  const clients = db.prepare(`
    SELECT 
      c.id,
      c.name,
      c.email,
      c.phone,
      c.address,
      c.portal_token,
      c.created_at,
      COALESCE(SUM(CASE WHEN we.billing_status = 'unbilled' THEN we.price ELSE 0 END), 0) as unbilled_total,
      COUNT(CASE WHEN we.billing_status = 'unbilled' THEN 1 END) as unbilled_count,
      MAX(we.created_at) as last_activity
    FROM clients c
    LEFT JOIN work_entries we ON we.client_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all();

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { name, email, phone, address, pin, customSlug } = await req.json();

    if (!name || !pin) {
      return NextResponse.json({ error: "Name and PIN are required" }, { status: 400 });
    }
    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
    }

    let portalToken: string;
    if (customSlug) {
      const slug = customSlug.trim().toLowerCase();
      if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug)) {
        return NextResponse.json(
          { error: "Slug must be 3–50 characters: lowercase letters, numbers, and hyphens only (no leading/trailing hyphens)" },
          { status: 400 }
        );
      }
      const existing = db.prepare("SELECT id FROM clients WHERE portal_token = ?").get(slug);
      if (existing) {
        return NextResponse.json({ error: "This slug is already taken" }, { status: 409 });
      }
      portalToken = slug;
    } else {
      portalToken = generatePortalToken();
    }

    const pinHash = await bcrypt.hash(pin, 10);

    const result = db.prepare(`
      INSERT INTO clients (name, email, phone, address, portal_token, pin_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, email ?? null, phone ?? null, address ?? null, portalToken, pinHash);

    const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(result.lastInsertRowid) as any;
    return NextResponse.json({ ...client, plain_pin: pin }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
