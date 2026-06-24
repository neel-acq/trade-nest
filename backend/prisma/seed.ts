import { PrismaClient, OrderStatus, OrderType, LogType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { buildStockMetrics, INITIAL_WALLET_BALANCE } from './data/constants';
import { SEED_STOCKS } from './data/stocks.data';
import { DEFAULT_SEED_PASSWORD, SEED_USERS } from './data/users.data';
import { generatePriceHistory } from '../src/modules/stock/utils/stock.utils';

const prisma = new PrismaClient();

async function seedUsers() {
  const existing = await prisma.user.count({ where: { isSystemGenerated: true } });
  if (existing > 0) {
    console.log(`Skipping users — ${existing} system users already exist`);
    return;
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_SEED_PASSWORD, 10);
  await prisma.user.createMany({
    data: SEED_USERS.map((user) => ({
      ...user,
      password: hashedPassword,
      isSystemGenerated: true,
    })),
    skipDuplicates: true,
  });
  console.log(`Seeded ${SEED_USERS.length} users (password: ${DEFAULT_SEED_PASSWORD})`);
}

async function seedStocks() {
  const existing = await prisma.stock.count({ where: { isSystemGenerated: true } });
  if (existing > 0) {
    console.log(`Skipping stocks — ${existing} system stocks already exist`);
    return;
  }

  await prisma.stock.createMany({
    data: SEED_STOCKS.map((stock) => {
      const metrics = buildStockMetrics(stock.currentPrice, stock.currentVolume);
      return {
        symbol: stock.symbol,
        companyName: stock.companyName,
        currentPrice: stock.currentPrice,
        currentVolume: BigInt(stock.currentVolume),
        previousPrice: metrics.previousPrice,
        previousVolume: BigInt(metrics.previousVolume),
        changePrice: metrics.changePrice,
        changeVolume: BigInt(metrics.changeVolume),
        changePercentage: metrics.changePercentage,
        volumePercentage: metrics.volumePercentage,
        isSystemGenerated: true,
      };
    }),
    skipDuplicates: true,
  });
  console.log(`Seeded ${SEED_STOCKS.length} stocks`);
}

async function seedPriceHistory() {
  const existing = await prisma.stockPriceHistory.count();
  if (existing > 0) {
    console.log(`Skipping price history — ${existing} records already exist`);
    return;
  }

  const stocks = await prisma.stock.findMany({ where: { isSystemGenerated: true } });
  let created = 0;

  for (const stock of stocks) {
    const basePrice = Number(stock.currentPrice);
    for (const interval of ['1d', '1h'] as const) {
      const limit = interval === '1d' ? 90 : 7;
      const points = generatePriceHistory(stock.id, basePrice, limit, interval);
      await prisma.stockPriceHistory.createMany({
        data: points.map((p) => ({
          stockId: p.stockId,
          timestamp: p.timestamp,
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: BigInt(p.volume),
          interval: p.interval,
          isSystemGenerated: true,
        })),
        skipDuplicates: true,
      });
      created += points.length;
    }
  }

  console.log(`Seeded ${created} price history candles`);
}

async function seedLogs() {
  const existing = await prisma.auditLog.count();
  if (existing > 0) {
    console.log(`Skipping logs — ${existing} audit logs already exist`);
    return;
  }

  const admin = await prisma.user.findFirst({ where: { username: 'admin_01' } });
  const trader = await prisma.user.findFirst({ where: { username: 'trader_01' } });
  const stock = await prisma.stock.findFirst({ where: { symbol: 'RELIANCE' } });

  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin?.id,
        action: 'PLATFORM_INITIALIZED',
        entityType: 'System',
        logType: LogType.INFO,
        metadata: { message: 'TradeNest demo environment bootstrapped' },
      },
      {
        userId: admin?.id,
        action: 'STOCKS_SEEDED',
        entityType: 'Stock',
        entityId: stock?.id,
        logType: LogType.AUDIT,
        metadata: { count: SEED_STOCKS.length },
      },
      {
        userId: trader?.id,
        action: 'WALLET_CREDITED',
        entityType: 'Wallet',
        entityId: trader?.id,
        logType: LogType.SUCCESS,
        metadata: { amount: INITIAL_WALLET_BALANCE, reason: 'Initial demo balance' },
      },
      {
        userId: trader?.id,
        action: 'ORDER_CREATED',
        entityType: 'Order',
        logType: LogType.AUDIT,
        metadata: { symbol: 'RELIANCE', side: 'BUY', type: 'LIMIT' },
      },
      {
        userId: trader?.id,
        action: 'TRADE_EXECUTED',
        entityType: 'Trade',
        entityId: 'TRD-SEED-0001',
        logType: LogType.SUCCESS,
        metadata: { symbol: 'RELIANCE', quantity: 10 },
      },
    ],
  });

  await prisma.systemLog.createMany({
    data: [
      {
        message: 'TradeNest platform started successfully',
        context: 'system.bootstrap',
        logType: LogType.INFO,
        metadata: { version: '1.0.0' },
      },
      {
        message: 'Matching engine initialized',
        context: 'matching.engine',
        logType: LogType.SUCCESS,
      },
      {
        message: 'WebSocket realtime gateway listening',
        context: 'realtime.gateway',
        logType: LogType.INFO,
      },
      {
        message: 'Demo stocks and wallets loaded',
        context: 'seed.bootstrap',
        logType: LogType.INFO,
        metadata: { stocks: SEED_STOCKS.length, users: SEED_USERS.length },
      },
      {
        message: 'Sample market depth orders created for RELIANCE',
        context: 'order.seed',
        logType: LogType.INFO,
      },
    ],
  });

  console.log('Seeded audit and system logs');
}

