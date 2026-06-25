import Link from "next/link";
import db from "@/lib/db";
import "@/lib/schema";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const invoices = db.prepare(`
    SELECT i.*, c.name as client_name
    FROM invoices i
    JOIN clients c ON c.id = i.client_id
    ORDER BY i.created_at DESC
  `).all() as any[];

  const totalByStatus = {
    draft: invoices.filter((i) => i.status === "draft").reduce((s, i) => s + i.total_amount, 0),
    sent: invoices.filter((i) => i.status === "sent").reduce((s, i) => s + i.total_amount, 0),
    paid: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total_amount, 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Invoices</h1>
        <p className="text-sm text-gray-400 mt-0.5">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total</p>
      </div>

      {/* Summary pills */}
      {invoices.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Draft", value: totalByStatus.draft, status: "draft" },
            { label: "Sent / Awaiting", value: totalByStatus.sent, status: "sent" },
            { label: "Paid", value: totalByStatus.paid, status: "paid" },
          ].map((item) => (
            <div key={item.status} className="bg-white border border-gray-100 rounded-lg px-4 py-2.5 flex items-center gap-3">
              <Badge status={item.status} />
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState
            icon={
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="No invoices yet"
            description="Select unbilled work entries from a client page to generate your first invoice."
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Invoice</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Date</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-4">
                    <Link href={`/admin/invoices/${inv.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{inv.client_name}</td>
                  <td className="px-5 py-4 text-sm text-gray-400 hidden sm:table-cell">{formatDate(inv.issue_date)}</td>
                  <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">{formatCurrency(inv.total_amount)}</td>
                  <td className="px-5 py-4 text-center"><Badge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
