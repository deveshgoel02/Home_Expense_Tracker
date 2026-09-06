export function monthRange(month: number, year: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return { start, end };
}

export function previousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

export function daysInMonth(month: number, year: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function todayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return { start, end };
}

export function weekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}
