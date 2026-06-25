import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import "@/lib/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET() {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const invoices = db.prepare(`
    SELECT i.*, c.name as client_name
    FROM invoices i
    JOIN clients c ON c.id = i.client_id
    ORDER BY i.created_at DESC
  `).all();

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  try {
    const { client_id, entry_ids } = await req.json();

    if (!client_id || !entry_ids?.length) {
      return NextResponse.json({ error: "client_id and entry_ids are required" }, { status: 400 });
    }

    // Verify all entries belong to this client and are unbilled
    const placeholders = entry_ids.map(() => "?").join(",");
    const entries = db.prepare(`
      SELECT * FROM work_entries 
      WHERE id IN (${placeholders}) AND client_id = ? AND billing_status = 'unbilled'
    `).all(...entry_ids, client_id) as any[];

    if (entries.length !== entry_ids.length) {
      return NextResponse.json(
        { error: "Some entries are invalid, already invoiced, or don't belong to this client" },
        { status: 400 }
      );
    }

    const totalAmount = entries.reduce((sum: number, e: any) => sum + e.price, 0);

    // Generate next invoice number
    const maxRow = db.prepare("SELECT MAX(CAST(SUBSTR(invoice_number, 5) AS INTEGER)) as max_num FROM invoices").get() as any;
    const invoiceNumber = generateInvoiceNumber(maxRow?.max_num ?? 0);
    const issueDate = new Date().toISOString().split("T")[0];

    // Insert invoice + update entries atomically
    const createInvoice = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO invoices (client_id, invoice_number, issue_date, total_amount, status)
        VALUES (?, ?, ?, ?, 'draft')
      `).run(client_id, invoiceNumber, issueDate, totalAmount);

      const invoiceId = result.lastInsertRowid;

      db.prepare(`
        UPDATE work_entries 
        SET billing_status = 'invoiced', invoice_id = ?
        WHERE id IN (${placeholders})
      `).run(invoiceId, ...entry_ids);

      return invoiceId;
    });

    const invoiceId = createInvoice();
    const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(invoiceId);
    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
