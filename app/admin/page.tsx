// Admin home — a quick read on the last 30 days, which orders are waiting on
// you, and shortcuts to every section. Same layout as the other sites' admin
// home (Epoch Skin, MCS, Jade). proxy.ts gates every /admin route, so
// signed-out visitors never reach this page.
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getDb, initDb } from "@/lib/db"
import { getDB } from "@/lib/insights/db"
import { getInsights } from "@/lib/insights/core"
import { insightsConfig } from "@/lib/insights/config"
import type { Insights } from "@/lib/insights/types"
import { AdminPage, adminBtn } from "@/components/admin/page-frame"
import { ADMIN_SECTIONS } from "@/components/admin/sections"
import { Stat, money, longDate } from "@/components/admin/insights-ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Admin", robots: { index: false } }

const DESCRIPTIONS: Record<string, string> = {
  "/admin/insights": "Sales, order requests, visitors & the order funnel",
  "/admin/orders": "Incoming orders, payment links & fulfilment",
  "/admin/system": "Env vars, integrations & API usage",
}

const TZ = "America/Chicago"
const localDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d)

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: TZ }).format(new Date()))
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"
}

type Waiting = { id: number; name: string; sub: string; total: number; day: string; status: string }

export default async function AdminHome() {
  const today = localDay(new Date())

  // Make sure every table exists before Insights queries them (a no-op once created).
  try { await initDb() } catch (err) { console.error("[admin home] initDb", err) }

  let data: Insights | null = null
  let failed = false
  const idb = getDB()
  if (idb) {
    try { data = await getInsights(idb, insightsConfig, 30) } catch (err) { console.error("[admin home]", err); failed = true }
  }

  let waiting: Waiting[] = []
  try {
    const res = await getDb().execute("SELECT id, customer_name, shipping_city, shipping_state, items, amount_cents, status, created_at FROM orders WHERE status IN ('pending_review','awaiting_payment') ORDER BY created_at ASC LIMIT 6")
    waiting = res.rows.map((r) => {
      let n = 0
      try { n = (JSON.parse(String(r.items)) as { qty?: number }[]).reduce((a, i) => a + (Number(i.qty) || 1), 0) } catch {}
      return {
        id: Number(r.id),
        name: String(r.customer_name),
        sub: `${n ? `${n} item${n === 1 ? "" : "s"} · ` : ""}${r.shipping_city}, ${r.shipping_state}`,
        total: Number(r.amount_cents) / 100,
        day: localDay(new Date(String(r.created_at).replace(" ", "T") + "Z")),
        status: r.status === "awaiting_payment" ? "Awaiting payment" : "Pending review",
      }
    })
  } catch (err) {
    console.error("[admin home] waiting", err)
  }

  const rev = data?.sources.find((s) => s.key === "revenue")
  const paid = data?.sources.find((s) => s.key === "sales")
  const reqs = data?.sources.find((s) => s.key === "requests")
  const needsAttention = data?.attention.filter((a) => a.value > 0) ?? []

  return (
    <AdminPage>
      <div className="mb-6 sm:mb-8">
        <p className="font-cinzel text-[10px] tracking-[0.26em] uppercase text-[#b7791f] mb-1.5">{longDate(today)}</p>
        <h1 className="font-cinzel text-2xl sm:text-3xl text-[#1a1a1a] leading-tight">{greeting()}, Ericka</h1>
      </div>

      {needsAttention.map((a) => (
        <p key={a.label} className="mb-4 text-sm text-red-700 border border-red-300 bg-red-50 px-4 py-3">
          {a.value} {a.label}. <Link href="/admin/orders" className="underline">Review</Link>
        </p>
      ))}

      <section aria-label="Last 30 days" className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-[#6b6b6b]">Last 30 days</h2>
          <Link href="/admin/insights" className="text-xs text-[#b7791f] hover:underline inline-flex items-center gap-1">
            All insights <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {data && rev && paid && reqs ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Revenue" value={money(rev.total)} cur={rev.total} prev={rev.prev} />
            <Stat label="Paid orders" value={String(paid.total)} cur={paid.total} prev={paid.prev} />
            <Stat label="Order requests" value={String(reqs.total)} cur={reqs.total} prev={reqs.prev} />
            <Stat label="Visitors" value={data.visitors.cur.toLocaleString("en-US")} cur={data.visitors.cur} prev={data.visitors.prev} />
          </div>
        ) : (
          <p className="text-sm text-[#6b6b6b] bg-white border border-[#d9c79a] p-4">
            {failed || idb ? "Couldn’t load numbers right now. Sections below still work." : "Numbers need a database connection. Sections below still work."}
          </p>
        )}
      </section>

      <div className="grid gap-8 lg:gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section aria-label="Waiting on you">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-[#6b6b6b]">Waiting on you</h2>
            <Link href="/admin/orders" className="text-xs text-[#b7791f] hover:underline inline-flex items-center gap-1">
              Send payment links <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white border border-[#d9c79a]">
            {waiting.length === 0 ? (
              <div className="p-6 text-center">
                <p className="font-cormorant text-xl text-[#1a1a1a] mb-1">Nothing waiting on you</p>
                <p className="text-sm text-[#6b6b6b]">New order requests and unpaid payment links show up here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#e9dfc8]">
                {waiting.map((o) => (
                  <li key={o.id} className="flex gap-4 px-4 sm:px-5 py-3.5">
                    <div className="w-16 shrink-0">
                      <p className={`text-[10px] tracking-[0.14em] uppercase ${o.day === today ? "text-[#b7791f] font-medium" : "text-[#6b6b6b]"}`}>
                        {o.day === today ? "Today" : longDate(o.day).split(",")[0]}
                      </p>
                      <p className="text-sm text-[#1a1a1a] tabular-nums whitespace-nowrap">{money(o.total)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#1a1a1a] font-medium truncate">{o.name}</p>
                      <p className="text-xs text-[#6b6b6b] truncate">{o.sub}</p>
                      <p className="text-[11px] text-[#6b6b6b]/70 truncate">{o.status} · {longDate(o.day)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/orders" className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-[#e9dfc8] text-xs text-[#6b6b6b] hover:text-[#1a1a1a]">
              All orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        <section aria-label="Sections">
          <h2 className="font-cinzel text-[11px] tracking-[0.2em] uppercase text-[#6b6b6b] mb-3">Go to</h2>
          <div className="grid grid-cols-2 gap-3">
            {[...ADMIN_SECTIONS.filter((s) => s.href === "/admin/insights"), ...ADMIN_SECTIONS.filter((s) => s.href !== "/admin" && s.href !== "/admin/insights")].map(({ href, label, icon: Icon }) => {
              const hero = href === "/admin/insights"
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group border p-4 transition-colors min-w-0 hover:border-[#b7791f] ${hero ? "col-span-2 bg-[#fef3c7]/60 border-[#d9c79a]" : "bg-white border-[#d9c79a]"}`}
                >
                  <Icon className="w-4 h-4 mb-3 text-[#b7791f]" strokeWidth={1.6} aria-hidden />
                  <p className="font-cinzel text-sm tracking-wide leading-tight text-[#1a1a1a]">{label}</p>
                  <p className="text-xs mt-1 leading-snug text-[#6b6b6b]">{DESCRIPTIONS[href]}</p>
                </Link>
              )
            })}
          </div>
          <Link href="/" className={`${adminBtn.secondary} w-full mt-3`}>
            Open the shop
          </Link>
        </section>
      </div>
    </AdminPage>
  )
}
