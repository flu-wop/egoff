// Shared frame for every admin page: width, header and panels.
// Not a client module, so server and client pages can use it freely.
export { adminBtn } from "./admin-btn"

export function AdminPage({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 text-[#1a1a1a]">{children}</main>
}

export function AdminPageHeader({
  eyebrow, title, description, actions,
}: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-6 sm:mb-8">
      <div className="min-w-0">
        {eyebrow && <p className="font-cinzel text-[10px] tracking-[0.26em] uppercase text-[#b7791f] mb-1.5">{eyebrow}</p>}
        <h1 className="font-cinzel text-2xl sm:text-3xl text-[#1a1a1a] leading-tight">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-[#6b6b6b] max-w-2xl">{description}</p>}
      </div>
      {actions}
    </div>
  )
}
