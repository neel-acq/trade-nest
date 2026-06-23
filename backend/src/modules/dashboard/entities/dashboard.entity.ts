import { SafeOrder } from '../../order/entities/order.entity';
import { PortfolioSummary, SafeHolding } from '../../portfolio/entities/portfolio.entity';
import { SafeTrade } from '../../trade/entities/trade.entity';
import { SafeWallet } from '../../wallet/entities/wallet.entity';

export interface OrderStats {
  open: number;
  partial: number;
  filled: number;
  cancelled: number;
  rejected: number;
  total: number;
}

export interface TradeStats {
  totalTrades: number;
  totalTurnover: number;
}

export interface AllocationSlice {
  symbol: string;
  companyName: string;
  currentValue: number;
  weight: number;
}

export interface TraderDashboardOverview {
  wallet: SafeWallet;
  portfolio: PortfolioSummary;
  netWorth: number;
  orders: OrderStats;
  trades: TradeStats;
  topHoldings: SafeHolding[];
  allocation: AllocationSlice[];
  recentOrders: SafeOrder[];
  recentTrades: SafeTrade[];
}

export interface AdminDashboardOverview {
  users: {
    total: number;
    traders: number;
    admins: number;
  };
  platform: {
    totalOrders: number;
    totalTrades: number;
    totalTurnover: number;
  };
  recentTrades: SafeTrade[];
}
