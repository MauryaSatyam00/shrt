import { describe, it, expect } from "vitest";
import { randomCode } from "./codegen";
import { CODE_ALPHABET, CODE_LENGTH } from "../../shared/constants";

describe("randomCode", () => {
  it("uses only the unambiguous alphabet at the right length", () => {
    for (let i = 0; i < 500; i++) {
      const c = randomCode();
      expect(c).toHaveLength(CODE_LENGTH);
      for (const ch of c) expect(CODE_ALPHABET).toContain(ch);
    }
  });
  it("never emits 0 O 1 l i", () => expect(CODE_ALPHABET).not.toMatch(/[0O1li]/));
  it("is not obviously colliding", () => {
    expect(new Set(Array.from({ length: 5000 }, () => randomCode())).size).toBe(5000);
  });
});