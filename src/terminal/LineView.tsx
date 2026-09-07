import type { Line } from "./types";

const SPLIT_RE = /(https?:\/\/[^\s<>"'`]+)/g;
const IS_URL = /^https?:\/\//;

export function LineView({ line }: { line: Line }) {
  if (line.cls === "echo") {
    const i = line.text.indexOf("$ ");
    return <div className="line echo"><span className="ps1">{line.text.slice(0, i + 1)}</span>{line.text.slice(i + 1)}</div>;
  }
  if (line.cls === "qr" || line.cls === "banner") return <div className={`line ${line.cls}`}>{line.text}</div>;
  return (
    <div className={`line ${line.cls ?? ""}`}>
      {line.text.split(SPLIT_RE).map((p, i) =>
        IS_URL.test(p) ? <a key={i} href={p} target="_blank" rel="noreferrer noopener">{p}</a> : <span key={i}>{p}</span>,
      )}
    </div>
  );
}