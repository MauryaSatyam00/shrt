import type { QueryClient } from "@tanstack/react-query";
import type { Session } from "@/api/session";
import type { Theme } from "./theme";

export type LineCls = "echo" | "dim" | "bright" | "err" | "ok" | "qr" | "banner";
export interface Line { id: number; text: string; cls?: LineCls }
export interface Prompt { label: string; mask: boolean; resolve: (v: string | null) => void }
export interface Parsed { raw: string; cmd: string; args: string[]; flags: Record<string, string | true> }

export interface Ctx extends Parsed {
  print(text: string, cls?: LineCls): void;
  clear(): void;
  ask(label: string, opts?: { mask?: boolean }): Promise<string | null>;
  readonly session: Session | null;
  setSession(s: Session | null): void;
  theme: Theme; setTheme(t: Theme): void;
  crt: boolean; setCrt(on: boolean): void;
  qc: QueryClient;
  codes: Set<string>;
  bootAt: number;
}

export interface Command {
  name: string; aliases?: string[]; usage: string; desc: string; auth?: boolean;
  run(ctx: Ctx): Promise<void> | void;
}