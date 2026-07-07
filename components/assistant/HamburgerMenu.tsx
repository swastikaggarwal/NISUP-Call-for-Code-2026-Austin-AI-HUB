"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import type { LanguageCode } from "@/lib/types";

// Slide-in navigation drawer from the top-left menu. Items per build spec §3.2.
// Each item navigates to a real, fresh page.
export function HamburgerMenu({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { language, setLanguageByCode, languages } = useLanguage();

  const items = [
    { icon: "description", label: "My reports", href: "/reports" },
    { icon: "notifications", label: "Alerts near me", href: "/alerts" },
    { icon: "menu_book", label: "Survivor stories", href: "/stories" },
    { icon: "emergency", label: "Emergency help", href: "/emergency" },
    { icon: "shield", label: "Privacy & safety", href: "/privacy" },
    { icon: "admin_panel_settings", label: "Authority dashboard", href: "/dashboard" },
  ];

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[70] flex bg-on-surface/25" onClick={onClose}>
      <aside
        className="flex h-full w-[82%] max-w-xs flex-col bg-surface-container-lowest p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-8 flex items-center justify-between">
          <span className="text-xl font-bold tracking-wide text-primary">
            NISUP
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => go(it.href)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-on-surface transition-colors hover:bg-secondary-container/40"
            >
              <span className="material-symbols-outlined text-primary">
                {it.icon}
              </span>
              <span className="font-body-md text-[15px]">{it.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-6 border-t border-outline-variant/40 pt-5">
          <p className="mb-3 flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">language</span>
            Language
          </p>
          <div className="flex flex-wrap gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                lang={l.code}
                onClick={() => setLanguageByCode(l.code as LanguageCode)}
                className={
                  l.code === language.code
                    ? "rounded-full bg-primary-container px-3 py-1.5 text-sm text-on-primary"
                    : "rounded-full bg-surface-container px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container-high"
                }
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-auto pt-6 font-label-sm text-label-sm leading-relaxed text-on-surface-variant/70">
          If you are in immediate danger, use Emergency help or your local
          emergency number.
        </p>
      </aside>
    </div>
  );
}
