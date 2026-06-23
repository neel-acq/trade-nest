import { PortfolioHolding, Stock } from '@prisma/client';

export type HoldingWithStock = PortfolioHolding & {
  stock: Pick<Stock, 'symbol' | 'companyName' | 'currentPrice'>;
};

export interface SafeHolding {
  id: string;
  userId: string;
  stockId: string;
  symbol: string;
  companyName: string;
  quantity: number;
  averageBuyPrice: number;
  investedAmount: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  totalPnL: number;
  updatedAt: Date;
}

export interface PortfolioSummary {
  holdingsCount: number;
  totalInvested: number;
  totalCurrentValue: number;
  totalUnrealizedPnL: number;
  totalRealizedPnL: number;
  totalPnL: number;
  totalPnLPercent: number;
}

export function computeHoldingMetrics(
  holding: HoldingWithStock,
  currentPrice: number,
): Omit<SafeHolding, 'id' | 'userId' | 'stockId' | 'updatedAt'> & {
  symbol: string;
  companyName: string;
} {
  const quantity = holding.quantity;
  const investedAmount = Number(holding.investedAmount);
  const averageBuyPrice = Number(holding.averageBuyPrice);
  const realizedPnL = Number(holding.realizedPnL);
  const currentValue = Number((currentPrice * quantity).toFixed(2));
  const unrealizedPnL = Number((currentValue - investedAmount).toFixed(2));
  const unrealizedPnLPercent =
    investedAmount === 0
      ? 0
      : Number(((unrealizedPnL / investedAmount) * 100).toFixed(4));
  const totalPnL = Number((unrealizedPnL + realizedPnL).toFixed(2));

  return {
    symbol: holding.stock.symbol,
    companyName: holding.stock.companyName,
    quantity,
    averageBuyPrice,
    investedAmount,
    currentPrice,
    currentValue,
    unrealizedPnL,
    unrealizedPnLPercent,
    realizedPnL,
    totalPnL,
  };
}

export function toSafeHolding(holding: HoldingWithStock, currentPrice: number): SafeHolding {
  const metrics = computeHoldingMetrics(holding, currentPrice);
  return {
    id: holding.id,
    userId: holding.userId,
    stockId: holding.stockId,
    updatedAt: holding.updatedAt,
    ...metrics,
  };
}

export function buildPortfolioSummary(holdings: SafeHolding[]): PortfolioSummary {
  const totalInvested = holdings.reduce((sum, h) => sum + h.investedAmount, 0);
  const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalUnrealizedPnL = holdings.reduce((sum, h) => sum + h.unrealizedPnL, 0);
  const totalRealizedPnL = holdings.reduce((sum, h) => sum + h.realizedPnL, 0);
  const totalPnL = Number((totalUnrealizedPnL + totalRealizedPnL).toFixed(2));

  return {
    holdingsCount: holdings.length,
    totalInvested: Number(totalInvested.toFixed(2)),
    totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
    totalUnrealizedPnL: Number(totalUnrealizedPnL.toFixed(2)),
    totalRealizedPnL: Number(totalRealizedPnL.toFixed(2)),
    totalPnL,
    totalPnLPercent:
      totalInvested === 0 ? 0 : Number(((totalPnL / totalInvested) * 100).toFixed(4)),
  };
}
