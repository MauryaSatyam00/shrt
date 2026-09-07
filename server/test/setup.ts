import { vi } from "vitest";
vi.mock("../db", async () => ({ prisma: (await import("./fakeDb")).db }));