import { describe, it, expect } from "vitest";
import { buildClick, clientIp } from "./analytics";

const req = (headers: Record<string, string>) => ({ headers, socket: { remoteAddress: "9.9.9.9" } }) as any;

describe("buildClick", () => {
  it("parses UA, referrer host, country", () => {
    const c = buildClick(req({
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      referer: "https://www.reddit.com/r/x", "x-vercel-ip-country": "US",
    }), "L1");
    expect(c).toMatchObject({ linkId: "L1", referrer: "reddit.com", country: "US", browser: "Chrome", os: "Windows", device: "desktop" });
  });
  it("handles missing everything", () => {
    expect(buildClick(req({}), "L1")).toMatchObject({ referrer: null, country: null, browser: "None", os: "Unknown", device: "desktop" });
  });
  it("ignores malformed referrer", () => {
    expect(buildClick(req({ referer: "::not-a-url" }), "L1").referrer).toBeNull();
  });
  it("visitor hash is stable per (ip, ua, day) and differs across visitors", () => {
    const a = buildClick(req({ "x-forwarded-for": "1.1.1.1, 10.0.0.1", "user-agent": "X" }), "L1").visitorHash;
    const b = buildClick(req({ "x-forwarded-for": "1.1.1.1", "user-agent": "X" }), "L1").visitorHash;
    const c = buildClick(req({ "x-forwarded-for": "2.2.2.2", "user-agent": "X" }), "L1").visitorHash;
    expect(a).toBe(b); expect(a).not.toBe(c);
  });
  it("clientIp prefers first x-forwarded-for hop", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
    expect(clientIp(req({}))).toBe("9.9.9.9");
  });
});