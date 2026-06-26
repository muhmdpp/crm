import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import "@/lib/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth";
import { renderToStream } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument";
import React from "react";

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

  const agencyName = process.env.AGENCY_NAME ?? "Deck Agency";

  try {
    const stream = await renderToStream(
      React.createElement(InvoiceDocument, { invoice: invoice as any, entries: entries as any, agencyName }) as any
    );

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Render Error:", error);
    return NextResponse.json({ error: "Failed to generate PDF", details: String(error) }, { status: 500 });
  }
}
