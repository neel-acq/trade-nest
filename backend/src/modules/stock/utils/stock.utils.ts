/**
 * Generates synthetic OHLC history for chart display with mean-reversion toward base price.
 */
function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const input = `${seed}:${index}`;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

export function generatePriceHistory(
  stockId: string,
  basePrice: number,
  days = 90,
  interval = '1d',
) {
  const points = [];
  const startPrice = basePrice * 0.88;
  let price = startPrice;
  const now = new Date();
  const pointsCount = interval === '1h' ? Math.min(days * 24, 168) : days;

  for (let i = pointsCount; i >= 0; i -= 1) {
    const date = new Date(now);
    if (interval === '1h') {
      date.setHours(date.getHours() - i, 0, 0, 0);
    } else {
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
    }

    const progress = (pointsCount - i) / Math.max(pointsCount, 1);
    const target = startPrice + (basePrice - startPrice) * progress;
    const volatility = basePrice * (interval === '1h' ? 0.006 : 0.018);
    const noise = (seededRandom(stockId, i) - 0.5) * volatility;
    const reversion = (target - price) * 0.12;

    const open = price;
    const close = Math.max(1, Number((open + noise + reversion).toFixed(2)));
    const wick = volatility * (0.3 + seededRandom(stockId, i + 1000) * 0.5);
    const high = Number((Math.max(open, close) + wick).toFixed(2));
    const low = Number(Math.max(0.01, Math.min(open, close) - wick).toFixed(2));
    const volumeBase = interval === '1h' ? 50000 : 800000;
    const volume = Math.floor(volumeBase + seededRandom(stockId, i + 2000) * volumeBase * 2);

    points.push({
      stockId,
      timestamp: date,
      open,
      high,
      low,
      close,
      volume,
      interval,
    });

    price = close;
  }

  if (points.length > 0) {
    const last = points[points.length - 1];
    last.close = basePrice;
    last.high = Math.max(last.high, basePrice);
    last.low = Math.min(last.low, basePrice);
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
