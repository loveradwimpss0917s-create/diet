import { clsx } from "@/lib/utils/clsx";

interface ProgressBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  colorClassName?: string;
}

export function ProgressBar({
  label,
  current,
  target,
  unit,
  colorClassName = "bg-emerald-500",
}: ProgressBarProps) {
  const ratio = target > 0 ? current / target : 0;
  const percent = Math.min(ratio, 1) * 100;
  const isOver = current > target;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
        <span
          className={clsx(
            "tabular-nums",
            isOver ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400",
          )}
        >
          {formatNumber(current)} / {formatNumber(target)} {unit}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            isOver ? "bg-red-500 dark:bg-red-500" : colorClassName,
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
