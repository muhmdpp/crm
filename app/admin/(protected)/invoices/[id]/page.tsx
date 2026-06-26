import { notFound } from "next/navigation";
import db from "@/lib/db";
import "@/lib/schema";
import { InvoiceDetailClient } from "./InvoiceDetailClient";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const inv = (await db`SELECT invoice_number FROM invoices WHERE id = ${id}`)[0];
  return { title: inv?.invoice_number ?? "Invoice" };
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;

  const [invoiceResult, entries] = await Promise.all([
    db`
      SELECT i.*, c.name as client_name, c.email as client_email,
             c.phone as client_phone, c.address as client_address
      FROM invoices i JOIN clients c ON c.id = i.client_id
      WHERE i.id = ${id}
    `,
    db`
      SELECT * FROM work_entries WHERE invoice_id = ${id} ORDER BY date ASC
    `
  ]);

  const invoice = invoiceResult[0];

  if (!invoice) notFound();

  return <InvoiceDetailClient invoice={invoice} entries={entries} />;
}
