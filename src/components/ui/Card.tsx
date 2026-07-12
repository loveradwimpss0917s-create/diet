import type { HTMLAttributes } from "react";
import { clsx } from "@/lib/utils/clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm", className)}
      {...props}
    />
  );
}
