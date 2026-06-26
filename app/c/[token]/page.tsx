import { notFound } from "next/navigation";
import db from "@/lib/db";
import "@/lib/schema";
import { isClientVerified } from "@/lib/client-auth";
import { ClientPortalClient } from "./ClientPortalClient";
import type { Metadata } from "next";

type Props = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  title: "Your Workspace | Watermelon CRM",
  description: "View your work history and invoices",
};

export default async function ClientPortalPage({ params }: Props) {
  const { token } = await params;

  const client = (await db`
    SELECT id, name FROM clients WHERE portal_token = ${token}
  `)[0];

  if (!client) notFound();

  const verified = await isClientVerified(token);

  return (
    <ClientPortalClient
      token={token}
      initialVerified={verified}
      initialClientName={verified ? client.name : null}
    />
  );
}
