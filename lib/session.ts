import { SessionOptions } from "iron-session";

export interface AdminSessionData {
  isAdmin?: boolean;
}

export interface ClientSessionData {
  verifiedTokens?: string[];
}

export const adminSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "deck_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export const clientSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "deck_client_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  },
};
