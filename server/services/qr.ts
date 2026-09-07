import QRCode from "qrcode";
import type { QrMatrixDTO } from "../../shared/schemas.js";

export const qrSvg = (text: string, size: number) =>
  QRCode.toString(text, { type: "svg", width: size, margin: 2, color: { dark: "#000000", light: "#ffffff" } });

export const qrPng = (text: string, size: number) =>
  QRCode.toBuffer(text, { type: "png", width: size, margin: 2 });

export function qrMatrix(text: string): QrMatrixDTO {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = modules.size;
  const rows: string[] = [];
  for (let y = 0; y < size; y++) {
    let row = "";
    for (let x = 0; x < size; x++) row += modules.get(y, x) ? "1" : "0";
    rows.push(row);
  }
  return { size, rows };
}