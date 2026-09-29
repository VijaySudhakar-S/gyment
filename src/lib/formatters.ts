export function fmtRs(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function initials(name: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
