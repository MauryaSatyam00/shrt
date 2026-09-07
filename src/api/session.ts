import { useCallback, useState } from "react";

export interface Session { handle: string; apiKey: string; isSysop: boolean }
const KEY = "shrt.session";
const load = (): Session | null => { try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; } };

export function useSession() {
  const [session, set] = useState<Session | null>(load);
  const setSession = useCallback((s: Session | null) => {
    s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY);
    set(s);
  }, []);
  return { session, setSession };
}