import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import "@/lib/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET() {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const invoices = await db`
    SELECT i.*, c.name as client_name
    FROM invoices i
    JOIN clients c ON c.id = i.client_id
    ORDER BY i.created_at DESC
  `;

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
    const entries = await db`
      SELECT * FROM work_entries 
      WHERE id IN ${db(entry_ids)} AND client_id = ${client_id} AND billing_status = 'unbilled'
    `;

    if (entries.length !== entry_ids.length) {
      return NextResponse.json(
        { error: "Some entries are invalid, already invoiced, or don't belong to this client" },
        { status: 400 }
      );
    }

    const totalAmount = entries.reduce((sum: number, e: any) => sum + e.price, 0);

    // Generate next invoice number
    const maxRowResult = await db`SELECT MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)) as max_num FROM invoices`;
    const maxRow = maxRowResult[0];
    const invoiceNumber = generateInvoiceNumber(maxRow?.max_num ?? 0);
    const issueDate = new Date().toISOString().split("T")[0];

    // Insert invoice + update entries atomically
    const invoiceId = await db.begin(async (sql) => {
      const result = await sql`
        INSERT INTO invoices (client_id, invoice_number, issue_date, total_amount, status)
        VALUES (${client_id}, ${invoiceNumber}, ${issueDate}, ${totalAmount}, 'draft')
        RETURNING id
      `;

      const id = result[0].id;

      await sql`
        UPDATE work_entries 
        SET billing_status = 'invoiced', invoice_id = ${id}
        WHERE id IN ${db(entry_ids)}
      `;

      return id;
    });

    const invoice = (await db`SELECT * FROM invoices WHERE id = ${invoiceId}`)[0];
    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
