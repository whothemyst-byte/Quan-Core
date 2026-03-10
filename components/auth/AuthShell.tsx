"use client";

import Link from "next/link";

interface AuthShellProps {
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function AuthShell({ title, description, footer, children }: AuthShellProps) {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center px-6 py-20 qc-grid-bg qc-bg"
    >
      {/* Radial glow behind card */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div
          style={{
            width: 480,
            height: 480,
            background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
      </div>

      <div
        className="qc-surface-strong relative z-10 w-full max-w-[440px] rounded-[24px] px-10 py-9"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--qc-text-soft)] transition hover:text-[var(--qc-text-muted)]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8.5 2.5L3.5 7L8.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to home
        </Link>

        <div className="mt-8 space-y-2">
          <h1 className="text-[2rem] font-bold tracking-[-0.02em] text-white">{title}</h1>
          <p className="text-sm leading-relaxed text-[var(--qc-text-muted)]">{description}</p>
        </div>

        <div className="mt-8">{children}</div>

        <div className="mt-6 text-sm text-[var(--qc-text-muted)]">{footer}</div>
      </div>
    </main>
  );
}
