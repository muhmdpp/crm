import db from "./db";

export async function initDB() {
  try {
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
        work_status TEXT NOT NULL DEFAULT 'to_do' CHECK(work_status IN ('to_do','in_progress','completed')),
        billing_status TEXT NOT NULL DEFAULT 'unbilled' CHECK(billing_status IN ('unbilled','invoiced','paid')),
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    await db`CREATE INDEX IF NOT EXISTS idx_work_entries_client ON work_entries(client_id);`;
    await db`CREATE INDEX IF NOT EXISTS idx_work_entries_invoice ON work_entries(invoice_id);`;
    await db`CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);`;
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
  } catch (err) {
    console.error("Failed to initialize database schema:", err);
  }
}

// Ensure the schema is initialized.
// For Next.js in development, this might run multiple times.
// We wrap it in an async IIFE to handle the promise.
(async () => {
  if (typeof window === 'undefined') {
    // We run this in prod too for simple serverless setups without external migration runners
    await initDB();
  }
})();
