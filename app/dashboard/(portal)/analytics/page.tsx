"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from "recharts";
import { Sparkles, Loader2, TriangleAlert, Info } from "lucide-react";
import { fetchCases, classifyCases } from "@/lib/api";
import { typeColor } from "@/lib/caseTypes";
import type { CaseRecord, Classification } from "@/lib/types";

export default function AnalyticsPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [classification, setClassification] = useState<Classification | null>(null);
  const [classifying, setClassifying] = useState(true);

  useEffect(() => {
    fetchCases().then((all) => {
      // Private notes are user-only — never analysed on the authority console.
      const c = all.filter((x) => !x.isNote);
      setCases(c);
      // AI auto-classification + pattern detection.
      classifyCases(c)
        .then(setClassification)
        .finally(() => setClassifying(false));
    });
  }, []);

  // Bar chart: cases by situation type.
  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cases)
      map.set(c.situationType, (map.get(c.situationType) ?? 0) + 1);
    return [...map.entries()].map(([type, count]) => ({ type, count }));
  }, [cases]);

  // Line chart: cases over time (by date).
  const overTime = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cases) {
      const d = (c.createdAt ?? c.dates ?? "").slice(0, 10) || "Unknown";
      map.set(d, (map.get(d) ?? 0) + 1);
    }
    return [...map.entries()]
      .filter(([d]) => d !== "Unknown")
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date: date.slice(5), count }));
  }, [cases]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-on-surface">Analytics</h1>
        <p className="text-on-surface-variant">
          How NISUP auto-classifies incoming cases and detects networks.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Cases by type">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byType} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e3e0" />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 11, fill: "#5f5e5a" }}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={60}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5f5e5a" }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {byType.map((d) => (
                  <Cell key={d.type} fill={typeColor(d.type)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cases over time">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={overTime} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e3e0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#5f5e5a" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5f5e5a" }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0f6e56"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pattern-detection panel */}
      <div className="mt-4 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-on-surface">
            AI pattern detection
          </h2>
          {classifying && (
            <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" />
          )}
        </div>

        {classifying ? (
          <p className="text-sm text-on-surface-variant">
            NISUP is analysing cases for repeated names, geographic clusters, and
            spikes…
          </p>
        ) : classification && classification.patterns.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {classification.patterns.map((p, i) => (
              <PatternCard key={i} {...p} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">
            No strong cross-case patterns detected in the current set.
          </p>
        )}

        {/* Grouped counts from the classifier */}
        {classification && classification.groups.length > 0 && (
          <div className="mt-5 border-t border-outline-variant/40 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Auto-classified groups
            </p>
            <div className="flex flex-wrap gap-2">
              {classification.groups.map((g) => (
                <span
                  key={g.situationType}
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    background: `${typeColor(g.situationType)}1a`,
                    color: typeColor(g.situationType),
                  }}
                >
                  {g.situationType}: {g.count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
        {title}
      </h2>
      {children}
    </div>
  );
}

function PatternCard({
  title,
  detail,
  severity,
}: {
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
}) {
  const style = {
    info: { ring: "border-primary/20 bg-[#E1F5EE]/40", color: "text-primary", Icon: Info },
    warning: { ring: "border-amber/25 bg-amber/10", color: "text-amber", Icon: TriangleAlert },
    critical: { ring: "border-[#993C1D]/25 bg-[#993C1D]/10", color: "text-[#993C1D]", Icon: TriangleAlert },
  }[severity] ?? { ring: "border-primary/20 bg-[#E1F5EE]/40", color: "text-primary", Icon: Info };

  const Icon = style.Icon;
  return (
    <div className={`rounded-xl border p-4 ${style.ring}`}>
      <div className="mb-1 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${style.color}`} />
        <h3 className={`text-sm font-semibold ${style.color}`}>{title}</h3>
      </div>
      <p className="text-sm text-on-surface-variant">{detail}</p>
    </div>
  );
}
