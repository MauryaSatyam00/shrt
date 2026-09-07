import { describe, it, expect } from "vitest";
import {
  UrlSchema,
  AliasSchema,
  CreateLinkSchema,
  LoginSchema,
} from "./schemas";

describe("UrlSchema", () => {
  it("prepends https and keeps http", () => {
    expect(UrlSchema.parse(" example.com/a?b=1 ")).toBe(
      "https://example.com/a?b=1",
    );
    expect(UrlSchema.parse("http://x.io")).toBe("http://x.io");
  });
  it("rejects non-http schemes and garbage", () => {
    expect(UrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(UrlSchema.safeParse("mailto:a@b.c").success).toBe(false);
    expect(UrlSchema.safeParse("").success).toBe(false);
  });
});

describe("AliasSchema", () => {
  it.each(["abc", "my-link_1", "A".repeat(32)])("accepts %s", (a) =>
    expect(AliasSchema.safeParse(a).success).toBe(true),
  );
  it.each(["ab", "has space", "a".repeat(33), "API", "healthz", "ünï"])(
    "rejects %s",
    (a) => expect(AliasSchema.safeParse(a).success).toBe(false),
  );
  it("rejects reserved aliases case-insensitively", () => {
    expect(AliasSchema.safeParse("API").success).toBe(false);
    expect(AliasSchema.safeParse("Healthz").success).toBe(false);
  });
});

describe("CreateLinkSchema / LoginSchema", () => {
  it("defaults expiry to never", () =>
    expect(CreateLinkSchema.parse({ url: "x.com" }).expiresIn).toBe("never"));
  it("rejects bad expiry", () =>
    expect(
      CreateLinkSchema.safeParse({ url: "x.com", expiresIn: "2w" }).success,
    ).toBe(false));
  it("enforces password length", () =>
    expect(
      LoginSchema.safeParse({ handle: "ok", password: "abc" }).success,
    ).toBe(false));
});
