import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { adminSessionOptions, AdminSessionData } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

    const isValid = password === adminPassword;
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const session = await getIronSession<AdminSessionData>(cookieStore, adminSessionOptions);
    session.isAdmin = true;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
