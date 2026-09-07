import { vi } from "vitest";

type Row = Record<string, any>;
const matches = (row: Row, where: Row = {}): boolean =>
  Object.entries(where).every(([k, v]) => {
    if (k === "link") return true;
    if (v && typeof v === "object" && !(v instanceof Date)) return "gte" in v ? row[k] >= v.gte : true;
    return row[k] === v;
  });

export function makeFakeDb() {
  const users: Row[] = [], links: Row[] = [], clicks: Row[] = [];
  let seq = 1;
  const id = () => `id${seq++}`;
  const withCount = (l: Row, o: any) => (o?.include?._count ? { ...l, _count: { clicks: clicks.filter((c) => c.linkId === l.id).length } } : l);

  return {
    user: {
      findUnique: vi.fn(async ({ where }: any) => users.find((u) => matches(u, where)) ?? null),
      findFirst: vi.fn(async () => [...users].sort((a, b) => a.createdAt - b.createdAt)[0] ?? null),
      create: vi.fn(async ({ data }: any) => { const u = { id: id(), createdAt: new Date(), ...data }; users.push(u); return u; }),
      update: vi.fn(async ({ where, data }: any) => { const u = users.find((x) => matches(x, where))!; Object.assign(u, data); return u; }),
    },
    link: {
      findUnique: vi.fn(async (o: any) => { const l = links.find((x) => matches(x, o.where)); return l ? withCount(l, o) : null; }),
      findMany: vi.fn(async (o: any) => links.filter((l) => matches(l, o.where)).map((l) => withCount(l, o))),
      create: vi.fn(async ({ data }: any) => { const l = { id: id(), createdAt: new Date(), expiresAt: null, userId: null, ...data }; links.push(l); return l; }),
      delete: vi.fn(async ({ where }: any) => {
        const i = links.findIndex((l) => matches(l, where)); const [l] = links.splice(i, 1);
        for (let j = clicks.length - 1; j >= 0; j--) if (clicks[j].linkId === l.id) clicks.splice(j, 1);
        return l;
      }),
      count: vi.fn(async ({ where }: any) => links.filter((l) => matches(l, where)).length),
    },
    click: {
      create: vi.fn(async ({ data }: any) => { const c = { id: BigInt(seq++), ts: new Date(), ...data }; clicks.push(c); return c; }),
      findMany: vi.fn(async (o: any) => clicks.filter((c) => matches(c, o.where)).sort((a, b) => b.ts - a.ts)),
      count: vi.fn(async ({ where }: any) => {
        if (where?.link?.userId) {
          const ids = new Set(links.filter((l) => l.userId === where.link.userId).map((l) => l.id));
          return clicks.filter((c) => ids.has(c.linkId)).length;
        }
        return clicks.filter((c) => matches(c, where)).length;
      }),
    },
    _tables: { users, links, clicks },
  };
}

export const db = makeFakeDb();