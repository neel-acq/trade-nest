import { Injectable, NotFoundException } from '@nestjs/common';
import { StockService } from '../../stock/services/stock.service';
import { OrderBookSnapshot } from '../entities/order-book.entity';
import { MatchingEngineService } from './matching-engine.service';

@Injectable()
export class OrderBookService {
  constructor(
    private readonly stockService: StockService,
    private readonly matchingEngine: MatchingEngineService,
  ) {}

  async getSnapshotBySymbol(symbol: string): Promise<OrderBookSnapshot> {
    const stock = await this.stockService.findBySymbol(symbol);
    if (!stock) {
      throw new NotFoundException(`Stock ${symbol} not found`);
    }

    const book = this.matchingEngine.getBook(stock.id);
    if (!book) {
      return this.emptySnapshot(stock);
    }

    const { topBuys, topSells } = book.getTopOrders(5);
    const depth = book.getDepth(20);
    const summary = book.getSummary();

    return {
      stockId: stock.id,
      symbol: stock.symbol,
      companyName: stock.companyName,
      lastPrice: Number(stock.currentPrice),
      timestamp: new Date(),
      topBuys,
      topSells,
      depth,
      summary,
    };
  }

  private emptySnapshot(stock: any): OrderBookSnapshot {
    return {
      stockId: stock.id,
      symbol: stock.symbol,
      companyName: stock.companyName,
      lastPrice: Number(stock.currentPrice),
      timestamp: new Date(),
      topBuys: [],
      topSells: [],
      depth: { bids: [], asks: [] },
      summary: {
        totalOpenBuyOrders: 0,
        totalOpenSellOrders: 0,
        totalBidQuantity: 0,
        totalAskQuantity: 0,
      },
    };
  }
}
