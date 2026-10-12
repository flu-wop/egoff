// app/admin/insights/page.tsx
// Street Beat insights. Server-rendered; the tab and range live in the URL
// (?tab=funnel&days=90) so refreshes and shared links keep them.
import Link from "next/link"
import { getDB } from "@/lib/insights/db"
import { getInsights } from "@/lib/insights/core"
import { insightsConfig } from "@/lib/insights/config"
import AdminHeader from "../AdminHeader"
import { RangePicker } from "@/components/admin/RangePicker"
import { Overview, PagesTab, FunnelTab, longDate } from "@/components/admin/insights-ui"
import type { Insights } from "@/lib/insights/types"

export const dynamic = "force-dynamic"
export const metadata = { title: "Insights · Admin", robots: { index: false } }

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "pages", label: "Pages" },
  { id: "funnel", label: "Funnel" },
]

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ tab?: string; days?: string }> }) {
  // No auth check here: the proxy gates every /admin route.
  const sp = await searchParams
  const tab = TABS.some((t) => t.id === sp.tab) ? sp.tab! : "overview"
  const days = [7, 30, 90, 365].includes(Number(sp.days)) ? Number(sp.days) : 30

  const db = getDB()
  let data: Insights | null = null
  let failed = false
  if (db) {
    try { data = await getInsights(db, insightsConfig, days) } catch (err) { console.error("[insights]", err); failed = true }
  }

  const keep = days === 30 ? "" : `&days=${days}`

  return (
    <div className="min-h-screen bg-[#fffdf7]">
      <AdminHeader active="insights" subtitle="INSIGHTS" />
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <Link href="/admin" className="text-[#6b6b6b] text-xs hover:text-[#b7791f] transition-colors">&larr; Admin home</Link>
        <div className="flex items-end justify-between gap-4 flex-wrap mt-1 mb-6">
          <div>
            <h1 className="font-cinzel text-3xl text-[#1a1a1a]">Insights</h1>
            <p className="text-[#6b6b6b] text-xs mt-1">{data ? `${longDate(data.range.start)} – ${longDate(data.range.end)}` : "How the site is doing"}</p>
          </div>
          <RangePicker days={days} />
        </div>

        <nav className="flex gap-1 mb-6 border-b border-[#d9c79a]" aria-label="Insights tabs">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/admin/insights?tab=${t.id}${keep}`}
              aria-current={tab === t.id ? "page" : undefined}
              className={`px-4 py-2 text-sm -mb-px border-b-2 ${tab === t.id ? "border-[#b7791f] text-[#b7791f]" : "border-transparent text-[#6b6b6b] hover:text-[#1a1a1a]"}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {!db && <p className="text-[#6b6b6b] text-sm mb-4">Insights needs a database connection. Check <code>TURSO_URL</code> in Vercel.</p>}
        {failed && <p className="text-red-300 text-sm mb-4">Couldn&apos;t reach the database. Refresh in a moment.</p>}
        {data && !data.trackingSince && (
          <p className="text-[#6b6b6b] text-sm mb-4">Visitor tracking is live. Sales are complete; visitors and page times start counting from today.</p>
        )}
        {data?.trackingSince && data.trackingSince.slice(0, 10) > data.range.start && (
          <p className="text-[#6b6b6b] text-sm mb-4">Visitor numbers start {longDate(data.trackingSince.slice(0, 10))}, when tracking went live. Sales cover the full range.</p>
        )}

        {data && tab === "overview" && <Overview data={data} />}
        {data && tab === "pages" && <PagesTab data={data} />}
        {data && tab === "funnel" && <FunnelTab data={data} />}
      </div>
    </div>
  )
}
