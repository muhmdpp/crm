import { NextRequest, NextResponse } from "next/server";
import { logoutClientToken } from "@/lib/client-auth";

type Params = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;
  await logoutClientToken(token);
  return NextResponse.json({ success: true });
}
