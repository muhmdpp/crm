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

  // Return safe fields only — no billing internals exposed
  const entries = await db`
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
    WHERE client_id = ${client.id}
    ORDER BY date DESC, created_at DESC
  `;

  return NextResponse.json(entries, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;

  if (!(await isClientVerified(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = (await db`SELECT id, name FROM clients WHERE portal_token = ${token}`)[0];
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  if (!body.kind_of_work) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const date = new Date().toISOString().split("T")[0];

  const result = await db`
    INSERT INTO work_entries (client_id, date, kind_of_work, description, price, work_status, billing_status)
    VALUES (${client.id}, ${date}, ${body.kind_of_work}, ${body.description || null}, 0, 'to_do', 'unbilled')
    RETURNING id
  `;

  const workEntryId = result[0].id;
  const message = `${client.name} requested new work: ${body.kind_of_work}`;
  
  await db`
    INSERT INTO notifications (client_id, work_entry_id, message)
    VALUES (${client.id}, ${workEntryId}, ${message})
  `;

  return NextResponse.json({ success: true, id: workEntryId });
}
