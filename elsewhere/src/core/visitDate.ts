/** Calendar dates are stored without a timezone so travel cannot shift the visit day. */
export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Sample dates for the preview, spread across the previous six months. */
export function randomVisitDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1 - Math.floor(Math.random() * 180));
  return localDateKey(date);
}

export function parseVisitDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return year >= 1000 && localDateKey(date) === value ? date : null;
}

export function formatVisitDate(value: string): string {
  const date = parseVisitDate(value);
  return date ? date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  }) : "";
}
