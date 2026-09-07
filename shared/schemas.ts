import { z } from "zod";
import {
  ALIAS_REGEX,
  EXPIRY_OPTIONS,
  RESERVED,
  STATS_RANGES,
} from "./constants";

export const UrlSchema = z
  .string()
  .trim()
  .min(1, "url required")
  .max(2048)
  .refine((value) => {
    const raw = value.trim();
    if (!raw) return false;
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw) && !/^https?:/i.test(raw))
      return false;
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const url = new URL(candidate);
      return /^https?:/i.test(url.protocol) && !!url.hostname;
    } catch {
      return false;
    }
  }, "only http/https allowed")
  .transform((value) =>
    /^https?:\/\//i.test(value) ? value : `https://${value}`,
  );

export const AliasSchema = z
  .string()
  .trim()
  .regex(ALIAS_REGEX, "alias must be 3-32 chars: letters, digits, _ or -")
  .refine((a) => !RESERVED.has(a.toLowerCase()), "alias is reserved");

export const CreateLinkSchema = z.object({
  url: UrlSchema,
  alias: AliasSchema.optional(),
  expiresIn: z.enum(EXPIRY_OPTIONS).default("never"),
});
export type CreateLinkInput = z.input<typeof CreateLinkSchema>;

export const LoginSchema = z.object({
  handle: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_]{2,20}$/, "handle: 2-20 chars, letters/digits/_"),
  password: z.string().min(4, "password: min 4 chars").max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const StatsQuerySchema = z.object({
  range: z.enum(STATS_RANGES).default("7d"),
});

export interface LinkDTO {
  code: string;
  url: string;
  shortUrl: string;
  createdAt: string;
  expiresAt: string | null;
  clicks: number;
  owned: boolean;
}
export interface Bucket {
  label: string;
  count: number;
}
export interface StatsDTO {
  code: string;
  url: string;
  range: string;
  total: number;
  unique: number;
  createdAt: string;
  lastClick: string | null;
  byHour: Bucket[];
  byDay: Bucket[];
  referrers: Bucket[];
  browsers: Bucket[];
  os: Bucket[];
  devices: Bucket[];
  countries: Bucket[];
  recent: {
    ts: string;
    referrer: string | null;
    country: string | null;
    browser: string | null;
    os: string | null;
    device: string | null;
  }[];
}
export interface MeDTO {
  handle: string;
  isSysop: boolean;
  linkCount: number;
  totalClicks: number;
  memberSince: string;
}
export interface LoginDTO {
  handle: string;
  apiKey: string;
  isNew: boolean;
  isSysop: boolean;
}
export interface QrMatrixDTO {
  size: number;
  rows: string[];
}
