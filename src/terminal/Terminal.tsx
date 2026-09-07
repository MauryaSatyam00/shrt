import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Ctx, Line, LineCls, Prompt } from "./types";
import { parse } from "./parse";
import { useHistory } from "./history";
import { THEMES, useCrt, useTheme } from "./theme";
import { boot } from "./boot";
import { LineView } from "./LineView";
import { commands, findCommand } from "@/commands";
import { useSession } from "@/api/session";
import { errMsg } from "@/api/client";
import { STATS_RANGES } from "@shared/constants";

let seq = 0;
const BOOT_AT = Date.now();

export function Terminal() {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const promptRef = useRef<Prompt | null>(null);
  const [theme, setTheme] = useTheme();
  const [crt, setCrt] = useCrt();
  const { session, setSession } = useSession();
  const sessionRef = useRef(session); sessionRef.current = session;
  const history = useHistory();
  const qc = useQueryClient();
  const codes = useRef(new Set<string>());
  const inputRef = useRef<HTMLInputElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);

  const print = useCallback((text: string, cls?: LineCls) => {
    setLines((prev) => [...prev, ...text.split("\n").map((t) => ({ id: seq++, text: t, cls }))]);
  }, []);
  const clear = useCallback(() => setLines([]), []);
  const ask = useCallback((label: string, opts?: { mask?: boolean }) =>
    new Promise<string | null>((resolve) => {
      const p: Prompt = { label, mask: !!opts?.mask, resolve };
      promptRef.current = p; setPrompt(p);
    }), []);

  const ps1 = `${session?.handle ?? "guest"}@shrt:~$`;

  useEffect(() => {
    if (booted.current) return; booted.current = true;
    boot(print, sessionRef.current?.handle ?? null);
  }, [print]);

  useEffect(() => { const el = screenRef.current; if (el) el.scrollTop = el.scrollHeight; }, [lines, prompt, input]);

  const focus = () => { if (!window.getSelection()?.toString()) inputRef.current?.focus(); };
  const focusScreen = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) focus();
  };

  async function run(raw: string) {
    print(`${ps1} ${raw}`, "echo");
    history.push(raw);
    const parsed = parse(raw);
    if (!parsed.cmd) return;
    const def = findCommand(parsed.cmd);
    if (!def) { print(`?SYNTAX ERROR: unknown command "${parsed.cmd}" — type help`, "err"); return; }
    if (def.auth && !sessionRef.current) { print("NO CARRIER — this command requires login. Try: login <handle>", "err"); return; }

    const ctx: Ctx = {
      ...parsed, print, clear, ask,
      get session() { return sessionRef.current; }, setSession,
      theme, setTheme, crt, setCrt, qc, codes: codes.current, bootAt: BOOT_AT,
    };
    setBusy(true);
    try { await def.run(ctx); } catch (e) { print(errMsg(e), "err"); } finally { setBusy(false); }
  }

  function submit() {
    const value = input; setInput("");
    const p = promptRef.current;
    if (p) {
      print(`${p.label} ${p.mask ? "•".repeat(value.length) : value}`, "dim");
      promptRef.current = null; setPrompt(null); p.resolve(value); return;
    }
    if (busy) return;
    void run(value);
  }

  function cancelPrompt() {
    const p = promptRef.current;
    if (p) { promptRef.current = null; setPrompt(null); p.resolve(null); }
    setInput("");
  }

  function complete() {
    const parts = input.split(/\s+/);
    let cands: string[] = [];
    if (parts.length <= 1) cands = commands.map((c) => c.name).filter((n) => n.startsWith(parts[0] ?? ""));
    else {
      const last = parts[parts.length - 1], cmd = parts[0].toLowerCase();
      const pool = cmd === "theme" ? [...THEMES] : cmd === "stats" && parts.length === 3 ? [...STATS_RANGES] : [...codes.current];
      cands = pool.filter((c) => c.startsWith(last));
    }
    if (cands.length === 1) { parts[parts.length - 1] = cands[0]; setInput(parts.join(" ") + " "); }
    else if (cands.length > 1) print(cands.join("  "), "dim");
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
    else if (e.key === " ") { e.preventDefault(); }
    else if (e.key === "Tab") { e.preventDefault(); if (!prompt) complete(); }
    else if (e.key === "ArrowUp" && !prompt) { e.preventDefault(); setInput(history.prev()); }
    else if (e.key === "ArrowDown" && !prompt) { e.preventDefault(); setInput(history.next()); }
    else if (e.ctrlKey && e.key.toLowerCase() === "l") { e.preventDefault(); clear(); }
    else if ((e.ctrlKey && e.key.toLowerCase() === "c") || e.key === "Escape") { e.preventDefault(); cancelPrompt(); }
  }

  const display = prompt?.mask ? "•".repeat(input.length) : input;

  return (
    <div id="screen" ref={screenRef} onClick={focusScreen}>
      <div id="out">{lines.map((l) => <LineView key={l.id} line={l} />)}</div>
      <div className="line">
        <span className="bright">{prompt ? prompt.label : ps1}</span>{" "}
        <span>{display}</span>
        {busy && !prompt ? <span className="dim">▒ working…</span> : <span className="cursor" />}
      </div>
      <input
        ref={inputRef} className="ghost-input" autoFocus autoComplete="off" autoCapitalize="off" spellCheck={false}
        type={prompt?.mask ? "password" : "text"} value={input}
        onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
      />
    </div>
  );
}