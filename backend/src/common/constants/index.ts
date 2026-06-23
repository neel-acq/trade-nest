export enum UserRole {
  ADMIN = 'ADMIN',
  TRADER = 'TRADER',
}

export enum OrderType {
  LIMIT_BUY = 'LIMIT_BUY',
  LIMIT_SELL = 'LIMIT_SELL',
  MARKET_BUY = 'MARKET_BUY',
  MARKET_SELL = 'MARKET_SELL',
}

export enum OrderStatus {
  OPEN = 'OPEN',
  PARTIAL = 'PARTIAL',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum LogType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  AUDIT = 'AUDIT',
  SECURITY = 'SECURITY',
}
