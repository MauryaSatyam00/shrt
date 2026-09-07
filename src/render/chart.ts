import type { Bucket } from "@shared/schemas";
import { rpad, trunc } from "./format";

const EIGHTHS = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉"];

export function hbar(buckets: Bucket[], width = 20, labelW = 12): string[] {
  if (!buckets.length) return ["(no data)"];
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return buckets.map((b) => {
    const units = (b.count / max) * width;
    const full = Math.floor(units);
    const frac = EIGHTHS[Math.round((units - full) * 8) % 8];
    return `${trunc(b.label, labelW).padEnd(labelW)} ${"█".repeat(full)}${frac}`.padEnd(labelW + width + 2) + ` ${b.count}`;
  });
}

export function vbar(buckets: Bucket[], height = 6): string[] {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const rows: string[] = [];
  for (let h = height; h >= 1; h--) {
    const full = ((h - 0.5) / height) * max, half = ((h - 1) / height) * max;
    const cells = buckets.map((b) => (b.count >= full ? "██" : b.count > half ? "▄▄" : "  ")).join("");
    rows.push(`${rpad(h === height ? max : h === 1 ? 0 : "", 4)} ┤${cells}`);
  }
  rows.push(`     ┼${"─".repeat(buckets.length * 2)}`);
  rows.push(`      ${buckets.map((b, i) => (i % 3 === 0 ? b.label.padEnd(6) : "")).join("")}`);
  return rows;
}