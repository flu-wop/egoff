import { AdminPage, AdminPageHeader } from "@/components/admin/page-frame";
import SystemHealthClient from "./SystemHealthClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "System · Admin", robots: { index: false } };

export default async function AdminSystemPage() {
  return (
    <AdminPage>
      <AdminPageHeader eyebrow="Health" title="System Health" description="Env vars, integrations and API usage — is everything actually working." />
      <SystemHealthClient />
    </AdminPage>
  );
}
