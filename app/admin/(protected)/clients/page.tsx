import Link from "next/link";
import db from "@/lib/db";
import "@/lib/schema";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const clients = await db`
    SELECT 
      c.id, c.name, c.email, c.phone, c.portal_token, c.created_at,
      COALESCE(SUM(CASE WHEN we.billing_status = 'unbilled' THEN we.price ELSE 0 END), 0) as unbilled_total,
      COUNT(CASE WHEN we.billing_status = 'unbilled' THEN 1 END) as unbilled_count,
      MAX(we.created_at) as last_activity
    FROM clients c
    LEFT JOIN work_entries we ON we.client_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/admin/clients/new">
          <Button
            size="md"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            New Client
          </Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState
            icon={
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="No clients yet"
            description="Add your first client to start tracking work and generating invoices."
            action={
              <Link href="/admin/clients/new">
                <Button size="sm">Add your first client</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Contact</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Unbilled</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Last Activity</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <Link href={`/admin/clients/${client.id}`} className="block">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {client.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Added {formatDate(client.created_at)}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="text-sm text-gray-600">{client.email ?? "—"}</p>
                      {client.phone && <p className="text-xs text-gray-400">{client.phone}</p>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(client.unbilled_total))}</p>
                      {Number(client.unbilled_count) > 0 && (
                        <p className="text-xs text-amber-600">{client.unbilled_count} entr{Number(client.unbilled_count) !== 1 ? "ies" : "y"}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right hidden md:table-cell">
                      <p className="text-xs text-gray-400">
                        {client.last_activity ? formatDate(client.last_activity) : "No entries"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/clients/${client.id}`}>
                        <span className="text-xs text-indigo-600 hover:text-indigo-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          View →
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
