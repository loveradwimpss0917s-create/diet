"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/utils/clsx";

const NAV_ITEMS: { href: string; label: string; icon: string; emphasize?: boolean }[] = [
  { href: "/dashboard", label: "ホーム", icon: "🏠" },
  { href: "/meals", label: "履歴", icon: "📋" },
  { href: "/import", label: "登録", icon: "➕", emphasize: true },
  { href: "/weight", label: "体重", icon: "⚖️" },
  { href: "/settings", label: "設定", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
      <ul className="mx-auto flex max-w-md items-center justify-between px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={clsx(
                  "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-xs font-medium",
                  item.emphasize
                    ? "text-emerald-600 dark:text-emerald-400"
                    : active
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400 dark:text-zinc-500",
                )}
              >
                <span
                  className={clsx(
                    "text-xl leading-none",
                    item.emphasize &&
                      "flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-base text-white",
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
