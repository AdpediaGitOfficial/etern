/**
 * Builds CSV text that is safe to open in Excel or Sheets.
 * A cell that starts with = + - @ (or a tab/CR) would be run as a formula, so it is prefixed with an apostrophe.
 * Names such as sub categories can be edited by staff, so exports must never trust them.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (FORMULA_START.test(text) && !(typeof value === 'number' && Number.isFinite(value))) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map(r => r.map(csvCell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, rows: unknown[][]): void {
  // The BOM makes Excel read UTF-8 (₹, accents) correctly.
  const blob = new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
