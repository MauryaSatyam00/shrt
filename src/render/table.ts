import { trunc } from "./format";

export function table(headers: string[], rows: string[][], max: number[] = []): string {
  const widths = headers.map((h, i) => {
    const w = Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length));
    return max[i] ? Math.min(w, max[i]) : w;
  });
  const cell = (s: string, i: number) => trunc(s ?? "", widths[i]).padEnd(widths[i]);
  const line = (l: string, m: string, r: string) => l + widths.map((w) => "─".repeat(w + 2)).join(m) + r;
  const row = (r: string[]) => "│ " + r.map(cell).join(" │ ") + " │";
  return [line("┌", "┬", "┐"), row(headers), line("├", "┼", "┤"), ...rows.map(row), line("└", "┴", "┘")].join("\n");
}