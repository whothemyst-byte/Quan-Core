import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "qc-surface rounded-[24px] p-5 transition-all duration-200",
        className,
      )}
      style={style}
      {...props}
    />
  );
}

