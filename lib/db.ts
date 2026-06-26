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
      max: 10,
      onnotice: () => {}, // Suppress "relation already exists" notices
    });
  }
  return global.__db;
}

const db = getDB();
export default db;
