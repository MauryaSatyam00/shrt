import type { QrMatrixDTO } from "@shared/schemas";

/** Inverted half-block render: light modules = phosphor, dark = background. Quiet zone included. */
export function qrAscii(m: QrMatrixDTO, quiet = 2): string[] {
  const n = m.size + quiet * 2;
  const lit = (y: number, x: number) => {
    const yy = y - quiet,
      xx = x - quiet;
    if (yy < 0 || xx < 0 || yy >= m.size || xx >= m.size) return true;
    return m.rows[yy][xx] === "1";
  };
  const out: string[] = [];
  for (let y = 0; y < n; y += 2) {
    let row = "";
    for (let x = 0; x < n; x++) {
      const t = lit(y, x),
        b = y + 1 < n ? lit(y + 1, x) : true;
      row += t && b ? "█" : t ? "▀" : b ? "▄" : " ";
    }
    out.push(row);
  }
  return out;
}
