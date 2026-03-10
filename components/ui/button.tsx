"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(34,211,238,0.55)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-[rgba(34,211,238,0.44)] bg-[linear-gradient(180deg,#67e8f9_0%,#60a5fa_100%)] text-slate-950 shadow-[0_10px_26px_rgba(34,211,238,0.14)] hover:brightness-105",
        secondary: "border-[rgba(148,163,184,0.18)] bg-[rgba(18,28,43,0.94)] text-slate-100 hover:border-[rgba(34,211,238,0.26)] hover:bg-[rgba(24,38,58,0.98)]",
        outline: "border-[rgba(148,163,184,0.18)] bg-transparent text-slate-100 hover:border-[rgba(34,211,238,0.26)] hover:bg-[rgba(34,211,238,0.08)]",
        ghost: "border-transparent bg-transparent text-slate-200 hover:bg-[rgba(255,255,255,0.05)]",
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };

