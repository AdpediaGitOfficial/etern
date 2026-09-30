import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from './csv';

describe('csv', () => {
  it('quotes and escapes', () => {
    expect(csvCell('a "b", c')).toBe('"a ""b"", c"');
    expect(csvCell(null)).toBe('""');
    expect(csvCell(12)).toBe('"12"');
  });

  it('neutralises spreadsheet formulas (CSV injection)', () => {
    for (const evil of ['=HYPERLINK("http://evil","x")', '+SUM(A1)', '-2+3', '@cmd', '\t=1', '\r=1']) {
      expect(csvCell(evil).startsWith(`"'`)).toBe(true);
    }
    expect(csvCell('Algebra')).toBe('"Algebra"');
  });

  it('keeps real negative numbers as numbers', () => {
    expect(csvCell(-5)).toBe('"-5"');
  });

  it('joins rows with CRLF', () => {
    expect(toCsv([['a', 1], ['b', 2]])).toBe('"a","1"\r\n"b","2"');
  });
});
