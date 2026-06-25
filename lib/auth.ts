import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { adminSessionOptions, AdminSessionData } from "./session";
import { NextResponse } from "next/server";

export async function getAdminSession() {
  const cookieStore = await cookies();
  return getIronSession<AdminSessionData>(cookieStore, adminSessionOptions);
}

export async function requireAdmin(): Promise<void> {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    throw new Error("UNAUTHORIZED");
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
