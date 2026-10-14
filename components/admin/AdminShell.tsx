"use client"
import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { ADMIN_SECTIONS } from "./sections"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const activeRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: "center", block: "nearest" })
  }, [pathname])

  return (
    <div className="admin-root min-h-screen bg-[#fffdf7]">
      <header className="sticky top-0 z-30 bg-[#0a2218] border-b border-[rgba(183,121,31,0.35)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 h-12">
            <Link href="/admin" className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-[#d9a441] shrink-0" aria-hidden />
              <span className="font-cinzel text-sm tracking-[0.12em] text-[#f5ebd0] truncate">EGOFF Essentials</span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#a7f3d0]/60">Admin</span>
            </Link>
            <div className="flex items-center gap-4 shrink-0">
              <Link href="/" target="_blank" className="text-xs text-[#a7f3d0]/70 hover:text-[#f5ebd0]">View site</Link>
              <a href="/api/admin/logout" className="text-xs text-[#a7f3d0]/70 hover:text-[#f5ebd0]">Log out</a>
            </div>
          </div>
          <div className="relative">
            <nav aria-label="Admin sections" className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2.5 pr-8">
              {ADMIN_SECTIONS.map(({ href, icon: Icon, label }) => {
                const active = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/")
                return (
                  <Link
                    key={href}
                    href={href}
                    ref={active ? activeRef : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wide whitespace-nowrap shrink-0 transition-colors ${
                      active ? "bg-[#b7791f] text-[#fffdf7] font-semibold" : "text-[#a7f3d0]/70 hover:text-[#f5ebd0]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden />
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="pointer-events-none absolute right-0 top-0 bottom-2.5 w-8 bg-gradient-to-l from-[#0a2218] to-transparent sm:hidden" />
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
