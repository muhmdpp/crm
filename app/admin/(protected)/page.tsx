import Link from "next/link";
import db from "@/lib/db";
import "@/lib/schema";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${accent ? "border-indigo-100" : "border-gray-100"}`}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? "text-indigo-600" : "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboard() {
  const outstanding = db.prepare(
    "SELECT COALESCE(SUM(price), 0) as total FROM work_entries WHERE billing_status = 'unbilled'"
  ).get() as any;

  const unbilledCount = db.prepare(
    "SELECT COUNT(*) as count FROM work_entries WHERE billing_status = 'unbilled'"
  ).get() as any;

  const paidThisMonth = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total 
    FROM invoices 
    WHERE status = 'paid' AND strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now')
  `).get() as any;

  const recentInvoices = db.prepare(`
    SELECT i.*, c.name as client_name
    FROM invoices i JOIN clients c ON c.id = i.client_id
    ORDER BY i.created_at DESC LIMIT 8
  `).all() as any[];

  const recentEntries = db.prepare(`
    SELECT we.*, c.name as client_name
    FROM work_entries we JOIN clients c ON c.id = we.client_id
    ORDER BY we.created_at DESC LIMIT 6
  `).all() as any[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Overview of your agency's work and billing</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Outstanding"
          value={formatCurrency(outstanding.total)}
          sub="Across all clients"
          accent
        />
        <StatCard
          label="Unbilled Entries"
          value={String(unbilledCount.count)}
          sub="Ready to invoice"
        />
        <StatCard
          label="Collected This Month"
          value={formatCurrency(paidThisMonth.total)}
          sub="From paid invoices"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent invoices */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Recent Invoices</h2>
            <Link href="/admin/invoices" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <EmptyState
              title="No invoices yet"
              description="Generate your first invoice from a client's work entries."
            />
          ) : (
            <table className="w-full">
              <tbody className="divide-y divide-gray-50">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/admin/invoices/${inv.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                        {inv.invoice_number}
                      </Link>
                      <p className="text-xs text-gray-400">{inv.client_name}</p>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(inv.total_amount)}</p>
                      <p className="text-xs text-gray-400">{formatDate(inv.issue_date)}</p>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Badge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent entries */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Recent Work</h2>
            <Link href="/admin/clients" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              Clients →
            </Link>
          </div>
          {recentEntries.length === 0 ? (
            <EmptyState title="No work logged yet" description="Start by adding a client." />
          ) : (
            <div className="divide-y divide-gray-50">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{entry.kind_of_work}</p>
                      <p className="text-xs text-gray-400 truncate">{entry.client_name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(entry.price)}</p>
                      <Badge status={entry.billing_status} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
