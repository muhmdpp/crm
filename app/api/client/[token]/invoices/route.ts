import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import "@/lib/schema";
import { isClientVerified } from "@/lib/client-auth";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { token } = await params;

  if (!(await isClientVerified(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = (await db`SELECT id FROM clients WHERE portal_token = ${token}`)[0];
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invoices = await db`
    SELECT id, invoice_number, issue_date, total_amount, status, paid_at, created_at
    FROM invoices 
    WHERE client_id = ${client.id}
    ORDER BY created_at DESC
  `;

  return NextResponse.json(invoices, {
    headers: { "Cache-Control": "no-store" },
  });
}
