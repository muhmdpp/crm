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

  // Return safe fields only — no billing internals exposed
  const entries = db.prepare(`
    SELECT 
      id, date, kind_of_work, description, price,
      work_status,
      CASE 
        WHEN billing_status = 'unbilled' THEN 'Pending'
        WHEN billing_status = 'invoiced' THEN 'Invoiced'
        WHEN billing_status = 'paid' THEN 'Paid'
      END as status_label,
      billing_status,
      created_at
    FROM work_entries 
    WHERE client_id = ?
    ORDER BY date DESC, created_at DESC
  `).all(client.id);

  return NextResponse.json(entries, {
    headers: { "Cache-Control": "no-store" },
  });
}
