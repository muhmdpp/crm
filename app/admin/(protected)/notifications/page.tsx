import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotificationsClient } from "./NotificationsClient";

export const metadata = {
  title: "Notifications | Watermelon CRM",
};

export default async function NotificationsPage() {
  const session = await getAdminSession();
  if (!session.isAdmin) redirect("/admin/login");

  return <NotificationsClient />;
}
