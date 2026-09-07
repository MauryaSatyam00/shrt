import { useRef } from "react";
const KEY = "shrt.history";

export function useHistory() {
  const items = useRef<string[]>(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
  const idx = useRef(items.current.length);
  return {
    push(cmd: string) {
      if (cmd && items.current[items.current.length - 1] !== cmd) {
        items.current = [...items.current, cmd].slice(-100);
        localStorage.setItem(KEY, JSON.stringify(items.current));
      }
      idx.current = items.current.length;
    },
    prev() { idx.current = Math.max(0, idx.current - 1); return items.current[idx.current] ?? ""; },
    next() { idx.current = Math.min(items.current.length, idx.current + 1); return items.current[idx.current] ?? ""; },
  };
}