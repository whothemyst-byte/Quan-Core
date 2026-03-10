import { cn } from "@/lib/utils";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full border border-[rgba(197,164,106,0.26)] bg-[rgba(197,164,106,0.08)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#e3c180]",
        className,
      )}
    >
      {children}
    </span>
  );
}

