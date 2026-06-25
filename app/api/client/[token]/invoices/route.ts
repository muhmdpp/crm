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

  const client = db.prepare("SELECT id FROM clients WHERE portal_token = ?").get(token) as any;
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invoices = db.prepare(`
    SELECT id, invoice_number, issue_date, total_amount, status, paid_at, created_at
    FROM invoices 
    WHERE client_id = ?
    ORDER BY created_at DESC
  `).all(client.id);

  return NextResponse.json(invoices, {
    headers: { "Cache-Control": "no-store" },
  });
}
