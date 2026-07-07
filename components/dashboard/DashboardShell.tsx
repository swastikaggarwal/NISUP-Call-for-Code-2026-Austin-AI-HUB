"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Only real destinations — no dead/duplicate nav items.
const NAV = [
  { href: "/dashboard/overview", label: "Overview", icon: "grid_view" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "insights" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-outline-variant/40 bg-surface-container-lowest px-4 py-6 lg:flex">
        <div className="mb-8 px-3">
          <h1 className="text-xl font-bold text-primary">NISUP</h1>
          <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">
            Authority Console
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 font-label-md text-label-md transition-colors",
                  active
                    ? "bg-primary-container text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container"
                )}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant/40 pt-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-label-md text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
            Back to app
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-label-md text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-outline-variant/40 bg-surface-container-lowest px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              aria-label="Back to app"
              className="flex items-center gap-1 rounded-full border border-outline-variant/50 px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container lg:hidden"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div>
              <p className="text-sm font-semibold text-on-surface">
                Anti-Trafficking Operations
              </p>
              <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Live · syncing incoming reports
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-sm font-semibold text-on-primary">
              AD
            </div>
            <span className="hidden text-sm font-medium sm:inline">
              Admin_Portal
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
