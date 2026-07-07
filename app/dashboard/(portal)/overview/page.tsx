"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { CaseMapWrapper } from "@/components/dashboard/CaseMapWrapper";
import { fetchCases, fetchPatterns } from "@/lib/api";
import { URGENCY_STYLES, STATUS_STYLES, typeColor } from "@/lib/caseTypes";
import type { CaseRecord, PatternAlert } from "@/lib/types";

const URGENCY_COLORS: Record<string, string> = {
  High: "#993C1D",
  Medium: "#ba7517",
  Low: "#0f6e56",
};

export default function OverviewPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [patterns, setPatterns] = useState<PatternAlert[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const all = await fetchCases();
      // Private notes are user-only — never shown on the authority console.
      const c = all.filter((x) => !x.isNote);
      if (alive && c.length) {
        setCases(c);
        setUpdatedAt(new Date());
      }
      if (alive) setLoading(false);
      const p = await fetchPatterns();
      if (alive) setPatterns(p);
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // ── analytics ──
  const a = useMemo(() => {
    const total = cases.length;
    const high = cases.filter((c) => c.urgency === "High").length;
    const resolved = cases.filter((c) => c.status === "Action Taken").length;
    const inReview = cases.filter((c) => c.status === "In Review").length;
    const open = total - resolved;
    const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;

    const byType = new Map<string, number>();
    const byLocation = new Map<string, number>();
    const byPerson = new Map<string, string[]>();
    const urgency = { High: 0, Medium: 0, Low: 0 } as Record<string, number>;
    for (const c of cases) {
      byType.set(c.situationType, (byType.get(c.situationType) ?? 0) + 1);
      byLocation.set(c.location, (byLocation.get(c.location) ?? 0) + 1);
      urgency[c.urgency] = (urgency[c.urgency] ?? 0) + 1;
      const p = (c.peopleInvolved || "").trim();
      if (p && !/unknown|anonymous|family|household|n\/a/i.test(p)) {
        if (!byPerson.has(p)) byPerson.set(p, []);
        byPerson.get(p)!.push(c.id);
      }
    }

    const typeData = [...byType.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((x, y) => y.count - x.count);
    const urgencyData = Object.entries(urgency).map(([name, value]) => ({
      name,
      value,
    }));
    const hotspots = [...byLocation.entries()]
      .map(([location, count]) => ({ location, count }))
      .sort((x, y) => y.count - x.count)
      .slice(0, 5);
    // "Network signals" — the same named recruiter/person across ≥2 cases.
    const networks = [...byPerson.entries()]
      .filter(([, ids]) => ids.length >= 2)
      .map(([name, ids]) => ({ name, count: ids.length }))
      .sort((x, y) => y.count - x.count);

    return {
      total,
      high,
      resolved,
      inReview,
      open,
      resolutionRate,
      typeData,
      urgencyData,
      hotspots,
      networks,
      maxHotspot: hotspots[0]?.count ?? 1,
    };
  }, [cases]);

  const incoming = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? cases.filter((c) =>
          [c.situationType, c.location, c.summary, c.referenceId]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : [...cases];
    // Triage-first ordering: red-flagged cases float to the top so an officer
    // with 50 cases immediately sees the ones that can't wait.
    const bandRank = (c: CaseRecord) =>
      c.riskBand === "red" ? 0 : c.riskBand === "amber" ? 1 : 2;
    return list.sort(
      (a, b) =>
        bandRank(a) - bandRank(b) ||
        (b.redFlags?.length ?? 0) - (a.redFlags?.length ?? 0)
    );
  }, [cases, query]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">
            Operations Overview
          </h1>
          <p className="text-on-surface-variant">
            Real-time case intelligence and network detection.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases, locations, IDs…"
            className="w-56 bg-transparent outline-none"
          />
        </div>
      </div>

      {/* KPI row */}
      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-5">
        <Kpi label="Total cases" value={loading ? "—" : a.total} icon="folder_open" tone="primary" />
        <Kpi label="High urgency" value={loading ? "—" : a.high} icon="priority_high" tone="danger" hint="need action" />
        <Kpi label="In review" value={loading ? "—" : a.inReview} icon="pending" tone="amber" />
        <Kpi label="Resolved" value={loading ? "—" : a.resolved} icon="task_alt" tone="primary" />
        <Kpi label="Resolution rate" value={loading ? "—" : `${a.resolutionRate}%`} icon="trending_up" tone="ink" hint="action taken" />
      </div>

      {/* Charts row */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Urgency donut */}
        <Panel title="Urgency mix">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={a.urgencyData}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
                isAnimationActive={false}
              >
                {a.urgencyData.map((d) => (
                  <Cell key={d.name} fill={URGENCY_COLORS[d.name]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4">
            {a.urgencyData.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: URGENCY_COLORS[d.name] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </Panel>

        {/* Cases by type */}
        <Panel title="Cases by type" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={a.typeData} margin={{ left: -18 }}>
              <XAxis dataKey="type" tick={{ fontSize: 10, fill: "#5f5e5a" }} interval={0} angle={-12} textAnchor="end" height={54} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5f5e5a" }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {a.typeData.map((d) => (
                  <Cell key={d.type} fill={typeColor(d.type)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Pattern Alerts — AI nexus detection (possible same offender / network) */}
      <div className="mb-4 rounded-2xl border border-[#993C1D]/25 bg-[#993C1D]/5 p-5">
        <div className="mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#993C1D]">hub</span>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#993C1D]">
            Pattern alerts · possible networks
          </h2>
          <span className="rounded-full bg-[#993C1D]/15 px-2 py-0.5 text-xs font-bold text-[#993C1D]">
            {patterns.length}
          </span>
        </div>
        <p className="mb-3 text-xs text-on-surface-variant">
          Cases that share an actor, contact, photo or location — scored by
          weighted similarity. Higher % = stronger nexus to act on.
        </p>
        {patterns.length === 0 ? (
          <p className="py-4 text-center text-sm text-on-surface-variant">
            No strong cross-case patterns detected yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {patterns.slice(0, 6).map((p) => (
              <div
                key={`${p.aId}-${p.bId}`}
                className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ${
                      p.matchPercent >= 70
                        ? "bg-[#993C1D]/15 text-[#993C1D]"
                        : "bg-amber/15 text-amber"
                    }`}
                  >
                    {p.matchPercent}% similar
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {p.daysApart === 0
                      ? "same day"
                      : `${p.daysApart} day${p.daysApart > 1 ? "s" : ""} apart`}
                  </span>
                </div>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {p.shared.slice(0, 4).map((s, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] text-on-surface"
                    >
                      {s.type}: {s.value}
                    </span>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  <Link href={`/dashboard/case/${p.aId}`} className="flex items-start gap-1.5 hover:underline">
                    <span
                      className="mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                      style={{ background: `${typeColor(p.situationA)}1a`, color: typeColor(p.situationA) }}
                    >
                      {p.aRef ?? "A"}
                    </span>
                    <span className="line-clamp-1 text-on-surface-variant">{p.summaryA}</span>
                  </Link>
                  <Link href={`/dashboard/case/${p.bId}`} className="flex items-start gap-1.5 hover:underline">
                    <span
                      className="mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                      style={{ background: `${typeColor(p.situationB)}1a`, color: typeColor(p.situationB) }}
                    >
                      {p.bRef ?? "B"}
                    </span>
                    <span className="line-clamp-1 text-on-surface-variant">{p.summaryB}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Geographic hotspots */}
      <div className="mb-4">
        <Panel title="Geographic hotspots" subtitle="Where reports concentrate">
          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
            {a.hotspots.map((h) => (
              <div key={h.location}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-on-surface">{h.location}</span>
                  <span className="text-on-surface-variant">{h.count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-container">
                  <div
                    className="h-2 rounded-full bg-primary-container"
                    style={{ width: `${(h.count / a.maxHotspot) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Map + incoming feed */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-on-surface">Case map</h2>
            {updatedAt && (
              <span className="text-xs text-on-surface-variant">
                Updated {updatedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          <CaseMapWrapper cases={cases} />
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4">
          <h2 className="mb-3 text-lg font-semibold">
            Incoming cases{" "}
            <span className="text-sm font-normal text-on-surface-variant">
              ({incoming.length})
            </span>
          </h2>
          <div className="flex max-h-[440px] flex-col gap-3 overflow-y-auto pr-1">
            {incoming.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/case/${c.id}`}
                className="block rounded-2xl border-l-4 bg-surface-container-low p-4 transition-shadow hover:shadow-sm"
                style={{ borderLeftColor: typeColor(c.situationType) }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase"
                      style={{ background: `${typeColor(c.situationType)}1a`, color: typeColor(c.situationType) }}
                    >
                      {c.situationType}
                    </span>
                    {c.riskBand === "red" && (
                      <span className="rounded-md bg-[#993C1D]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#993C1D]">
                        🚩 {c.redFlags?.length ?? 0}
                      </span>
                    )}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[c.status ?? "New"]}`}>
                    {c.status ?? "New"}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm font-medium text-on-surface">{c.summary}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {c.location}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 font-semibold ${URGENCY_STYLES[c.urgency]}`}>
                    {c.urgency}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone,
  hint,
}: {
  label: string;
  value: string | number;
  icon: string;
  tone: "primary" | "danger" | "amber" | "ink";
  hint?: string;
}) {
  const color = {
    primary: "text-primary",
    danger: "text-[#993C1D]",
    amber: "text-amber",
    ink: "text-on-surface",
  }[tone];
  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          {label}
        </p>
        <span className={`material-symbols-outlined text-[18px] ${color}`}>{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-on-surface-variant">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 ${className}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
        {title}
      </h2>
      {subtitle && <p className="mb-2 text-xs text-on-surface-variant/70">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-3"}>{children}</div>
    </div>
  );
}
