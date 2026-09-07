import { describe, it, expect } from "vitest";
import request from "supertest";
import { db } from "../test/fakeDb";
import app from "../app";

const json = { "content-type": "application/json" };
let key = "";

describe("auth", () => {
  it("registers a new handle and marks first user as sysop", async () => {
    const r = await request(app).post("/api/auth/login").set(json).send({ handle: "sysop", password: "hunter2" });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ handle: "sysop", isNew: true, isSysop: true });
    expect(r.body.apiKey).toMatch(/^shrt_/);
    key = r.body.apiKey;
  });
  it("rejects wrong password", async () => {
    expect((await request(app).post("/api/auth/login").set(json).send({ handle: "sysop", password: "nope" })).status).toBe(401);
  });
  it("validates handle", async () => {
    expect((await request(app).post("/api/auth/login").set(json).send({ handle: "a b", password: "hunter2" })).status).toBe(400);
  });
  it("/me works with key and fails without", async () => {
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
    const r = await request(app).get("/api/auth/me").set("authorization", `Bearer ${key}`);
    expect(r.body).toMatchObject({ handle: "sysop", linkCount: 0 });
  });
});

describe("links", () => {
  it("creates an anonymous link with a generated 7-char code", async () => {
    const r = await request(app).post("/api/links").set(json).send({ url: "github.com" });
    expect(r.status).toBe(201);
    expect(r.body.code).toHaveLength(7);
    expect(r.body.url).toBe("https://github.com");
    expect(r.body.owned).toBe(false);
    expect(r.body.shortUrl).toBe(`https://sh.rt/${r.body.code}`);
  });
  it("creates an owned aliased link with expiry", async () => {
    const r = await request(app).post("/api/links").set(json).set("authorization", `Bearer ${key}`)
      .send({ url: "https://example.com", alias: "demo", expiresIn: "7d" });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ code: "demo", owned: true });
    expect(r.body.expiresAt).not.toBeNull();
  });
  it("rejects duplicate alias, reserved alias, bad url", async () => {
    expect((await request(app).post("/api/links").set(json).send({ url: "https://x.com", alias: "demo" })).status).toBe(409);
    expect((await request(app).post("/api/links").set(json).send({ url: "https://x.com", alias: "api" })).status).toBe(400);
    expect((await request(app).post("/api/links").set(json).send({ url: "ftp://x.com" })).status).toBe(400);
    expect((await request(app).post("/api/links").set(json).send({ url: "not a url" })).status).toBe(400);
  });
  it("lists only my links", async () => {
    const r = await request(app).get("/api/links").set("authorization", `Bearer ${key}`);
    expect(r.body.map((l: any) => l.code)).toEqual(["demo"]);
  });
  it("forbids touching someone else's link", async () => {
    const other = (await request(app).post("/api/auth/login").set(json).send({ handle: "mallory", password: "hunter2" })).body.apiKey;
    expect((await request(app).get("/api/links/demo").set("authorization", `Bearer ${other}`)).status).toBe(403);
    expect((await request(app).delete("/api/links/demo").set("authorization", `Bearer ${other}`)).status).toBe(403);
  });
});

describe("redirect + analytics", () => {
  it("302s, logs a click, sets no-store", async () => {
    const r = await request(app).get("/demo")
      .set("user-agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
      .set("referer", "https://www.twitter.com/x").set("x-vercel-ip-country", "DE");
    expect(r.status).toBe(302);
    expect(r.headers.location).toBe("https://example.com");
    expect(r.headers["cache-control"]).toBe("no-store");
    const c = db._tables.clicks.at(-1)!;
    expect(c).toMatchObject({ referrer: "twitter.com", country: "DE", browser: "Mobile Safari", os: "iOS", device: "mobile" });
    expect(c.visitorHash).toHaveLength(32);
  });
  it("404s unknown code with BBS page", async () => {
    const r = await request(app).get("/nope123");
    expect(r.status).toBe(404);
    expect(r.text).toContain("NO CARRIER");
  });
  it("410s expired link", async () => {
    db._tables.links.push({ id: "old", code: "expired1", url: "https://x.com", createdAt: new Date(), expiresAt: new Date(Date.now() - 1000), userId: null });
    const r = await request(app).get("/expired1");
    expect(r.status).toBe(410);
    expect(r.text).toContain("LINE DISCONNECTED");
  });
  it("aggregates stats", async () => {
    await request(app).get("/demo").set("user-agent", "curl/8.0");
    const r = await request(app).get("/api/links/demo/stats?range=7d").set("authorization", `Bearer ${key}`);
    expect(r.status).toBe(200);
    expect(r.body.total).toBe(2);
    expect(r.body.unique).toBe(2);
    expect(r.body.byHour).toHaveLength(24);
    expect(r.body.byDay).toHaveLength(7);
    expect(r.body.byDay.at(-1).count).toBe(2);
    expect(r.body.referrers).toEqual(expect.arrayContaining([{ label: "twitter.com", count: 1 }, { label: "direct", count: 1 }]));
    expect(r.body.recent[0]).not.toHaveProperty("visitorHash");
  });
  it("rejects bad range", async () => {
    expect((await request(app).get("/api/links/demo/stats?range=1y").set("authorization", `Bearer ${key}`)).status).toBe(400);
  });
});

describe("qr", () => {
  it("serves matrix / svg / png publicly", async () => {
    const m = await request(app).get("/api/links/demo/qr?format=matrix");
    expect(m.status).toBe(200);
    expect(m.body.rows).toHaveLength(m.body.size);
    expect(m.body.rows[0]).toMatch(/^[01]+$/);
    const svg = await request(app).get("/api/links/demo/qr");
    expect(svg.headers["content-type"]).toMatch(/svg/);
    expect(svg.headers["cache-control"]).toContain("immutable");
    const png = await request(app).get("/demo/qr").buffer().parse((res, cb) => {
      const b: Buffer[] = []; res.on("data", (d) => b.push(d)); res.on("end", () => cb(null, Buffer.concat(b)));
    });
    expect(png.headers["content-type"]).toMatch(/png/);
    expect((png.body as Buffer).subarray(1, 4).toString()).toBe("PNG");
  });
  it("404s unknown code", async () => {
    expect((await request(app).get("/api/links/zzzz/qr")).status).toBe(404);
  });
});

describe("delete", () => {
  it("cascades clicks", async () => {
    const linkId = db._tables.links.find((l) => l.code === "demo")!.id;
    const r = await request(app).delete("/api/links/demo").set("authorization", `Bearer ${key}`);
    expect(r.status).toBe(204);
    expect(db._tables.clicks.filter((c) => c.linkId === linkId)).toHaveLength(0);
    expect((await request(app).get("/demo")).status).toBe(404);
  });
});