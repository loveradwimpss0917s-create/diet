const JST_TIME_ZONE = "Asia/Tokyo";

/**
 * ISO日時文字列を JST 基準の YYYY-MM-DD に変換する。
 */
export function toJstDateString(isoDatetime: string): string {
  const date = new Date(isoDatetime);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: JST_TIME_ZONE }).format(date);
}

/**
 * 現在時刻を JST 基準の YYYY-MM-DD で返す。
 */
export function todayJstDateString(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: JST_TIME_ZONE }).format(new Date());
}

/**
 * ISO日時文字列を JST 基準の HH:MM に変換する。
 */
export function toJstTimeString(isoDatetime: string): string {
  const date = new Date(isoDatetime);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * YYYY-MM-DD の翌日を YYYY-MM-DD で返す（JST基準の日付範囲クエリ用）。
 */
export function nextDateString(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00+09:00`);
  date.setUTCDate(date.getUTCDate() + 1);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: JST_TIME_ZONE }).format(date);
}

export function formatJstDateLabel(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00+09:00`);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST_TIME_ZONE,
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}
