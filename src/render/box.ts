export function box(lines: string[], title?: string, width?: number): string {
  const w = width ?? Math.max(title ? title.length + 4 : 0, ...lines.map((l) => l.length)) + 2;
  const top = title ? `┌─ ${title} ${"─".repeat(Math.max(0, w - title.length - 3))}┐` : `┌${"─".repeat(w)}┐`;
  const body = lines.map((l) => `│ ${l.padEnd(w - 1)}│`);
  return [top, ...body, `└${"─".repeat(w)}┘`].join("\n");
}

export function rule(title = "", char = "─", width = 60): string {
  return title ? `${char.repeat(2)} ${title} ${char.repeat(Math.max(0, width - title.length - 4))}` : char.repeat(width);
}

export function columns(left: string[], right: string[], leftW: number, gap = 3): string[] {
  const n = Math.max(left.length, right.length);
  return Array.from({ length: n }, (_, i) => `${(left[i] ?? "").padEnd(leftW)}${" ".repeat(gap)}${right[i] ?? ""}`);
}