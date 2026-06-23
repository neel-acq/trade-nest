import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { buildPaginationMeta, PaginatedResult } from '@/common/dto/pagination.dto';
import { StockService } from '../../stock/services/stock.service';
import { UserService } from '../../user/services/user.service';
import { QueryHoldingsDto } from '../dto/query-holdings.dto';
import {
  buildPortfolioSummary,
  PortfolioSummary,
  SafeHolding,
  toSafeHolding,
} from '../entities/portfolio.entity';
import { PortfolioRepository, UpsertPortfolioData } from '../repositories/portfolio.repository';

export interface PortfolioOverview {
  summary: PortfolioSummary;
  holdings: SafeHolding[];
}

@Injectable()
export class PortfolioService {
  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    private readonly stockService: StockService,
    private readonly userService: UserService,
  ) {}

  getStatus() {
    return { module: 'portfolio', status: 'active', phase: 10 };
  }

  async getMySummary(userId: string): Promise<PortfolioSummary> {
    const holdings = await this.loadAllSafeHoldings(userId);
    return buildPortfolioSummary(holdings);
  }

  async getMyPortfolio(userId: string, query: QueryHoldingsDto): Promise<PortfolioOverview> {
    const allHoldings = await this.loadAllSafeHoldings(userId);
    const summary = buildPortfolioSummary(allHoldings);
    const paginated = await this.listHoldings(userId, query, UserRole.TRADER);

    return {
      summary,
      holdings: paginated.data,
    };
  }

  async listHoldings(
    userId: string,
    query: QueryHoldingsDto,
    userRole: UserRole,
    targetUserId?: string,
  ): Promise<PaginatedResult<SafeHolding>> {
    const resolvedUserId = this.resolveUserId(userId, userRole, targetUserId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'symbol';
    const sortOrder = query.sortOrder ?? 'asc';

    if (sortBy === 'currentValue' || sortBy === 'unrealizedPnL') {
      const allHoldings = await this.loadAllSafeHoldings(resolvedUserId);
      const filtered = query.search
        ? allHoldings.filter(
            (holding) =>
              holding.symbol.toLowerCase().includes(query.search!.toLowerCase()) ||
              holding.companyName.toLowerCase().includes(query.search!.toLowerCase()),
          )
        : allHoldings;

      const direction = sortOrder === 'desc' ? -1 : 1;
      filtered.sort((a, b) => (a[sortBy] - b[sortBy]) * direction);

      const total = filtered.length;
      const start = (page - 1) * limit;
      return {
        data: filtered.slice(start, start + limit),
        meta: buildPaginationMeta(total, page, limit),
      };
    }

    const { total, holdings } = await this.portfolioRepository.findManyPaginated({
      userId: resolvedUserId,
      page,
      limit,
      search: query.search,
      sortBy: this.mapSortBy(sortBy),
      sortOrder,
    });

    return {
      data: holdings.map((holding) =>
        toSafeHolding(holding, Number(holding.stock.currentPrice)),
      ),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getHoldingBySymbol(
    userId: string,
    symbol: string,
    userRole: UserRole,
    targetUserId?: string,
  ): Promise<SafeHolding> {
    const resolvedUserId = this.resolveUserId(userId, userRole, targetUserId);
    const stock = await this.stockService.getStockBySymbol(symbol);
    const holding = await this.portfolioRepository.findHolding(resolvedUserId, stock.id);

    if (!holding) {
      throw new NotFoundException(`No holding found for ${symbol}`);
    }

    return toSafeHolding(holding, stock.currentPrice);
  }

  upsertSystemHolding(data: UpsertPortfolioData) {
    return this.portfolioRepository.upsert({
      ...data,
      isSystemGenerated: true,
    });
  }

  async deleteSystemHoldings() {
    const deleted = await this.portfolioRepository.deleteSystemGenerated();
    return { deleted: deleted.count };
  }

  async getHoldingQuantity(userId: string, stockId: string): Promise<number> {
    const holding = await this.portfolioRepository.findHolding(userId, stockId);
    return holding?.quantity ?? 0;
  }

  async applyBuyTrade(userId: string, stockId: string, quantity: number, price: number) {
    const holding = await this.portfolioRepository.findHolding(userId, stockId);
    const tradeAmount = Number((price * quantity).toFixed(2));

    if (!holding) {
      return this.portfolioRepository.upsert({
        userId,
        stockId,
        quantity,
        averageBuyPrice: price,
        investedAmount: tradeAmount,
        isSystemGenerated: false,
      });
    }

    const newQuantity = holding.quantity + quantity;
    const newInvested = Number(holding.investedAmount) + tradeAmount;
    const averageBuyPrice = Number((newInvested / newQuantity).toFixed(4));

    return this.portfolioRepository.upsert({
      userId,
      stockId,
      quantity: newQuantity,
      averageBuyPrice,
      investedAmount: newInvested,
      realizedPnL: Number(holding.realizedPnL),
      isSystemGenerated: false,
    });
  }

  async applySellTrade(userId: string, stockId: string, quantity: number, sellPrice: number) {
    const holding = await this.portfolioRepository.findHolding(userId, stockId);
    if (!holding || holding.quantity < quantity) {
      throw new Error('Insufficient holdings to settle sell trade');
    }

    const averageBuyPrice = Number(holding.averageBuyPrice);
    const realizedPnL = Number(
      (Number(holding.realizedPnL) + (sellPrice - averageBuyPrice) * quantity).toFixed(2),
    );
    const newQuantity = holding.quantity - quantity;

    if (newQuantity === 0) {
      return this.portfolioRepository.deleteHolding(userId, stockId);
    }

    const investedAmount = Number((averageBuyPrice * newQuantity).toFixed(2));

    return this.portfolioRepository.upsert({
      userId,
      stockId,
      quantity: newQuantity,
      averageBuyPrice,
      investedAmount,
      realizedPnL,
      isSystemGenerated: false,
    });
  }

  private async loadAllSafeHoldings(userId: string): Promise<SafeHolding[]> {
    const holdings = await this.portfolioRepository.findAllByUserId(userId);
    return holdings.map((holding) =>
      toSafeHolding(holding, Number(holding.stock.currentPrice)),
    );
  }

  private resolveUserId(
    requesterId: string,
    userRole: UserRole,
    targetUserId?: string,
  ): string {
    if (userRole === UserRole.ADMIN) {
      if (targetUserId) {
        return targetUserId;
      }
      return requesterId;
    }

    if (targetUserId && targetUserId !== requesterId) {
      throw new ForbiddenException('Access denied');
    }

    return requesterId;
  }

  private mapSortBy(
    sortBy: QueryHoldingsDto['sortBy'],
  ): 'symbol' | 'quantity' | 'investedAmount' | 'updatedAt' {
    if (sortBy === 'currentValue' || sortBy === 'unrealizedPnL') {
      return 'updatedAt';
    }
    return sortBy ?? 'symbol';
  }

  async ensureUserExists(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
