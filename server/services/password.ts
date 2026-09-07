import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const hashPassword = (pw: string) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
};
export const verifyPassword = (pw: string, stored: string) => {
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(scryptSync(pw, salt, 64), Buffer.from(hash, "hex"));
};
export const newApiKey = () => `shrt_${randomBytes(24).toString("hex")}`;