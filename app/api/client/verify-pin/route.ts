import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import "@/lib/schema";
import bcrypt from "bcryptjs";
import { verifyClientToken } from "@/lib/client-auth";

export async function POST(req: NextRequest) {
  try {
    const { token, pin } = await req.json();

    if (!token || !pin) {
      return NextResponse.json({ error: "Token and PIN required" }, { status: 400 });
    }

    const client = (await db`SELECT * FROM clients WHERE portal_token = ${token}`)[0];
    if (!client) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(String(pin), client.pin_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    await verifyClientToken(token);
    return NextResponse.json({ success: true, clientName: client.name });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
