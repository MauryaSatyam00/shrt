import { randomInt } from "node:crypto";
import { CODE_ALPHABET, CODE_LENGTH } from "../../shared/constants.js";
import { prisma } from "../db.js";

export const randomCode = (len = CODE_LENGTH) =>
  Array.from({ length: len }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

export async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = randomCode();
    if (!(await prisma.link.findUnique({ where: { code }, select: { id: true } }))) return code;
  }
  return randomCode(CODE_LENGTH + 2);
}