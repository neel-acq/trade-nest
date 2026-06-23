import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { MatchingEngineService } from '../services/matching-engine.service';
import { OrderBookService } from '../services/order-book.service';

@Controller('matching')
export class MatchingController {
  constructor(
    private readonly matchingEngine: MatchingEngineService,
    private readonly orderBookService: OrderBookService,
  ) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.matchingEngine.getStatus();
  }

  @Public()
  @Get('stocks/:symbol/orderbook')
  getOrderBook(@Param('symbol') symbol: string) {
    return this.orderBookService.getSnapshotBySymbol(symbol);
  }

  @Public()
  @Get('stocks/:symbol/depth')
  getMarketDepth(@Param('symbol') symbol: string) {
    return this.orderBookService.getSnapshotBySymbol(symbol).then((snapshot) => ({
      symbol: snapshot.symbol,
      timestamp: snapshot.timestamp,
      bids: snapshot.depth.bids,
      asks: snapshot.depth.asks,
    }));
  }

  @Public()
  @Get('stocks/:symbol/top')
  getTopOrders(@Param('symbol') symbol: string) {
    return this.orderBookService.getSnapshotBySymbol(symbol).then((snapshot) => ({
      symbol: snapshot.symbol,
      timestamp: snapshot.timestamp,
      topBuys: snapshot.topBuys,
      topSells: snapshot.topSells,
    }));
  }
}
