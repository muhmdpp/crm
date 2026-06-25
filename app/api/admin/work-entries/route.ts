import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import "@/lib/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  try {
    const { client_id, date, kind_of_work, description, price, work_status } = await req.json();

    if (!client_id || !date || !kind_of_work || price === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO work_entries (client_id, date, kind_of_work, description, price, work_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(client_id, date, kind_of_work, description ?? null, price, work_status ?? "in_progress");

    const entry = db.prepare("SELECT * FROM work_entries WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
