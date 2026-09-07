export const CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
export const CODE_LENGTH = 7;
export const ALIAS_REGEX = /^[A-Za-z0-9_-]{3,32}$/;

export const RESERVED = new Set([
  "api", "qr", "healthz", "assets", "index.html", "favicon.ico", "login", "logout",
  "help", "stats", "admin", "sysop", "robots.txt", "sitemap.xml", "static",
]);

export const EXPIRY_OPTIONS = ["1h", "1d", "7d", "30d", "90d", "never"] as const;
export type Expiry = (typeof EXPIRY_OPTIONS)[number];
export const EXPIRY_MS: Record<Exclude<Expiry, "never">, number> = {
  "1h": 3_600_000, "1d": 86_400_000, "7d": 7 * 86_400_000, "30d": 30 * 86_400_000, "90d": 90 * 86_400_000,
};

export const STATS_RANGES = ["24h", "7d", "30d"] as const;
export type StatsRange = (typeof STATS_RANGES)[number];
export const RANGE_MS: Record<StatsRange, number> = { "24h": 86_400_000, "7d": 7 * 86_400_000, "30d": 30 * 86_400_000 };