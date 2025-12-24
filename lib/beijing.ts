const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000; // Asia/Shanghai (UTC+8), no DST

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toBeijingDateString(dateUtc: Date): string {
  const beijing = new Date(dateUtc.getTime() + BEIJING_OFFSET_MS);
  const y = beijing.getUTCFullYear();
  const m = beijing.getUTCMonth() + 1;
  const d = beijing.getUTCDate();
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function beijingDayRangeUtc(dateBeijing: string): { startUtc: Date; endUtc: Date } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateBeijing);
  if (!m) throw new Error("Invalid date format. Use YYYY-MM-DD.");
  const y = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  // Beijing midnight (00:00) equals UTC previous day 16:00 (minus 8h).
  const startMs = Date.UTC(y, month - 1, day, 0, 0, 0) - BEIJING_OFFSET_MS;
  const endMs = startMs + 24 * 60 * 60 * 1000;
  return { startUtc: new Date(startMs), endUtc: new Date(endMs) };
}


