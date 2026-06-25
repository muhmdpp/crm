import { notFound } from "next/navigation";
import db from "@/lib/db";
import "@/lib/schema";
import EditClient from "./EditClient";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Edit Client" };

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const client = db.prepare(
    "SELECT id, name, email, phone, address, portal_token FROM clients WHERE id = ?"
  ).get(id) as any;
  if (!client) notFound();
  return <EditClient client={client} />;
}
