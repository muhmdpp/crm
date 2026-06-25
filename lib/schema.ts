import db from "./db";

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      portal_token TEXT NOT NULL UNIQUE,
      pin_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      invoice_number TEXT NOT NULL UNIQUE,
      issue_date TEXT NOT NULL,
      total_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','paid')),
      pdf_path TEXT,
      paid_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS work_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      kind_of_work TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL DEFAULT 0,
      work_status TEXT NOT NULL DEFAULT 'in_progress' CHECK(work_status IN ('in_progress','completed')),
      billing_status TEXT NOT NULL DEFAULT 'unbilled' CHECK(billing_status IN ('unbilled','invoiced','paid')),
      invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_work_entries_client ON work_entries(client_id);
    CREATE INDEX IF NOT EXISTS idx_work_entries_invoice ON work_entries(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
  `);
}

// Run on module load (cold start)
initDB();
