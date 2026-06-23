export type UserRole = 'ADMIN' | 'TRADER';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: string;
  user: AuthUser;
}

export interface HealthResponse {
  status: string;
  service: string;
  phase: number;
  timestamp: string;
}

export interface ModuleStatus {
  module: string;
  status: string;
  phase: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

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
  createdAt: string;
  updatedAt: string;
}

export interface StockHistoryPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockHistoryResponse {
  symbol: string;
  interval: string;
  data: StockHistoryPoint[];
}

export interface SafeWallet {
  id: string;
  userId: string;
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  isSystemGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SafeWalletWithUser extends SafeWallet {
  user: {
    username: string;
    fullName: string;
    email: string;
  };
}

export type OrderStatus = 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface SafeOrder {
  id: string;
  userId: string;
  stockId: string;
  symbol: string;
  companyName: string;
  type: string;
  status: OrderStatus;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  price: number | null;
  isSystemGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { username: string; fullName: string };
}

export interface SafeTrade {
  id: string;
  tradeId: string;
  stockId: string;
  symbol: string;
  companyName: string;
  quantity: number;
  price: number;
  totalValue: number;
  executedAt: string;
  buyOrderId: string;
  sellOrderId: string;
  buyer: { userId: string; username: string; fullName: string };
  seller: { userId: string; username: string; fullName: string };
  side?: 'BUY' | 'SELL';
  isSystemGenerated: boolean;
  createdAt: string;
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
  updatedAt: string;
}

export interface PortfolioOverview {
  summary: PortfolioSummary;
  holdings: SafeHolding[];
}

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
  users: { total: number; traders: number; admins: number };
  platform: { totalOrders: number; totalTrades: number; totalTurnover: number };
  recentTrades: SafeTrade[];
}

export type LogType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'AUDIT'
  | 'SECURITY';

export interface SafeAuditLog {
  id: string;
  userId: string | null;
  username: string | null;
  fullName: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  logType: LogType;
  createdAt: string;
}

export interface SafeSystemLog {
  id: string;
  message: string;
  context: string | null;
  metadata: Record<string, unknown> | null;
  logType: LogType;
  createdAt: string;
}

export type NotificationType = 'ORDER' | 'TRADE' | 'WALLET' | 'SYSTEM' | 'SECURITY';

export interface SafeNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  isSystemGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}