async function seedWallets() {
  const existing = await prisma.wallet.count({ where: { isSystemGenerated: true } });
  if (existing > 0) {
    console.log(`Skipping wallets — ${existing} system wallets already exist`);
    return;
  }

  const users = await prisma.user.findMany({ where: { isSystemGenerated: true } });
  await prisma.wallet.createMany({
    data: users.map((user) => ({
      userId: user.id,
      balance: INITIAL_WALLET_BALANCE,
      lockedBalance: 0,
      isSystemGenerated: true,
    })),
    skipDuplicates: true,
  });
  console.log(`Seeded ${users.length} wallets (₹${INITIAL_WALLET_BALANCE.toLocaleString('en-IN')} each)`);
}

async function seedOrders() {
  const existing = await prisma.order.count({ where: { isSystemGenerated: true } });
  if (existing > 0) {
    console.log(`Skipping orders — ${existing} system orders already exist`);
    return;
  }

  const buyer = await prisma.user.findFirst({ where: { username: 'trader_01' } });
  const seller = await prisma.user.findFirst({ where: { username: 'trader_02' } });
  const stock = await prisma.stock.findFirst({ where: { symbol: 'RELIANCE' } });

  if (!buyer || !seller || !stock) {
    console.log('Skipping orders — prerequisite users/stocks missing');
    return;
  }

  await prisma.order.createMany({
    data: [
      {
        userId: buyer.id,
        stockId: stock.id,
        type: OrderType.LIMIT_BUY,
        status: OrderStatus.OPEN,
        quantity: 10,
        price: Number(stock.currentPrice) - 5,
        isSystemGenerated: true,
      },
      {
        userId: seller.id,
        stockId: stock.id,
        type: OrderType.LIMIT_SELL,
        status: OrderStatus.OPEN,
        quantity: 10,
        price: Number(stock.currentPrice) + 5,
        isSystemGenerated: true,
      },
    ],
  });
  console.log('Seeded 2 sample orders');
}

async function seedTrades() {
  const existing = await prisma.trade.count({ where: { isSystemGenerated: true } });
  if (existing > 0) {
    console.log(`Skipping trades — ${existing} system trades already exist`);
    return;
  }

  const orders = await prisma.order.findMany({ where: { isSystemGenerated: true } });
  const buyOrder = orders.find((o) => o.type === OrderType.LIMIT_BUY);
  const sellOrder = orders.find((o) => o.type === OrderType.LIMIT_SELL);

  if (!buyOrder || !sellOrder) {
    console.log('Skipping trades — prerequisite orders missing');
    return;
  }

  const price = Number(buyOrder.price ?? sellOrder.price ?? 0);
  const quantity = Math.min(buyOrder.quantity, sellOrder.quantity);

  await prisma.trade.create({
    data: {
      tradeId: 'TRD-SEED-0001',
      buyOrderId: buyOrder.id,
      sellOrderId: sellOrder.id,
      stockId: buyOrder.stockId,
      quantity,
      price,
      isSystemGenerated: true,
    },
  });

  await prisma.portfolioHolding.upsert({
    where: {
      userId_stockId: { userId: buyOrder.userId, stockId: buyOrder.stockId },
    },
    create: {
      userId: buyOrder.userId,
      stockId: buyOrder.stockId,
      quantity,
      averageBuyPrice: price,
      investedAmount: price * quantity,
      isSystemGenerated: true,
    },
    update: {
      quantity,
      averageBuyPrice: price,
      investedAmount: price * quantity,
    },
  });

  console.log('Seeded 1 sample trade');
}

async function main() {
  await seedUsers();
  await seedStocks();
  await seedWallets();
  await seedOrders();
  await seedTrades();
  await seedPriceHistory();
  await seedLogs();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
