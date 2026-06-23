import { Stock } from '@prisma/client';

export interface SafeStock {
  id: string;
  symbol: string;
  companyName: string;
  currentPrice: number;
  currentVolume: number;
  previousPrice: number;
  previousVolume: number;
  changePrice: number;
  changeVolume: number;
  changePercentage: number;
  volumePercentage: number;
  isSystemGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeStock(stock: Stock): SafeStock {
  return {
    id: stock.id,
    symbol: stock.symbol,
    companyName: stock.companyName,
    currentPrice: Number(stock.currentPrice),
    currentVolume: Number(stock.currentVolume),
    previousPrice: Number(stock.previousPrice),
    previousVolume: Number(stock.previousVolume),
    changePrice: Number(stock.changePrice),
    changeVolume: Number(stock.changeVolume),
    changePercentage: Number(stock.changePercentage),
    volumePercentage: Number(stock.volumePercentage),
    isSystemGenerated: stock.isSystemGenerated,
    createdAt: stock.createdAt,
    updatedAt: stock.updatedAt,
  };
}
