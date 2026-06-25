import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import "@/lib/schema";
import { isClientVerified } from "@/lib/client-auth";
import { renderToStream } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument";
import React from "react";

type Params = { params: Promise<{ token: string; invoiceId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { token, invoiceId } = await params;

  if (!(await isClientVerified(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = db.prepare("SELECT id FROM clients WHERE portal_token = ?").get(token) as any;
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invoice = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email,
           c.phone as client_phone, c.address as client_address
    FROM invoices i JOIN clients c ON c.id = i.client_id
    WHERE i.id = ? AND i.client_id = ?
  `).get(invoiceId, client.id) as any;

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = db.prepare(
    "SELECT * FROM work_entries WHERE invoice_id = ? ORDER BY date ASC"
  ).all(invoiceId) as any[];

  const agencyName = process.env.AGENCY_NAME ?? "Deck Agency";
  const stream = await renderToStream(
    React.createElement(InvoiceDocument, { invoice, entries, agencyName }) as any
  );

  return new NextResponse(stream as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
