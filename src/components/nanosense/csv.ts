import { CSV_COLUMNS } from "@/content/nanosense";
import type { CalRow } from "./model";

/** Minimal RFC-4180 parser: quoted fields, escaped quotes, CRLF or LF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export interface CsvResult {
  ok: boolean;
  rows: CalRow[];
  errors: string[];
  warnings: string[];
}

/**
 * Validates an experimental calibration CSV. Missing or non-numeric values
 * are reported, never filled in.
 */
export function readCalibrationCsv(text: string): CsvResult {
  const table = parseCsv(text);
  const errors: string[] = [];
  const warnings: string[] = [];
  if (table.length === 0) return { ok: false, rows: [], errors: ["The file is empty."], warnings };
  const header = table[0].map((h) => h.trim().toLowerCase());
  const idx = Object.fromEntries(CSV_COLUMNS.map((c) => [c, header.indexOf(c)])) as Record<(typeof CSV_COLUMNS)[number], number>;
  const missing = CSV_COLUMNS.filter((c) => idx[c] < 0);
  if (missing.length) {
    errors.push(`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Expected: ${CSV_COLUMNS.join(", ")}.`);
    return { ok: false, rows: [], errors, warnings };
  }
  const extra = header.filter((h) => !(CSV_COLUMNS as readonly string[]).includes(h));
  if (extra.length) warnings.push(`Ignored extra column(s): ${extra.join(", ")}.`);
  const rows: CalRow[] = table.slice(1).map((r, i) => {
    const get = (c: (typeof CSV_COLUMNS)[number]) => (r[idx[c]] ?? "").trim();
    const row: CalRow = {
      sampleId: get("sample_id"),
      conc: get("known_concentration"),
      feature: get("optical_feature"),
      replicate: get("replicate"),
      notes: get("notes"),
      origin: "csv",
    };
    const line = i + 2;
    if (row.conc === "" || !Number.isFinite(Number(row.conc))) warnings.push(`Line ${line}: known_concentration "${row.conc}" is not a number; row kept but excluded from the fit.`);
    if (row.feature === "" || !Number.isFinite(Number(row.feature))) warnings.push(`Line ${line}: optical_feature "${row.feature}" is not a number; row kept but excluded from the fit.`);
    return row;
  });
  if (rows.length === 0) errors.push("The file has a header but no data rows.");
  return { ok: errors.length === 0, rows, errors, warnings };
}

const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function toCsv(rows: CalRow[]) {
  const lines = [CSV_COLUMNS.join(",")];
  rows.forEach((r) => lines.push([r.sampleId, r.conc, r.feature, r.replicate, r.notes].map(esc).join(",")));
  return lines.join("\n") + "\n";
}

export function downloadText(name: string, text: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
