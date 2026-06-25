import { notFound } from "next/navigation";
import db from "@/lib/db";
import "@/lib/schema";
import { InvoiceDetailClient } from "./InvoiceDetailClient";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const inv = db.prepare("SELECT invoice_number FROM invoices WHERE id = ?").get(id) as any;
  return { title: inv?.invoice_number ?? "Invoice" };
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;

  const invoice = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email,
           c.phone as client_phone, c.address as client_address
    FROM invoices i JOIN clients c ON c.id = i.client_id
    WHERE i.id = ?
  `).get(id) as any;

  if (!invoice) notFound();

  const entries = db.prepare(
    "SELECT * FROM work_entries WHERE invoice_id = ? ORDER BY date ASC"
  ).all(id) as any[];

  return <InvoiceDetailClient invoice={invoice} entries={entries} />;
}
