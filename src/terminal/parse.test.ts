import { describe, it, expect } from "vitest";
import { parse } from "./parse";

describe("parse", () => {
  it("splits cmd/args, lowercases cmd", () => {
    expect(parse("Shorten https://x.com demo")).toMatchObject({ cmd: "shorten", args: ["https://x.com", "demo"] });
  });
  it("handles --flag value, --flag=value, bare --flag, -x", () => {
    const p = parse("ls --sort clicks --json --limit=5 -v");
    expect(p.flags).toEqual({ sort: "clicks", json: true, limit: "5", v: true });
    expect(p.args).toEqual([]);
  });
  it("respects quotes", () => {
    expect(parse(`s "https://x.com/a b" 'my alias'`).args).toEqual(["https://x.com/a b", "my alias"]);
  });
  it("empty input", () => expect(parse("   ").cmd).toBe(""));
  it("treats a bare URL as a shorten command", () => {
    expect(parse("https://example.com")).toMatchObject({ cmd: "shorten", args: ["https://example.com"] });
  });
});