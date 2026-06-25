import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 md:p-8 p-4 pt-16 md:pt-8 max-w-6xl">
        {children}
      </main>
    </div>
  );
}
