import type { Parsed } from "./types";

function tokenize(s: string): string[] {
  const out: string[] = []; const re = /"([^"]*)"|'([^']*)'|(\S+)/g; let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

export function parse(raw: string): Parsed {
  const [cmd = "", ...rest] = tokenize(raw.trim());
  const args: string[] = []; const flags: Record<string, string | true> = {};
  for (let i = 0; i < rest.length; i++) {
    const t = rest[i];
    if (t.startsWith("--")) {
      const eq = t.indexOf("=");
      if (eq > -1) flags[t.slice(2, eq)] = t.slice(eq + 1);
      else if (rest[i + 1] && !rest[i + 1].startsWith("-")) flags[t.slice(2)] = rest[++i];
      else flags[t.slice(2)] = true;
    } else if (/^-[a-z]$/i.test(t)) flags[t.slice(1)] = true;
    else args.push(t);
  }
  return { raw, cmd: cmd.toLowerCase(), args, flags };
}