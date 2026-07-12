import type { ButtonHTMLAttributes } from "react";
import { clsx } from "@/lib/utils/clsx";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300 dark:disabled:bg-emerald-900",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:disabled:text-zinc-600",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900",
  ghost:
    "bg-transparent text-emerald-700 hover:bg-emerald-50 disabled:text-zinc-400 dark:text-emerald-400 dark:hover:bg-emerald-950 dark:disabled:text-zinc-600",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
