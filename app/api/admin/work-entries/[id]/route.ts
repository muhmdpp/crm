import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import "@/lib/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const { id } = await params;
  const body = await req.json();

  const validWorkStatus = ["in_progress", "completed"];
  const validBillingStatus = ["unbilled", "invoiced", "paid"];

  if (body.work_status !== undefined && !validWorkStatus.includes(body.work_status)) {
    return NextResponse.json({ error: "Invalid work_status" }, { status: 400 });
  }
  if (body.billing_status !== undefined && !validBillingStatus.includes(body.billing_status)) {
    return NextResponse.json({ error: "Invalid billing_status" }, { status: 400 });
  }

  const entry = db.prepare("SELECT * FROM work_entries WHERE id = ?").get(id) as any;
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newWorkStatus = body.work_status ?? entry.work_status;
  const newBillingStatus = body.billing_status ?? entry.billing_status;

  db.prepare(
    "UPDATE work_entries SET work_status=?, billing_status=? WHERE id=?"
  ).run(newWorkStatus, newBillingStatus, id);

  const updated = db.prepare("SELECT * FROM work_entries WHERE id = ?").get(id);
  return NextResponse.json(updated);
}

export async function PUT(req: NextRequest, { params }: Params) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const { id } = await params;
  const { date, kind_of_work, description, price, work_status } = await req.json();

  db.prepare(`
    UPDATE work_entries 
    SET date=?, kind_of_work=?, description=?, price=?, work_status=?
    WHERE id=? AND billing_status='unbilled'
  `).run(date, kind_of_work, description ?? null, price, work_status, id);

  const entry = db.prepare("SELECT * FROM work_entries WHERE id = ?").get(id);
  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const { id } = await params;
  // Only allow deleting unbilled entries
  const entry = db.prepare("SELECT * FROM work_entries WHERE id = ?").get(id) as any;
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.billing_status !== "unbilled") {
    return NextResponse.json({ error: "Cannot delete invoiced or paid entries" }, { status: 400 });
  }

  db.prepare("DELETE FROM work_entries WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
