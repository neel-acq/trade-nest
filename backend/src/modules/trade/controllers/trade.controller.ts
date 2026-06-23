import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { QueryTradesDto } from '../dto/query-trades.dto';
import { TradeService } from '../services/trade.service';

@Controller('trades')
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.tradeService.getStatus();
  }

  @Public()
  @Get('stocks/:symbol')
  listTradesByStock(@Param('symbol') symbol: string, @Query() query: QueryTradesDto) {
    return this.tradeService.listTradesBySymbol(symbol, query);
  }

  @Get()
  listTrades(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryTradesDto) {
    return this.tradeService.listTrades(query, user.id, user.role);
  }

  @Get(':tradeRef')
  getTrade(@CurrentUser() user: AuthenticatedUser, @Param('tradeRef') tradeRef: string) {
    return this.tradeService.getTradeById(tradeRef, user.id, user.role);
  }
}
