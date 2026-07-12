import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { clsx } from "@/lib/utils/clsx";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300" {...props} />
  );
}

const fieldBaseClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-950";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(fieldBaseClass, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(fieldBaseClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={clsx(fieldBaseClass, "font-mono text-sm", className)} {...props} />
  );
}
