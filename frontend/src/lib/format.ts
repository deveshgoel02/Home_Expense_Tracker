const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrFormatterDecimal = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function formatPaise(paise: number, opts?: { decimals?: boolean }): string {
  const rupees = paiseToRupees(paise);
  return opts?.decimals ? inrFormatterDecimal.format(rupees) : inrFormatter.format(rupees);
}

export function formatRupeesNumber(rupees: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(rupees);
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function toDateInputValue(date: Date = new Date()): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthLabel(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function relativeDay(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Yesterday";

  return formatDate(dateStr);
}
