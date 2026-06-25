import { notFound } from "next/navigation";
import db from "@/lib/db";
import "@/lib/schema";
import { ClientDetailClient } from "./ClientDetailClient";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const client = db.prepare("SELECT name FROM clients WHERE id = ?").get(id) as any;
  return { title: client?.name ?? "Client" };
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;

  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(id) as any;
  if (!client) notFound();

  const workEntries = db.prepare(
    "SELECT * FROM work_entries WHERE client_id = ? ORDER BY date DESC, created_at DESC"
  ).all(id) as any[];

  const invoices = db.prepare(
    "SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC"
  ).all(id) as any[];

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
