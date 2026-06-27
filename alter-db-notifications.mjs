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
    console.log("Creating notifications table...");
    await db`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        work_entry_id INTEGER REFERENCES work_entries(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    console.log("Success!");
  } catch (e) {
    console.error("Error creating table:", e);
  } finally {
    await db.end();
  }
}

run();
