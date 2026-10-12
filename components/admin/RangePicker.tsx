"use client"
// Date-range switch for Insights: writes ?days= into the URL so the server
// page recomputes, keeping the current tab.
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTransition } from "react"

const RANGES = [{ v: 7, l: "7d" }, { v: 30, l: "30d" }, { v: 90, l: "90d" }, { v: 365, l: "1y" }]

export function RangePicker({ days }: { days: number }) {
  const router = useRouter()
  const path = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()
  function set(v: number) {
    const p = new URLSearchParams(params.toString())
    if (v === 30) p.delete("days"); else p.set("days", String(v))
    start(() => router.replace(`${path}${p.size ? `?${p}` : ""}`, { scroll: false }))
  }
  return (
    <div className="flex items-center gap-2">
      {pending && <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin text-[#b7791f]" role="status" aria-label="Loading" />}
      <div role="radiogroup" aria-label="Date range" className="inline-flex p-0.5 border border-[#d9c79a] bg-white rounded-sm">
        {RANGES.map((r) => (
          <button
            key={r.v}
            role="radio"
            aria-checked={days === r.v}
            onClick={() => set(r.v)}
            className={`px-3 min-h-[32px] text-xs tracking-wide rounded-[1px] transition-colors ${days === r.v ? "bg-[#b7791f] text-[#fffdf7]" : "text-[#6b6b6b] hover:text-[#1a1a1a]"}`}
          >
            {r.l}
          </button>
        ))}
      </div>
    </div>
  )
}
