import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import "@/lib/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const { id } = await params;
  const invoice = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email, 
           c.phone as client_phone, c.address as client_address
    FROM invoices i JOIN clients c ON c.id = i.client_id
    WHERE i.id = ?
  `).get(id) as any;

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = db.prepare(
    "SELECT * FROM work_entries WHERE invoice_id = ? ORDER BY date ASC"
  ).all(id);

  return NextResponse.json({ invoice, entries });
}

export async function PUT(req: NextRequest, { params }: Params) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const { id } = await params;
  const { status } = await req.json();

  if (!["draft", "sent", "paid"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id) as any;
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (status === "paid") {
    // Cascade: mark all linked entries as paid
    const markPaid = db.transaction(() => {
      db.prepare(
        "UPDATE invoices SET status='paid', paid_at=datetime('now') WHERE id=?"
      ).run(id);
      db.prepare(
        "UPDATE work_entries SET billing_status='paid' WHERE invoice_id=?"
      ).run(id);
    });
    markPaid();
  } else {
    db.prepare("UPDATE invoices SET status=? WHERE id=?").run(status, id);
  }

  const updated = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
  return NextResponse.json(updated);
}
