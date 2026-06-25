import Database from "better-sqlite3";
import path from "path";

// In production (Railway), set DB_PATH=/app/data/deck.db pointing to the mounted volume.
// Locally it defaults to the project root.
const DB_PATH = process.env.DB_PATH ?? path.resolve(process.cwd(), "deck.db");

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function getDB(): Database.Database {
  if (!global.__db) {
    global.__db = new Database(DB_PATH);
    global.__db.pragma("journal_mode = WAL");
    global.__db.pragma("foreign_keys = ON");
  }
  return global.__db;
}

const db = getDB();
export default db;
