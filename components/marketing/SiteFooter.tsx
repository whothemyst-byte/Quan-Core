import { Orbit } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-7xl border-t border-[rgba(148,163,184,0.10)] px-8 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Orbit className="h-4 w-4 text-[var(--qc-text-gold)]" />
          <span className="text-sm font-medium uppercase tracking-[0.1em] text-[var(--qc-text-soft)]">QuanCore</span>
        </div>
        <p className="text-sm text-[var(--qc-text-soft)]">© {new Date().getFullYear()} QuanCore. All rights reserved.</p>
      </div>
    </footer>
  );
}

