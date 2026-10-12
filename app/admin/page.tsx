import AdminHeader from "./AdminHeader";

export const dynamic = "force-dynamic";

// Admin home. proxy.ts gates every /admin route, so signed-out visitors
// never reach this page.
const PAGES = [
  { href: "/admin/orders", title: "Orders", desc: "Incoming orders, payment links and fulfilment." },
  { href: "/admin/system", title: "System Health", desc: "Env vars, integrations and API usage." },
];

export default function AdminHome() {
  return (
    <div style={{ background: "#fffdf7", minHeight: "100vh" }}>
      <AdminHeader active="home" subtitle="ADMIN HOME" />
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <div className="grid sm:grid-cols-2 gap-5">
          {PAGES.map((p) => (
            <a
              key={p.href}
              href={p.href}
              className="block rounded-xl p-6 transition-colors"
              style={{ background: "#ffffff", border: "1px solid rgba(183,121,31,0.35)", textDecoration: "none" }}
            >
              <p className="font-cinzel text-sm tracking-widest uppercase mb-2" style={{ color: "#b7791f" }}>{p.title}</p>
              <p className="font-lato text-sm" style={{ color: "#4a4a4a" }}>{p.desc}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
