import { parseStocksCsv } from '../utils/stock.utils';

describe('parseStocksCsv', () => {
  it('parses valid CSV rows', () => {
    const csv = `symbol,companyName,currentPrice,currentVolume
DEMO,Demo Ltd,100.5,500000`;

    const rows = parseStocksCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].symbol).toBe('DEMO');
    expect(rows[0].currentPrice).toBe(100.5);
  });

  it('throws on missing headers', () => {
    expect(() => parseStocksCsv('a,b,c')).toThrow();
  });
});
