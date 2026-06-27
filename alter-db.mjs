import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables.");
}

const db = postgres(DATABASE_URL, {
  ssl: "require",
});

async function run() {
  try {
    console.log("Dropping old constraint...");
    await db`ALTER TABLE work_entries DROP CONSTRAINT IF EXISTS work_entries_work_status_check`;
    console.log("Adding new constraint...");
    await db`ALTER TABLE work_entries ADD CONSTRAINT work_entries_work_status_check CHECK(work_status IN ('to_do','in_progress','completed'))`;
    console.log("Success!");
  } catch (e) {
    console.error("Error modifying constraint:", e);
  } finally {
    await db.end();
  }
}

run();
