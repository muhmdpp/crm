import postgres from 'postgres';
import fs from 'fs';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const db = postgres(dbUrl, {
  ssl: 'require',
  max: 1
});

async function initDB() {
  try {
    console.log("Creating tables...");
    await db`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        portal_token TEXT NOT NULL UNIQUE,
        pin_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    await db`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        invoice_number TEXT NOT NULL UNIQUE,
        issue_date TEXT NOT NULL,
        total_amount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','paid')),
        pdf_path TEXT,
        paid_at TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    await db`
      CREATE TABLE IF NOT EXISTS work_entries (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        kind_of_work TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        work_status TEXT NOT NULL DEFAULT 'in_progress' CHECK(work_status IN ('in_progress','completed')),
        billing_status TEXT NOT NULL DEFAULT 'unbilled' CHECK(billing_status IN ('unbilled','invoiced','paid')),
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    await db`CREATE INDEX IF NOT EXISTS idx_work_entries_client ON work_entries(client_id);`;
    await db`CREATE INDEX IF NOT EXISTS idx_work_entries_invoice ON work_entries(invoice_id);`;
    await db`CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);`;
    
    console.log("Successfully initialized database tables!");
  } catch (err) {
    console.error("Failed to initialize database schema:");
    console.error(err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

initDB();
