"use client";

import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/60" onClick={() => onOpenChange(false)} />
      {children}
    </div>
  );
}

export function SheetContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("absolute right-0 top-0 h-full w-full max-w-xl bg-slate-950 p-6 shadow-xl", className)}>{children}</div>;
}

export function SheetHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

export function SheetTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold text-white">{children}</h2>;
}

