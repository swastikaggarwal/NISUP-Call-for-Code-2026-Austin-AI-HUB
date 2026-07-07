"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight } from "lucide-react";

// Mock authority login. Any credentials work for the demo.
// TODO: replace with real authentication + role-based access control.
export default function DashboardLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("officer@authority.gov");
  const [password, setPassword] = useState("demo");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-primary">NISUP</h1>
          <p className="text-sm uppercase tracking-widest text-on-surface-variant">
            Authority Dashboard
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/dashboard/overview");
          }}
          className="space-y-4 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Official email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-white transition-all hover:opacity-95 active:scale-[0.98]"
          >
            Sign in <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-xs text-on-surface-variant">
            Demo mode — any credentials are accepted.
          </p>
        </form>
      </div>
    </main>
  );
}
