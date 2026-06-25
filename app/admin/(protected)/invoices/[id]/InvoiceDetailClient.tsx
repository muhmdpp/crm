"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Invoice {
  id: number;
  invoice_number: string;
  issue_date: string;
  total_amount: number;
  status: string;
  paid_at: string | null;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
}

interface WorkEntry {
  id: number;
  date: string;
  kind_of_work: string;
  description: string | null;
  price: number;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function InvoiceDetailClient({ invoice: initialInvoice, entries }: { invoice: Invoice; entries: WorkEntry[] }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState(initialInvoice);
  const [updating, setUpdating] = useState(false);

  async function updateStatus(status: string) {
    if (!confirm(`Mark this invoice as "${status}"?`)) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setInvoice((prev) => ({ ...prev, ...updated }));
        router.refresh();
      }
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => router.push("/admin/invoices")}
            className="text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Invoices
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900">{invoice.invoice_number}</h1>
            <Badge status={invoice.status} />
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{invoice.client_name} · {formatDate(invoice.issue_date)}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Download PDF */}
          <a href={`/api/admin/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button
              variant="secondary"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            >
              Download PDF
            </Button>
          </a>

          {/* Status actions */}
          {invoice.status === "draft" && (
            <Button onClick={() => updateStatus("sent")} loading={updating} variant="secondary">
              Mark as Sent
            </Button>
          )}
          {(invoice.status === "draft" || invoice.status === "sent") && (
            <Button onClick={() => updateStatus("paid")} loading={updating}>
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {/* Invoice card — mirrors PDF layout */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Invoice header */}
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-start flex-wrap gap-4">
          <div>
            <p className="text-lg font-bold text-gray-900">{process.env.NEXT_PUBLIC_AGENCY_NAME ?? "Deck Agency"}</p>
            <p className="text-xs text-gray-400 mt-0.5">Creative Branding Agency</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600">INVOICE</p>
            <p className="text-sm text-gray-400">{invoice.invoice_number}</p>
          </div>
        </div>

        {/* Meta block */}
        <div className="px-8 py-5 border-b border-gray-50 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Billed To</p>
            <p className="text-sm font-semibold text-gray-900">{invoice.client_name}</p>
            {invoice.client_email && <p className="text-sm text-gray-500">{invoice.client_email}</p>}
            {invoice.client_phone && <p className="text-sm text-gray-500">{invoice.client_phone}</p>}
            {invoice.client_address && <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{invoice.client_address}</p>}
          </div>
          <div className="text-right">
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Issue Date</p>
              <p className="text-sm text-gray-700">{formatDate(invoice.issue_date)}</p>
            </div>
            {invoice.paid_at && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Paid On</p>
                <p className="text-sm text-green-600 font-medium">{formatDate(invoice.paid_at)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-8 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Work</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Description</th>
                <th className="px-8 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-8 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(entry.date)}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{entry.kind_of_work}</td>
                  <td className="px-4 py-4 text-sm text-gray-400 hidden md:table-cell max-w-xs">{entry.description ?? "—"}</td>
                  <td className="px-8 py-4 text-right text-sm font-semibold text-gray-900">{formatCurrency(entry.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="px-8 py-5 border-t border-gray-100 flex justify-end">
          <div className="w-48 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal ({entries.length} items)</span>
              <span className="text-gray-700">{formatCurrency(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t-2 border-indigo-200">
              <span className="text-sm font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-indigo-600">{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
