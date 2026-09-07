import { useEffect, useState } from "react";

export const THEMES = ["green", "amber", "white"] as const;
export type Theme = (typeof THEMES)[number];

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("shrt.theme") as Theme) || "green");
  useEffect(() => { document.body.dataset.theme = theme; localStorage.setItem("shrt.theme", theme); }, [theme]);
  return [theme, setTheme] as const;
}

export function useCrt() {
  const [crt, setCrt] = useState(() => localStorage.getItem("shrt.crt") !== "off");
  useEffect(() => { document.body.classList.toggle("crt", crt); localStorage.setItem("shrt.crt", crt ? "on" : "off"); }, [crt]);
  return [crt, setCrt] as const;
}