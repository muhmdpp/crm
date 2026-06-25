"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successData, setSuccessData] = useState<{
    name: string;
    token: string;
    pin: string;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    pin: "",
    customSlug: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function setSlug(raw: string) {
    // Auto-sanitize: lowercase, replace spaces with hyphens, strip invalid chars
    const sanitized = raw.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    set("customSlug", sanitized);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.pin) errs.pin = "PIN is required";
    else if (!/^\d{4,6}$/.test(form.pin)) errs.pin = "PIN must be 4–6 digits";
    if (form.customSlug) {
      if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(form.customSlug)) {
        errs.customSlug = "3–50 chars, lowercase letters/numbers/hyphens, no leading/trailing hyphens";
      }
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.toLowerCase().includes("slug")) {
          setErrors({ customSlug: data.error });
        } else {
          setErrors({ form: data.error });
        }
        return;
      }
      setSuccessData({ name: data.name, token: data.portal_token, pin: form.pin });
    } finally {
      setLoading(false);
    }
  }

  const slugPreview = form.customSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/c/${form.customSlug}`
    : "";

  const portalUrl = successData
    ? `${window.location.origin}/c/${successData.token}`
    : "";


  return (
    <div className="max-w-lg space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-xl font-semibold text-gray-900">New Client</h1>
        <p className="text-sm text-gray-400 mt-0.5">Add a client and set up their portal access</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
              {errors.form}
            </div>
          )}
          <Input
            label="Client Name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Acme Corp"
            required
            error={errors.name}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="contact@acme.com"
            />
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>
          <Textarea
            label="Address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="123 Main Street, Mumbai 400001"
            hint="Optional — appears on invoices"
          />

          <div className="pt-2 border-t border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Portal Access</p>
            <div className="space-y-4">
              {/* Custom slug */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Portal Slug</label>
                  <span className="text-xs text-gray-400">Optional — leave blank for a random one</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 shrink-0">/c/</span>
                  <input
                    id="customSlug"
                    type="text"
                    value={form.customSlug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="acme-corp"
                    maxLength={50}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${
                      errors.customSlug ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 focus:bg-white"
                    }`}
                  />
                </div>
                {errors.customSlug && (
                  <p className="mt-1 text-xs text-red-500">{errors.customSlug}</p>
                )}
                {slugPreview && !errors.customSlug && (
                  <p className="mt-1.5 text-xs text-indigo-500 font-mono truncate">{slugPreview}</p>
                )}
              </div>

              <Input
                label="Client PIN"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={form.pin}
                onChange={(e) => set("pin", e.target.value.replace(/\D/g, ""))}
                placeholder="4–6 digit PIN"
                required
                error={errors.pin}
                hint="The client uses this PIN to access their portal"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1">
              Create Client
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Success modal */}
      <Modal
        open={!!successData}
        onClose={() => router.push("/admin/clients")}
        title="Client created"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <strong>{successData?.name}</strong> has been created. Share these details with your client:
          </p>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Portal Link</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-gray-700 break-all">
                  {portalUrl}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(portalUrl)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                  title="Copy link"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">PIN</p>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg tracking-widest">
                  {successData?.pin}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(successData?.pin ?? "")}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy PIN"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
            <p className="text-xs text-amber-700">Save the PIN now — it cannot be retrieved later. You can set a new one by editing the client.</p>
          </div>

          <Button className="w-full" onClick={() => router.push("/admin/clients")}>
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}
