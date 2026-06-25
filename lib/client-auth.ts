import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { clientSessionOptions, ClientSessionData } from "./session";

export async function getClientSession() {
  const cookieStore = await cookies();
  return getIronSession<ClientSessionData>(cookieStore, clientSessionOptions);
}

export async function isClientVerified(token: string): Promise<boolean> {
  const session = await getClientSession();
  return session.verifiedTokens?.includes(token) ?? false;
}

export async function verifyClientToken(token: string): Promise<void> {
  const session = await getClientSession();
  const existing = session.verifiedTokens ?? [];
  if (!existing.includes(token)) {
    session.verifiedTokens = [...existing, token];
    await session.save();
  }
}
