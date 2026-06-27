import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import "@/lib/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "true";

  let notifications;
  if (unreadOnly) {
    notifications = await db`
      SELECT id, client_id, work_entry_id, message, is_read, created_at 
      FROM notifications 
      WHERE is_read = false 
      ORDER BY created_at DESC
    `;
  } else {
    notifications = await db`
      SELECT id, client_id, work_entry_id, message, is_read, created_at 
      FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 100
    `;
  }

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  try { await requireAdmin(); } catch { return unauthorizedResponse(); }

  const body = await req.json();

  if (body.id) {
    await db`UPDATE notifications SET is_read = true WHERE id = ${body.id}`;
  } else if (body.markAllRead) {
    await db`UPDATE notifications SET is_read = true WHERE is_read = false`;
  }

  return NextResponse.json({ success: true });
}
