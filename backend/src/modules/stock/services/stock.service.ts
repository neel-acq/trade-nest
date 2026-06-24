import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { buildPaginationMeta, PaginatedResult } from '@/common/dto/pagination.dto';
import { DomainEventBus } from '@/common/events/domain-event-bus.service';
import { buildStockMetrics } from '../../../../prisma/data/constants';
import { SEED_STOCKS } from '../../../../prisma/data/stocks.data';
import { CreateStockDto } from '../dto/create-stock.dto';
import { QueryStocksDto } from '../dto/query-stocks.dto';
import { UpdateStockDto } from '../dto/update-stock.dto';
import { SafeStock, toSafeStock } from '../entities/stock.entity';
import { StockCreatedEvent } from '../events/stock-created.event';
import { StockUpdatedEvent } from '../events/stock-updated.event';
import { StockRepository } from '../repositories/stock.repository';
import { StockPriceHistoryRepository } from '../repositories/stock-price-history.repository';
import { generatePriceHistory, parseStocksCsv } from '../utils/stock.utils';
import { QueryStockHistoryDto } from '../dto/query-stock-history.dto';

@Injectable()
export class StockService {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly priceHistoryRepository: StockPriceHistoryRepository,
    private readonly eventBus: DomainEventBus,
  ) {}

  getStatus() {
    return { module: 'stock', status: 'active', phase: 5 };
  }

  async listStocks(query: QueryStocksDto): Promise<PaginatedResult<SafeStock>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { total, stocks } = await this.stockRepository.findManyPaginated({
      page,
      limit,
      search: query.search,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      minChangePercentage: query.minChangePercentage,
      maxChangePercentage: query.maxChangePercentage,
      sortBy: query.sortBy ?? 'symbol',
      sortOrder: query.sortOrder ?? 'asc',
    });

    return {
      data: stocks.map(toSafeStock),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getStockById(id: string) {
    const stock = await this.stockRepository.findById(id);
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }
    return toSafeStock(stock);
  }

  async getStockBySymbol(symbol: string) {
    const stock = await this.stockRepository.findBySymbol(symbol);
    if (!stock) {
      throw new NotFoundException(`Stock not found: ${symbol}`);
    }
    return toSafeStock(stock);
  }

  async createStock(dto: CreateStockDto, createdBy?: string) {
    const symbol = dto.symbol.toUpperCase();
    const existing = await this.stockRepository.findBySymbol(symbol);
    if (existing) {
      throw new ConflictException(`Stock symbol ${symbol} already exists`);
    }

    const metrics = buildStockMetrics(dto.currentPrice, dto.currentVolume);
    const stock = await this.stockRepository.create({
      symbol,
      companyName: dto.companyName,
      currentPrice: dto.currentPrice,
      currentVolume: dto.currentVolume,
      ...metrics,
      isSystemGenerated: false,
      createdBy,
    });

    this.eventBus.publish(
      new StockCreatedEvent({
        stockId: stock.id,
        symbol: stock.symbol,
        companyName: stock.companyName,
      }),
    );

    await this.ensurePriceHistory(stock.id, dto.currentPrice);

    return toSafeStock(stock);
  }

  async updateStock(id: string, dto: UpdateStockDto, updatedBy?: string) {
    const existing = await this.stockRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Stock not found');
    }

    if (
      dto.currentPrice === undefined &&
      dto.currentVolume === undefined &&
      dto.companyName === undefined
    ) {
      throw new BadRequestException('No fields to update');
    }

    const currentPrice =
      dto.currentPrice !== undefined ? dto.currentPrice : Number(existing.currentPrice);
    const currentVolume =
      dto.currentVolume !== undefined
        ? dto.currentVolume
        : Number(existing.currentVolume);

    const metrics =
      dto.currentPrice !== undefined || dto.currentVolume !== undefined
        ? buildStockMetrics(currentPrice, currentVolume)
        : null;

    const updatedFields = Object.keys(dto).filter(
      (key) => dto[key as keyof UpdateStockDto] !== undefined,
    );

    const stock = await this.stockRepository.update(id, {
      companyName: dto.companyName,
      currentPrice: dto.currentPrice,
      currentVolume: dto.currentVolume,
      ...(metrics ?? {}),
      updatedBy,
    });

    if (metrics) {
      updatedFields.push(
        'previousPrice',
        'previousVolume',
        'changePrice',
        'changeVolume',
        'changePercentage',
        'volumePercentage',
      );
    }

    this.eventBus.publish(
      new StockUpdatedEvent({
        stockId: stock.id,
        symbol: stock.symbol,
        updatedFields: [...new Set(updatedFields)],
      }),
    );

    return toSafeStock(stock);
  }

  async deleteStock(id: string, deletedBy?: string) {
    const existing = await this.stockRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Stock not found');
    }

    await this.stockRepository.softDelete(id, deletedBy);

    this.eventBus.publish(
      new StockUpdatedEvent({
        stockId: id,
        symbol: existing.symbol,
        updatedFields: ['deletedAt'],
      }),
    );

    return { message: 'Stock deleted successfully', id };
  }

  async seedSystemStocks() {
    const existing = await this.stockRepository.countSystemGenerated();
    if (existing > 0) {
      return { created: 0, skipped: existing, message: 'System stocks already seeded' };
    }

    let created = 0;

    for (const stock of SEED_STOCKS) {
      const metrics = buildStockMetrics(stock.currentPrice, stock.currentVolume);
      const record = await this.stockRepository.create({
        symbol: stock.symbol,
        companyName: stock.companyName,
        currentPrice: stock.currentPrice,
        currentVolume: stock.currentVolume,
        ...metrics,
        isSystemGenerated: true,
      });
      created += 1;
      this.eventBus.publish(
        new StockCreatedEvent({
          stockId: record.id,
          symbol: record.symbol,
          companyName: record.companyName,
        }),
      );
      await this.ensurePriceHistory(record.id, stock.currentPrice);
    }

    return { created, skipped: 0 };
  }

  async getPriceHistory(symbol: string, query: QueryStockHistoryDto) {
    const stock = await this.stockRepository.findBySymbol(symbol);
    if (!stock) {
      throw new NotFoundException(`Stock not found: ${symbol}`);
    }

    const interval = query.interval ?? '1d';
    const limit = query.limit ?? 90;

    let count = await this.priceHistoryRepository.countByStockId(stock.id, interval);
    if (count === 0) {
      await this.ensurePriceHistory(stock.id, Number(stock.currentPrice), interval, limit);
      count = await this.priceHistoryRepository.countByStockId(stock.id, interval);
    }

    const history = await this.priceHistoryRepository.findByStockId(stock.id, interval, limit);

    return {
      symbol: stock.symbol,
      interval,
      data: history.map((point) => ({
        time: Math.floor(point.timestamp.getTime() / 1000),
        open: Number(point.open),
        high: Number(point.high),
        low: Number(point.low),
        close: Number(point.close),
        volume: Number(point.volume),
      })),
    };
  }

  async importFromCsv(csv: string, createdBy?: string) {
    let rows;
    try {
      rows = parseStocksCsv(csv);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid CSV format',
      );
    }

    if (rows.length === 0) {
      throw new BadRequestException('CSV contains no data rows');
    }

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const row of rows) {
      try {
        const existing = await this.stockRepository.findBySymbol(row.symbol);
        if (existing) {
          results.skipped += 1;
          continue;
        }

        await this.createStock(
          {
            symbol: row.symbol,
            companyName: row.companyName,
            currentPrice: row.currentPrice,
            currentVolume: row.currentVolume,
          },
          createdBy,
        );
        results.created += 1;
      } catch (error) {
        results.errors.push(
          `${row.symbol}: ${error instanceof Error ? error.message : 'Import failed'}`,
        );
      }
    }

    return results;
  }

  async seedAllPriceHistory() {
    const stocks = await this.stockRepository.findSystemGenerated();
    let seeded = 0;

    for (const stock of stocks) {
      for (const interval of ['1d', '1h'] as const) {
        const count = await this.priceHistoryRepository.countByStockId(stock.id, interval);
        if (count > 0) continue;
        const days = interval === '1d' ? 90 : 7;
        await this.ensurePriceHistory(
          stock.id,
          Number(stock.currentPrice),
          interval,
          days,
        );
        seeded += 1;
      }
    }

    return { seeded, message: seeded > 0 ? 'Price history generated' : 'Already exists' };
  }

  private async ensurePriceHistory(
    stockId: string,
    basePrice: number,
    interval = '1d',
    days = 90,
  ) {
    const count = await this.priceHistoryRepository.countByStockId(stockId, interval);
    if (count > 0) return;

    const points = generatePriceHistory(stockId, basePrice, days, interval);
    await this.priceHistoryRepository.createMany(points);
  }

  async deleteSystemStocks() {
    const deleted = await this.stockRepository.deleteSystemGenerated();
    return { deleted: deleted.count };
  }

  async findSystemStocks() {
    const stocks = await this.stockRepository.findSystemGenerated();
    return stocks.map(toSafeStock);
  }

  async findBySymbol(symbol: string) {
    const stock = await this.stockRepository.findBySymbol(symbol);
    return stock ? toSafeStock(stock) : null;
  }

  /** Update last traded price and volume after a match. */
  async recordTrade(stockId: string, price: number, quantity: number) {
    const existing = await this.stockRepository.findById(stockId);
    if (!existing) {
      return null;
    }

    const previousPrice = Number(existing.previousPrice);
    const previousVolume = Number(existing.previousVolume);
    const currentVolume = Number(existing.currentVolume) + quantity;
    const changePrice = Number((price - previousPrice).toFixed(2));
    const changeVolume = currentVolume - previousVolume;
    const changePercentage =
      previousPrice === 0
        ? 0
        : Number(((changePrice / previousPrice) * 100).toFixed(4));
    const volumePercentage =
      previousVolume === 0
        ? 0
        : Number(((changeVolume / previousVolume) * 100).toFixed(4));

    const stock = await this.stockRepository.update(stockId, {
      currentPrice: price,
      currentVolume,
      changePrice,
      changeVolume,
      changePercentage,
      volumePercentage,
    });

    await this.appendTradeToPriceHistory(stockId, price, quantity);

    this.eventBus.publish(
      new StockUpdatedEvent({
        stockId: stock.id,
        symbol: stock.symbol,
        updatedFields: [
          'currentPrice',
          'currentVolume',
          'changePrice',
          'changePercentage',
        ],
      }),
    );

    return toSafeStock(stock);
  }

  private async appendTradeToPriceHistory(
    stockId: string,
    price: number,
    quantity: number,
  ) {
    const now = new Date();

    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);

    await Promise.all([
      this.priceHistoryRepository.upsertTradeCandle(
        stockId,
        dayStart,
        '1d',
        price,
        quantity,
      ),
      this.priceHistoryRepository.upsertTradeCandle(
        stockId,
        hourStart,
        '1h',
        price,
        quantity,
      ),
    ]);
  }
}
