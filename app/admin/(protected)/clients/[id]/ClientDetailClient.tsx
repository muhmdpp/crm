"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";

interface WorkEntry {
  id: number;
  date: string;
  kind_of_work: string;
  description: string | null;
  price: number;
  work_status: string;
  billing_status: string;
  invoice_id: number | null;
}

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  portal_token: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  status: string;
  total_amount: number;
  issue_date: string;
}

interface Props {
  client: Client;
  workEntries: WorkEntry[];
  invoices: Invoice[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// --- Inline status dropdown component ---
interface StatusOption { value: string; label: string; }

function StatusDropdown({
  current,
  options,
  onChange,
  updating,
}: {
  current: string;
  options: StatusOption[];
  onChange: (val: string) => void;
  updating?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-flex justify-center">
      <button
        onClick={() => !updating && setOpen((v) => !v)}
        className={`group inline-flex items-center gap-1 rounded-full transition-all ${updating ? "opacity-50 cursor-wait" : "cursor-pointer hover:opacity-80"}`}
        title="Click to change status"
      >
        <Badge status={current} size="sm" />
        {!updating && (
          <svg className="w-2.5 h-2.5 text-gray-400 group-hover:text-gray-600 -ml-0.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
        {updating && (
          <svg className="w-3 h-3 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[130px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${opt.value === current ? "font-semibold text-indigo-600" : "text-gray-700"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                opt.value === "to_do" ? "bg-slate-400" :
                opt.value === "in_progress" ? "bg-amber-400" :
                opt.value === "completed" ? "bg-emerald-400" :
                opt.value === "unbilled" ? "bg-gray-400" :
                opt.value === "invoiced" ? "bg-blue-400" :
                opt.value === "paid" ? "bg-emerald-400" :
                opt.value === "draft" ? "bg-gray-400" :
                opt.value === "sent" ? "bg-blue-400" : "bg-gray-400"
              }`} />
              {opt.label}
              {opt.value === current && (
                <svg className="w-3 h-3 ml-auto text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const WORK_STATUS_OPTIONS: StatusOption[] = [
  { value: "to_do", label: "To-Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const BILLING_STATUS_OPTIONS: StatusOption[] = [
  { value: "unbilled", label: "Unbilled" },
  { value: "invoiced", label: "Invoiced" },
  { value: "paid", label: "Paid" },
];

const INVOICE_STATUS_OPTIONS: StatusOption[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
];

export function ClientDetailClient({ client, workEntries: initialEntries, invoices: initialInvoices }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Track which entry/invoice is being updated
  const [updatingEntry, setUpdatingEntry] = useState<number | null>(null);
  const [updatingInvoice, setUpdatingInvoice] = useState<number | null>(null);

  const [editEntryId, setEditEntryId] = useState<number | null>(null);

  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split("T")[0],
    kind_of_work: "",
    description: "",
    price: "",
    work_status: "to_do",
  });

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const unbilled = entries.filter((e) => e.billing_status === "unbilled").map((e) => e.id);
    if (unbilled.every((id) => selected.has(id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unbilled));
    }
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!entryForm.kind_of_work || !entryForm.price) { setAddError("Work type and price are required"); return; }
    setAddLoading(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/work-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entryForm, price: parseFloat(entryForm.price), client_id: client.id }),
      });
      if (!res.ok) { const d = await res.json(); setAddError(d.error); return; }
      const newEntry = await res.json();
      setEntries((prev) => [newEntry, ...prev]);
      setEntryForm({ date: new Date().toISOString().split("T")[0], kind_of_work: "", description: "", price: "", work_status: "to_do" });
      setShowAddForm(false);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDeleteEntry(id: number) {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/admin/work-entries/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  async function handleEditEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!editEntryId || !entryForm.kind_of_work || !entryForm.price) return;
    setAddLoading(true);
    try {
      const res = await fetch(`/api/admin/work-entries/${editEntryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entryForm, price: parseFloat(entryForm.price) }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEntries((prev) => prev.map((ent) => (ent.id === editEntryId ? updated : ent)));
        setEditEntryId(null);
      }
    } finally {
      setAddLoading(false);
    }
  }

  function openEditModal(entry: WorkEntry) {
    setEntryForm({
      date: entry.date,
      kind_of_work: entry.kind_of_work,
      description: entry.description || "",
      price: entry.price.toString(),
      work_status: entry.work_status,
    });
    setEditEntryId(entry.id);
  }

  async function handleUpdateEntryStatus(id: number, patch: { work_status?: string; billing_status?: string }) {
    setUpdatingEntry(id);
    try {
      const res = await fetch(`/api/admin/work-entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setEntries((prev) => prev.map((e) => e.id === id ? updated : e));
      // If billing status changed away from unbilled, deselect
      if (patch.billing_status && patch.billing_status !== "unbilled") {
        setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
      }
    } finally {
      setUpdatingEntry(null);
    }
  }

  async function handleUpdateInvoiceStatus(id: number, status: string) {
    setUpdatingInvoice(id);
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: updated.status } : inv));
      // If paid, also update linked entries' billing_status in local state
      if (status === "paid") {
        setEntries((prev) => prev.map((e) => e.invoice_id === id ? { ...e, billing_status: "paid" } : e));
      }
    } finally {
      setUpdatingInvoice(null);
    }
  }

  async function handleGenerateInvoice() {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: client.id, entry_ids: Array.from(selected) }),
      });
      if (!res.ok) { alert((await res.json()).error); return; }
      const invoice = await res.json();
      setInvoices((prev) => [invoice, ...prev]);
      setEntries((prev) =>
        prev.map((e) => selected.has(e.id) ? { ...e, billing_status: "invoiced", invoice_id: invoice.id } : e)
      );
      setSelected(new Set());
      setShowInvoiceModal(false);
      router.push(`/admin/invoices/${invoice.id}`);
    } finally {
      setGenerating(false);
    }
  }

  const unbilledEntries = entries.filter((e) => e.billing_status === "unbilled");
  const selectedTotal = entries.filter((e) => selected.has(e.id)).reduce((s, e) => s + e.price, 0);
  const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/c/${client.portal_token}` : `/c/${client.portal_token}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => router.push("/admin/clients")}
            className="text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Clients
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{client.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400 flex-wrap">
            {client.email && <span>{client.email}</span>}
            {client.phone && <span>·</span>}
            {client.phone && <span>{client.phone}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button
              onClick={() => setShowInvoiceModal(true)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            >
              Generate Invoice ({selected.size})
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => setShowAddForm((v) => !v)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Entry
          </Button>
        </div>
      </div>

      {/* Portal link */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs font-medium text-indigo-600 mb-0.5">Client Portal</p>
          <p className="text-xs text-indigo-500 truncate font-mono">{portalUrl}</p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(portalUrl)}
          className="shrink-0 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Copy link
        </button>
      </div>

      {/* Add entry form */}
      {showAddForm && (
        <div className="bg-white border border-indigo-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">New Work Entry</h3>
          <form onSubmit={handleAddEntry} className="space-y-4">
            {addError && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{addError}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date"
                type="date"
                value={entryForm.date}
                onChange={(e) => setEntryForm((p) => ({ ...p, date: e.target.value }))}
                required
              />
              <Input
                label="Price (₹)"
                type="number"
                min="0"
                step="0.01"
                value={entryForm.price}
                onChange={(e) => setEntryForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="5000"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Kind of Work<span className="ml-1 text-red-500">*</span></label>
              <select
                value={entryForm.kind_of_work === "Logo Design" || entryForm.kind_of_work === "Poster Design" || entryForm.kind_of_work === "Web Design" || entryForm.kind_of_work === "Brochure Design" || entryForm.kind_of_work === "" ? entryForm.kind_of_work : "Other"}
                onChange={(e) => {
                  if (e.target.value !== "Other") setEntryForm((p) => ({ ...p, kind_of_work: e.target.value }));
                  else setEntryForm((p) => ({ ...p, kind_of_work: "Custom" }));
                }}
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 bg-white border-gray-200 hover:border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-1"
                required
              >
                <option value="" disabled>Select a kind of work</option>
                <option value="Logo Design">Logo Design</option>
                <option value="Poster Design">Poster Design</option>
                <option value="Web Design">Web Design</option>
                <option value="Brochure Design">Brochure Design</option>
                <option value="Other">Other (Specify)</option>
              </select>
              
              {entryForm.kind_of_work !== "" && entryForm.kind_of_work !== "Logo Design" && entryForm.kind_of_work !== "Poster Design" && entryForm.kind_of_work !== "Web Design" && entryForm.kind_of_work !== "Brochure Design" && (
                <Input
                  value={entryForm.kind_of_work === "Custom" ? "" : entryForm.kind_of_work}
                  onChange={(e) => setEntryForm((p) => ({ ...p, kind_of_work: e.target.value }))}
                  placeholder="Enter custom work type"
                  required
                />
              )}
            </div>
            <Textarea
              label="Description"
              value={entryForm.description}
              onChange={(e) => setEntryForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Additional details about the work…"
            />
            <Select
              label="Work Status"
              value={entryForm.work_status}
              onChange={(e) => setEntryForm((p) => ({ ...p, work_status: e.target.value }))}
              options={[
                { value: "to_do", label: "To-Do" },
                { value: "in_progress", label: "In Progress" },
                { value: "completed", label: "Completed" },
              ]}
            />
            <div className="flex gap-2 pt-1">
              <Button type="submit" loading={addLoading} size="sm">Add Entry</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Work entries table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Work Entries</h2>
          {unbilledEntries.length > 0 && (
            <button
              onClick={toggleAll}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {unbilledEntries.every((e) => selected.has(e.id)) ? "Deselect all" : "Select all unbilled"}
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <EmptyState
            title="No work entries yet"
            description="Add your first entry using the button above."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Work</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Price</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Billing</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((entry) => {
                  const isSelectable = entry.billing_status === "unbilled";
                  const isSelected = selected.has(entry.id);
                  const isUpdating = updatingEntry === entry.id;
                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${isSelected ? "bg-indigo-50/50" : "hover:bg-gray-50/40"}`}
                    >
                      <td className="px-4 py-3">
                        {isSelectable && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(entry.id)}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(entry.date)}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{entry.kind_of_work}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell max-w-xs truncate">
                        {entry.description ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(entry.price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusDropdown
                          current={entry.work_status}
                          options={WORK_STATUS_OPTIONS}
                          onChange={(val) => handleUpdateEntryStatus(entry.id, { work_status: val })}
                          updating={isUpdating}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusDropdown
                          current={entry.billing_status}
                          options={BILLING_STATUS_OPTIONS}
                          onChange={(val) => handleUpdateEntryStatus(entry.id, { billing_status: val })}
                          updating={isUpdating}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEditModal(entry)}
                            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors rounded"
                            title="Edit entry"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          {isSelectable && (
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
                              title="Delete entry"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoices list */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-5 py-3">
                      <a href={`/admin/invoices/${inv.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                        {inv.invoice_number}
                      </a>
                      <p className="text-xs text-gray-400">{formatDate(inv.issue_date)}</p>
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <StatusDropdown
                        current={inv.status}
                        options={INVOICE_STATUS_OPTIONS}
                        onChange={(val) => handleUpdateInvoiceStatus(inv.id, val)}
                        updating={updatingInvoice === inv.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Generate Invoice">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You're about to generate an invoice for <strong>{selected.size}</strong> selected entr{selected.size !== 1 ? "ies" : "y"}.
          </p>
          <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Amount</span>
            <span className="text-lg font-bold text-indigo-600">{formatCurrency(selectedTotal)}</span>
          </div>
          <p className="text-xs text-gray-400">
            This will create a draft invoice. You can mark it as sent and then paid from the invoice page.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleGenerateInvoice} loading={generating} className="flex-1">
              Generate Invoice
            </Button>
            <Button variant="secondary" onClick={() => setShowInvoiceModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal open={editEntryId !== null} onClose={() => setEditEntryId(null)} title="Edit Work Entry">
        <form onSubmit={handleEditEntry} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={entryForm.date}
              onChange={(e) => setEntryForm((p) => ({ ...p, date: e.target.value }))}
              required
            />
            <Input
              label="Price (₹)"
              type="number"
              min="0"
              step="0.01"
              value={entryForm.price}
              onChange={(e) => setEntryForm((p) => ({ ...p, price: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Kind of Work<span className="ml-1 text-red-500">*</span></label>
            <select
              value={entryForm.kind_of_work === "Logo Design" || entryForm.kind_of_work === "Poster Design" || entryForm.kind_of_work === "Web Design" || entryForm.kind_of_work === "Brochure Design" || entryForm.kind_of_work === "" ? entryForm.kind_of_work : "Other"}
              onChange={(e) => {
                if (e.target.value !== "Other") setEntryForm((p) => ({ ...p, kind_of_work: e.target.value }));
                else setEntryForm((p) => ({ ...p, kind_of_work: "Custom" }));
              }}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 bg-white border-gray-200 hover:border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-1"
              required
            >
              <option value="" disabled>Select a kind of work</option>
              <option value="Logo Design">Logo Design</option>
              <option value="Poster Design">Poster Design</option>
              <option value="Web Design">Web Design</option>
              <option value="Brochure Design">Brochure Design</option>
              <option value="Other">Other (Specify)</option>
            </select>
            
            {entryForm.kind_of_work !== "" && entryForm.kind_of_work !== "Logo Design" && entryForm.kind_of_work !== "Poster Design" && entryForm.kind_of_work !== "Web Design" && entryForm.kind_of_work !== "Brochure Design" && (
              <Input
                value={entryForm.kind_of_work === "Custom" ? "" : entryForm.kind_of_work}
                onChange={(e) => setEntryForm((p) => ({ ...p, kind_of_work: e.target.value }))}
                placeholder="Enter custom work type"
                required
              />
            )}
          </div>
          <Textarea
            label="Description"
            value={entryForm.description}
            onChange={(e) => setEntryForm((p) => ({ ...p, description: e.target.value }))}
          />
          <Select
            label="Work Status"
            value={entryForm.work_status}
            onChange={(e) => setEntryForm((p) => ({ ...p, work_status: e.target.value }))}
            options={[
              { value: "to_do", label: "To-Do" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
            ]}
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditEntryId(null)}>Cancel</Button>
            <Button type="submit" loading={addLoading}>Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
