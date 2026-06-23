/**
 * Generates synthetic daily OHLC history for chart display.
 */
export function generatePriceHistory(
  stockId: string,
  basePrice: number,
  days = 90,
  interval = '1d',
) {
  const points = [];
  let price = basePrice * 0.85;
  const now = new Date();

  for (let i = days; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const volatility = basePrice * 0.02;
    const open = price;
    const change = (Math.random() - 0.48) * volatility;
    const close = Math.max(1, Number((open + change).toFixed(2)));
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(500000 + Math.random() * 2000000);

    points.push({
      stockId,
      timestamp: date,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(Math.max(0.01, low).toFixed(2)),
      close,
      volume,
      interval,
    });

    price = close;
  }

  // Ensure last close matches current price
  if (points.length > 0) {
    points[points.length - 1].close = basePrice;
  }

  return points;
}

export interface CsvStockRow {
  symbol: string;
  companyName: string;
  currentPrice: number;
  currentVolume: number;
}

export function parseStocksCsv(csv: string): CsvStockRow[] {
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
  const symbolIdx = header.indexOf('symbol');
  const nameIdx = header.findIndex((h) => h === 'companyname' || h === 'company_name');
  const priceIdx = header.findIndex((h) => h === 'currentprice' || h === 'current_price');
  const volumeIdx = header.findIndex((h) => h === 'currentvolume' || h === 'current_volume');

  if (symbolIdx === -1 || nameIdx === -1 || priceIdx === -1 || volumeIdx === -1) {
    throw new Error(
      'CSV must include headers: symbol, companyName, currentPrice, currentVolume',
    );
  }

  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const currentPrice = Number(cols[priceIdx]);
    const currentVolume = Number(cols[volumeIdx]);

    if (!cols[symbolIdx] || !cols[nameIdx] || Number.isNaN(currentPrice) || Number.isNaN(currentVolume)) {
      throw new Error(`Invalid CSV row: ${line}`);
    }

    return {
      symbol: cols[symbolIdx].toUpperCase(),
      companyName: cols[nameIdx],
      currentPrice,
      currentVolume,
    };
  });
}
