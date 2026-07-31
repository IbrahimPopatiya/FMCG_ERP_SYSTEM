const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const currencyWholeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatCurrencyWhole(amount: number): string {
  return currencyWholeFormatter.format(amount);
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function toTitleCase(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Turns raw packing strings ("12*1", "12 x 500ml") into shopkeeper-friendly
// labels like "Box of 12" / "Box of 12 · 500ml". Already-phrased values
// ("Box of 18") pass through unchanged.
export function formatPackingLabel(packing: string): string {
  const trimmed = packing.trim();
  if (!trimmed) return trimmed;
  if (/^box\s+of\s+/i.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d+)\s*[x×*]\s*(.+)$/i);
  if (!match) return trimmed;

  const count = match[1];
  const unit = match[2].trim();
  // "12 x 1" / "12*1" means count only — the "1" isn't a useful size label.
  if (/^1(?:\s*(?:pc|pcs|piece|pieces))?$/i.test(unit)) {
    return `Box of ${count}`;
  }
  return `Box of ${count} · ${unit}`;
}
