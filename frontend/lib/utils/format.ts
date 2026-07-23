export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isWithinDateRange(iso: string, from: string, to: string): boolean {
  const d = new Date(iso).getTime();
  return d >= new Date(from).getTime() && d <= new Date(`${to}T23:59:59`).getTime();
}

export function isSameDate(iso: string, dateInput: string): boolean {
  return iso.slice(0, 10) === dateInput || new Date(iso).toISOString().slice(0, 10) === dateInput;
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toTitleCase(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
