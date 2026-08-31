import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300",
  secondary: "bg-white text-ink-700 border border-surface-border hover:bg-surface-muted",
  ghost: "bg-transparent text-ink-700 hover:bg-surface-muted",
  danger: "bg-status-urgentBg text-status-urgent border border-status-urgent/30 hover:bg-status-urgent/10"
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-2.5 py-1.5 rounded-md",
  md: "text-sm px-3.5 py-2 rounded-lg"
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
