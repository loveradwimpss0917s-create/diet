import { clsx } from "@/lib/utils/clsx";

type RecognitionType = "商品" | "一般料理" | "推定";

const STYLES: Record<RecognitionType, string> = {
  商品: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  一般料理: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  推定: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

export function RecognitionTypeBadge({ type }: { type: RecognitionType }) {
  return (
    <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium", STYLES[type])}>
      {type}
    </span>
  );
}
