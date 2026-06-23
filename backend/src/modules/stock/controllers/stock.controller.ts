import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CreateStockDto } from '../dto/create-stock.dto';
import { ImportStocksCsvDto } from '../dto/import-stocks-csv.dto';
import { QueryStockHistoryDto } from '../dto/query-stock-history.dto';
import { QueryStocksDto } from '../dto/query-stocks.dto';
import { UpdateStockDto } from '../dto/update-stock.dto';
import { StockService } from '../services/stock.service';

@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.stockService.getStatus();
  }

  @Get()
  listStocks(@Query() query: QueryStocksDto) {
    return this.stockService.listStocks(query);
  }

  @Get('symbol/:symbol/history')
  getPriceHistory(
    @Param('symbol') symbol: string,
    @Query() query: QueryStockHistoryDto,
  ) {
    return this.stockService.getPriceHistory(symbol, query);
  }

  @Get('symbol/:symbol')
  getStockBySymbol(@Param('symbol') symbol: string) {
    return this.stockService.getStockBySymbol(symbol);
  }

  @Roles(UserRole.ADMIN)
  @Post('import/csv')
  importCsv(@CurrentUser() admin: AuthenticatedUser, @Body() dto: ImportStocksCsvDto) {
    return this.stockService.importFromCsv(dto.csv, admin.id);
  }

  @Get(':id')
  getStockById(@Param('id') id: string) {
    return this.stockService.getStockById(id);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  createStock(@CurrentUser() admin: AuthenticatedUser, @Body() dto: CreateStockDto) {
    return this.stockService.createStock(dto, admin.id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  updateStock(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: UpdateStockDto,
  ) {
    return this.stockService.updateStock(id, dto, admin.id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  deleteStock(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.stockService.deleteStock(id, admin.id);
  }
}
