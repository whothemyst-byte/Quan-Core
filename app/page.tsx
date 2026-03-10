import Link from "next/link";
import { Cpu, GitBranch, ShieldCheck, ArrowRight, Zap } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export default function LandingPage() {
  return (
    <main className="min-h-screen qc-grid-bg qc-bg">
      <SiteHeader primaryCtaLabel="Get started" />

      {/* ── Hero ── */}
      <section className="mx-auto grid max-w-7xl gap-12 px-8 py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 qc-pill">
            <Zap className="h-3.5 w-3.5" />
            <span className="text-xs font-medium tracking-[0.18em] uppercase">Multi-agent orchestration</span>
          </div>
          <h1 className="text-[3.65rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
            Orchestrate AI swarms that{" "}
            <span
              className="inline-block"
              style={{
                background: "linear-gradient(135deg, var(--qc-gold), var(--qc-gold-light))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              think in teams.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--qc-text-muted)]">
            Build a repeatable operations loop: a CEO agent sets strategy, a Manager delegates, and specialists execute—fully observable in a live run graph.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Link href="/register">
              <button className="btn-gold flex items-center gap-2 text-sm px-6 py-3">
                Create workspace
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/pricing" className="flex items-center gap-2 text-sm font-medium text-[var(--qc-text-muted)] transition hover:text-white">
              View Pricing <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* ── Flowchart preview ── */}
        <div className="qc-surface rounded-[28px] p-5">
          <div className="qc-surface-strong relative rounded-[20px] p-6" style={{ minHeight: "320px" }}>
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.24em] text-[var(--qc-text-soft)]">
              Live run graph
            </p>

            {/* CEO node */}
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl border border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.07)] px-5 py-3 text-center shadow-[0_0_28px_rgba(34,211,238,0.10)]">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--qc-text-gold)]">CEO</p>
                <p className="mt-1 text-sm font-semibold text-white">Strategic Lead</p>
                <div className="status-dot-green mx-auto mt-2" style={{width:8,height:8}} />
              </div>
            </div>

            {/* Connector line */}
            <div className="flex justify-center mb-4">
              <div style={{ width: 2, height: 28, background: "linear-gradient(180deg, rgba(34,211,238,0.65), rgba(96,165,250,0.55))" }} />
            </div>

            {/* Manager node */}
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[rgba(14,23,42,0.74)] px-5 py-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--qc-text-muted)]">Manager</p>
                <p className="mt-1 text-sm font-semibold text-white">Operations Hub</p>
                <div className="status-dot-green mx-auto mt-2" style={{width:8,height:8}} />
              </div>
            </div>

            {/* Connector branches */}
            <div className="flex justify-center mb-4">
              <div className="flex gap-12 items-start">
                <div style={{ width: 2, height: 24, background: "rgba(96,165,250,0.38)" }} />
                <div style={{ width: 2, height: 24, background: "rgba(96,165,250,0.38)" }} />
                <div style={{ width: 2, height: 24, background: "rgba(96,165,250,0.38)" }} />
              </div>
            </div>

            {/* Specialist nodes */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Researcher", color: "#3b82f6" },
                { label: "Analyst", color: "#8b5cf6" },
                { label: "Writer", color: "#06b6d4" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border bg-[rgba(16,31,47,0.80)] p-3 text-center"
                  style={{ borderColor: `${s.color}33` }}
                >
                  <p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: s.color }}>{s.label}</p>
                  <div className="status-dot-green mx-auto mt-2" style={{ width: 6, height: 6, background: s.color }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="mx-auto max-w-7xl px-8 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Cpu,
              title: "Multi-Agent Collaboration",
              desc: "Hierarchical orchestration with CEO-driven strategic phases and specialist execution.",
              color: "var(--qc-text-gold)",
            },
            {
              icon: GitBranch,
              title: "Live Flowchart",
              desc: "Realtime node graph with animated message edges powered by Supabase realtime events.",
              color: "#60a5fa",
            },
            {
              icon: ShieldCheck,
              title: "Subscription SaaS",
              desc: "Plan-gated agent counts and model policies enforced server-side per workspace.",
              color: "#2fb980",
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="qc-surface rounded-[24px] p-6 transition-all hover:translate-y-[-2px] hover:shadow-[0_10px_46px_rgba(0,0,0,0.40)]"
            >
              <div
                className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: `${color}33`,
                  background: `${color}12`,
                  color,
                }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--qc-text-muted)]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
