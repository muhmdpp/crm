"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  portal_token: string;
}

export default function EditClientPage({ client }: { client: Client }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: client.name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    address: client.address ?? "",
    pin: "",
    customSlug: client.portal_token,
  });

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  }

  function setSlug(raw: string) {
    const sanitized = raw.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    set("customSlug", sanitized);
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const slugPreview = form.customSlug ? `${origin}/c/${form.customSlug}` : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (form.pin && !/^\d{4,6}$/.test(form.pin)) errs.pin = "PIN must be 4–6 digits";
    if (form.customSlug && !/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(form.customSlug)) {
      errs.customSlug = "3–50 chars, lowercase letters/numbers/hyphens, no leading/trailing hyphens";
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PUT",
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
      router.push(`/admin/clients/${client.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

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
        <h1 className="text-xl font-semibold text-gray-900">Edit Client</h1>
        <p className="text-sm text-gray-400 mt-0.5">Update {client.name}'s details</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">{errors.form}</div>
          )}
          <Input label="Client Name" value={form.name} onChange={(e) => set("name", e.target.value)} required error={errors.name} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            <Input label="Phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <Textarea label="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />

          <div className="pt-2 border-t border-gray-50 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Portal Access</p>

            {/* Slug field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Portal Slug</label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 shrink-0">/c/</span>
                <input
                  id="customSlug"
                  type="text"
                  value={form.customSlug}
                  onChange={(e) => setSlug(e.target.value)}
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
              label="New PIN (optional)"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={form.pin}
              onChange={(e) => set("pin", e.target.value.replace(/\D/g, ""))}
              placeholder="Leave blank to keep current PIN"
              hint="Only fill this to change the client's PIN"
              error={errors.pin}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1">Save Changes</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
