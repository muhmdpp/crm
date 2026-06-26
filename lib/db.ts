import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables.");
}

declare global {
  // eslint-disable-next-line no-var
  var __db: postgres.Sql | undefined;
}

function getDB(): postgres.Sql {
  if (!global.__db) {
    global.__db = postgres(DATABASE_URL as string, {
      ssl: "require",
      max: 1, // Limit connections per serverless function to prevent pool exhaustion
      idle_timeout: 15, // Close idle connections quickly
      max_lifetime: 60 * 5, // Force new connection every 5 minutes to avoid dead socket errors on warm starts
      onnotice: () => {}, // Suppress "relation already exists" notices
    });
  }
  return global.__db;
}

const db = getDB();
export default db;
