import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import "@/lib/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const { id } = await params;
  const invoice = (await db`
    SELECT i.*, c.name as client_name, c.email as client_email, 
           c.phone as client_phone, c.address as client_address
    FROM invoices i JOIN clients c ON c.id = i.client_id
    WHERE i.id = ${id}
  `)[0];

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await db`
    SELECT * FROM work_entries WHERE invoice_id = ${id} ORDER BY date ASC
  `;

  return NextResponse.json({ invoice, entries });
}

export async function PUT(req: NextRequest, { params }: Params) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const { id } = await params;
  const { status } = await req.json();

  if (!["draft", "sent", "paid"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const invoice = (await db`SELECT * FROM invoices WHERE id = ${id}`)[0];
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (status === "paid") {
    // Cascade: mark all linked entries as paid
    await db.begin(async (sql) => {
      await sql`UPDATE invoices SET status='paid', paid_at=NOW() WHERE id=${id}`;
      await sql`UPDATE work_entries SET billing_status='paid' WHERE invoice_id=${id}`;
    });
  } else {
    await db`UPDATE invoices SET status=${status} WHERE id=${id}`;
  }

  const updated = (await db`SELECT * FROM invoices WHERE id = ${id}`)[0];
  return NextResponse.json(updated);
}
