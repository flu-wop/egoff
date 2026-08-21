import AdminHeader from "../AdminHeader";
import SystemHealthClient from "./SystemHealthClient";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  return (
    <div style={{ background: "#fffdf7", minHeight: "100vh" }}>
      <AdminHeader active="system" subtitle="SYSTEM HEALTH" />
      <SystemHealthClient />
    </div>
  );
}
