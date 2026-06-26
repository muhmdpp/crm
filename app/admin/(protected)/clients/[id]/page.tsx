import { notFound } from "next/navigation";
import db from "@/lib/db";
import "@/lib/schema";
import { ClientDetailClient } from "./ClientDetailClient";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const client = (await db`SELECT name FROM clients WHERE id = ${id}`)[0];
  return { title: client?.name ?? "Client" };
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;

  const [clientResult, workEntries, invoices] = await Promise.all([
    db`SELECT * FROM clients WHERE id = ${id}`,
    db`SELECT * FROM work_entries WHERE client_id = ${id} ORDER BY date DESC, created_at DESC`,
    db`SELECT * FROM invoices WHERE client_id = ${id} ORDER BY created_at DESC`
  ]);

  const client = clientResult[0];
  if (!client) notFound();

  // Strip pin_hash before passing to client component
  const { pin_hash, ...safeClient } = client;

  return (
    <ClientDetailClient
      client={safeClient}
      workEntries={workEntries}
      invoices={invoices}
    />
  );
}
