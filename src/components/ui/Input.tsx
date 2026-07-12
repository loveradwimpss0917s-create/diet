import type { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";
import { clsx } from "@/lib/utils/clsx";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="mb-1 block text-sm font-medium text-zinc-700" {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-xl border border-zinc-300 px-3 py-2.5 font-mono text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100",
        className,
      )}
      {...props}
    />
  );
}
