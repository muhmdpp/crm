"use client";
import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

interface WorkEntry {
  id: number;
  date: string;
  kind_of_work: string;
  description: string | null;
  price: number;
  status_label: string;
  billing_status: string;
  work_status: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  issue_date: string;
  total_amount: number;
  status: string;
  paid_at: string | null;
}

// ─── Skeleton Components ──────────────────────────────────────────────────────

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className ?? ""}`} />
  );
}

function WorkEntrySkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-4 w-2/3" />
          <SkeletonPulse className="h-3 w-1/2" />
          <SkeletonPulse className="h-3 w-1/4 mt-1" />
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          <SkeletonPulse className="h-5 w-16" />
          <SkeletonPulse className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function InvoiceSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-4 w-24" />
          <SkeletonPulse className="h-3 w-20" />
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          <SkeletonPulse className="h-5 w-16" />
          <SkeletonPulse className="h-5 w-14 rounded-full" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-50">
        <SkeletonPulse className="h-4 w-28" />
      </div>
    </div>
  );
}

function WorkHistorySkeletons() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => <WorkEntrySkeleton key={i} />)}
    </div>
  );
}

function InvoiceSkeletons() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => <InvoiceSkeleton key={i} />)}
    </div>
  );
}

// ─── Tab Content ──────────────────────────────────────────────────────────────

function WorkHistoryTab({ entries, loading, token, onWorkAdded }: { entries: WorkEntry[]; loading: boolean; token: string; onWorkAdded: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [kindOfWork, setKindOfWork] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAddWork(e: React.FormEvent) {
    e.preventDefault();
    if (!kindOfWork.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/client/${token}/work`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind_of_work: kindOfWork, description }),
      });
      if (res.ok) {
        setShowForm(false);
        setKindOfWork("");
        setDescription("");
        onWorkAdded();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          {showForm ? "Cancel" : "Request Work"}
        </Button>
      </div>
      
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Request New Work</h3>
          <form onSubmit={handleAddWork} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title / Kind of Work</label>
              <select
                value={kindOfWork === "Logo Design" || kindOfWork === "Poster Design" || kindOfWork === "Web Design" || kindOfWork === "Brochure Design" || kindOfWork === "" ? kindOfWork : "Other"}
                onChange={(e) => {
                  if (e.target.value !== "Other") setKindOfWork(e.target.value);
                  else setKindOfWork("Custom"); // Just a placeholder to trigger the custom input
                }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 mb-2 bg-white"
                required
              >
                <option value="" disabled>Select a kind of work</option>
                <option value="Logo Design">Logo Design</option>
                <option value="Poster Design">Poster Design</option>
                <option value="Web Design">Web Design</option>
                <option value="Brochure Design">Brochure Design</option>
                <option value="Other">Other (Specify)</option>
              </select>
              
              {kindOfWork !== "" && kindOfWork !== "Logo Design" && kindOfWork !== "Poster Design" && kindOfWork !== "Web Design" && kindOfWork !== "Brochure Design" && (
                <input
                  type="text"
                  value={kindOfWork === "Custom" ? "" : kindOfWork}
                  onChange={(e) => setKindOfWork(e.target.value)}
                  placeholder="Enter custom work type"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide some details..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 min-h-[80px]"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={submitting} size="sm">
                Submit Request
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <WorkHistorySkeletons />
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">No work entries yet</p>
          <p className="text-xs text-gray-400 mt-1">Work will appear here once logged</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{entry.kind_of_work}</p>
                  {entry.description && (
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{entry.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">{formatDate(entry.date)}</span>
                    <Badge
                      status={entry.work_status}
                      label={
                        entry.work_status === "to_do" ? "To-Do" :
                        entry.work_status === "in_progress" ? "In Progress" :
                        "Completed"
                      }
                      size="sm"
                    />
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(entry.price)}</p>
                  <Badge
                    status={entry.billing_status}
                    label={entry.status_label}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InvoicesTab({ invoices, token, loading }: { invoices: Invoice[]; token: string; loading: boolean }) {
  if (loading) return <InvoiceSkeletons />;

  if (invoices.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-600">No invoices yet</p>
        <p className="text-xs text-gray-400 mt-1">Your invoices will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((inv) => (
        <div key={inv.id} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{inv.invoice_number}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(inv.issue_date)}</p>
              {inv.paid_at && (
                <p className="text-xs text-green-600 mt-0.5">Paid {formatDate(inv.paid_at)}</p>
              )}
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              <p className="text-base font-bold text-gray-900">{formatCurrency(inv.total_amount)}</p>
              <Badge status={inv.status} size="sm" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50">
            <a
              href={`/api/client/${token}/invoices/${inv.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PIN Entry Screen ─────────────────────────────────────────────────────────

function PinEntry({ token, clientName, onSuccess }: { token: string; clientName: string; onSuccess: (name: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 4) { setError("Please enter your PIN"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/client/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pin }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess(data.clientName);
      } else {
        setError(data.error === "Invalid PIN" ? "Incorrect PIN. Please try again." : "Something went wrong.");
        setPin("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-5 shadow-lg shadow-indigo-200">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{clientName}</h1>
          <p className="text-sm text-gray-400 mt-2">Enter your PIN to view your workspace</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-600 mb-3 text-center">
                Your PIN
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
                className="w-full text-center text-3xl font-bold tracking-[0.5em] border-2 rounded-xl px-4 py-4
                  bg-gray-50 text-gray-900 placeholder-gray-200
                  border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none
                  transition-all duration-200"
                placeholder="••••"
                autoFocus
                autoComplete="off"
              />
              {error && (
                <p className="text-sm text-red-500 text-center mt-2">{error}</p>
              )}
            </div>
            <Button type="submit" loading={loading} size="lg" className="w-full">
              Access Portal
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Your unique workspace · Powered by Watermelon CRM
        </p>
      </div>
    </div>
  );
}

// ─── Main Portal Component ────────────────────────────────────────────────────

export function ClientPortalClient({
  token,
  initialVerified,
  initialClientName,
}: {
  token: string;
  initialVerified: boolean;
  initialClientName: string | null;
}) {
  const [verified, setVerified] = useState(initialVerified);
  const [clientName, setClientName] = useState(initialClientName ?? "");
  const [activeTab, setActiveTab] = useState<"work" | "invoices">("work");

  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [workLoading, setWorkLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch(`/api/client/${token}/logout`, { method: "POST" });
      setVerified(false);
    } finally {
      setSigningOut(false);
    }
  }

  // Always fetch fresh data — never use stale cache
  const fetchWork = useCallback(async () => {
    setWorkLoading(true);
    try {
      const res = await fetch(`/api/client/${token}/work`, { cache: "no-store" });
      if (res.ok) setWorkEntries(await res.json());
    } finally {
      setWorkLoading(false);
    }
  }, [token]);

  const fetchInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const res = await fetch(`/api/client/${token}/invoices`, { cache: "no-store" });
      if (res.ok) setInvoices(await res.json());
    } finally {
      setInvoicesLoading(false);
    }
  }, [token]);

  // Load work entries immediately when verified
  useEffect(() => {
    if (verified) {
      fetchWork();
    }
  }, [verified, fetchWork]);

  // Load invoices when that tab is first opened
  useEffect(() => {
    if (verified && activeTab === "invoices") {
      fetchInvoices();
    }
  }, [verified, activeTab, fetchInvoices]);

  async function handleVerified(name: string) {
    setClientName(name);
    setVerified(true);
    // fetchWork fires via the useEffect above
  }

  function handleTabChange(tab: "work" | "invoices") {
    setActiveTab(tab);
    // Always re-fetch on tab switch to get latest data
    if (tab === "work") fetchWork();
    else fetchInvoices();
  }

  if (!verified) {
    return <PinEntry token={token} clientName={clientName} onSuccess={handleVerified} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Watermelon CRM</p>
              {clientName && <p className="text-xs text-gray-400 leading-tight">{clientName}</p>}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleSignOut} loading={signingOut}>
            Sign Out
          </Button>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 flex gap-1 pb-0">
          {(["work", "invoices"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all capitalize
                ${activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
            >
              {tab === "work" ? "Work History" : "Invoices"}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {activeTab === "work" ? (
          <WorkHistoryTab entries={workEntries} loading={workLoading} token={token} onWorkAdded={fetchWork} />
        ) : (
          <InvoicesTab invoices={invoices} token={token} loading={invoicesLoading} />
        )}
      </main>
    </div>
  );
}
