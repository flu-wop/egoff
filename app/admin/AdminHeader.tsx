const NAV_LINKS = [
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/system", label: "System Health" },
];

export default function AdminHeader({
  active,
  subtitle,
}: {
  active: "orders" | "system";
  subtitle: string;
}) {
  return (
    <header
      className="sticky top-0 z-10"
      style={{
        background: "linear-gradient(135deg, #022c22 0%, #0a2218 100%)",
        borderBottom: "1px solid rgba(183,121,31,0.35)",
        boxShadow: "0 4px 28px rgba(2,44,34,0.35)",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-cinzel text-xs tracking-[0.2em]" style={{ color: "#d97706" }}>
            EGOFF <span style={{ color: "#f5ebd0" }}>Essentials</span>
          </p>
          <p className="font-lato text-[11px] tracking-widest mt-1" style={{ color: "rgba(167,243,208,0.55)" }}>
            {subtitle}
          </p>
        </div>

        <nav className="flex items-center gap-2">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === `/admin/${active}`;
            return (
              <a
                key={link.href}
                href={link.href}
                className="font-cinzel text-[11px] tracking-widest uppercase px-3.5 py-2 rounded-full transition-colors"
                style={
                  isActive
                    ? { background: "#b7791f", color: "#fffdf7" }
                    : { background: "transparent", color: "#a7f3d0", border: "1px solid rgba(183,121,31,0.4)" }
                }
              >
                {link.label}
              </a>
            );
          })}
          <a
            href="/api/admin/logout"
            className="font-cinzel text-[11px] tracking-widest uppercase px-3.5 py-2 rounded-full transition-colors"
            style={{ color: "rgba(167,243,208,0.6)" }}
          >
            Log Out
          </a>
        </nav>
      </div>
    </header>
  );
}
