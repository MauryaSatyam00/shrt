import { describe, it, expect } from "vitest";
import { hbar, vbar } from "./chart";
import { table } from "./table";
import { qrAscii } from "./qr";
import { box } from "./box";

describe("hbar", () => {
  it("scales to max and aligns counts", () => {
    const out = hbar([{ label: "a", count: 10 }, { label: "b", count: 5 }, { label: "c", count: 0 }], 10, 3);
    expect(out[0]).toMatch(/^a\s+█{10}\s+10$/);
    expect(out[1]).toMatch(/█{5}/);
    expect(out[2]).toMatch(/^c\s+0$/);
  });
  it("handles empty", () => expect(hbar([])).toEqual(["(no data)"]));
});

describe("vbar", () => {
  it("emits height + axis + labels rows", () => {
    const b = Array.from({ length: 24 }, (_, i) => ({ label: String(i).padStart(2, "0"), count: i }));
    const out = vbar(b, 6);
    expect(out).toHaveLength(8);
    expect(out[0]).toContain("23");
    expect(out[out.length - 1]).toContain("00");
  });
});

describe("table", () => {
  it("truncates to max width and draws borders", () => {
    const lines = table(["CODE", "URL"], [["abc", "https://very-long-url.example.com/path"]], [10, 12]).split("\n");
    expect(lines[0].startsWith("┌")).toBe(true);
    expect(lines[3]).toContain("…");
    expect(new Set(lines.map((l) => l.length)).size).toBe(1);
  });
});

describe("box", () => {
  it("pads to widest line", () => {
    const lines = box(["a", "abcdef"], "T").split("\n");
    expect(new Set(lines.map((l) => l.length)).size).toBe(1);
  });
});

describe("qrAscii", () => {
  it("inverts (light=block) with quiet zone and halves rows", () => {
    const out = qrAscii({ size: 2, rows: ["10", "01"] }, 1);
    expect(out).toHaveLength(2);
    expect(out[0]).toHaveLength(4);
    expect(out[0]).toBe("█▄▀█");
  });
});