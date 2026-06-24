import { Injectable } from '@nestjs/common';
import { Prisma, Stock } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface CreateStockData {
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
  isSystemGenerated?: boolean;
  createdBy?: string;
}

export interface UpdateStockData {
  companyName?: string;
  currentPrice?: number;
  currentVolume?: number;
  previousPrice?: number;
  previousVolume?: number;
  changePrice?: number;
  changeVolume?: number;
  changePercentage?: number;
  volumePercentage?: number;
  updatedBy?: string;
}

export interface FindStocksParams {
  page: number;
  limit: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minChangePercentage?: number;
  maxChangePercentage?: number;
  sortBy:
    | 'symbol'
    | 'companyName'
    | 'currentPrice'
    | 'currentVolume'
    | 'changePercentage'
    | 'changePrice'
    | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class StockRepository {
  constructor(private readonly prisma: PrismaService) {}

  countSystemGenerated() {
    return this.prisma.stock.count({
      where: { isSystemGenerated: true, deletedAt: null },
    });
  }

  create(data: CreateStockData): Promise<Stock> {
    return this.prisma.stock.create({
      data: {
        symbol: data.symbol,
        companyName: data.companyName,
        currentPrice: data.currentPrice,
        currentVolume: BigInt(data.currentVolume),
        previousPrice: data.previousPrice,
        previousVolume: BigInt(data.previousVolume),
        changePrice: data.changePrice,
        changeVolume: BigInt(data.changeVolume),
        changePercentage: data.changePercentage,
        volumePercentage: data.volumePercentage,
        isSystemGenerated: data.isSystemGenerated ?? false,
        createdBy: data.createdBy,
      },
    });
  }

  findById(id: string) {
    return this.prisma.stock.findFirst({
      where: { id, deletedAt: null },
    });
  }

  findBySymbol(symbol: string, excludeId?: string) {
    return this.prisma.stock.findFirst({
      where: {
        symbol: symbol.toUpperCase(),
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  update(id: string, data: UpdateStockData): Promise<Stock> {
    return this.prisma.stock.update({
      where: { id },
      data: {
        ...(data.companyName !== undefined ? { companyName: data.companyName } : {}),
        ...(data.currentPrice !== undefined ? { currentPrice: data.currentPrice } : {}),
        ...(data.currentVolume !== undefined
          ? { currentVolume: BigInt(data.currentVolume) }
          : {}),
        ...(data.previousPrice !== undefined ? { previousPrice: data.previousPrice } : {}),
        ...(data.previousVolume !== undefined
          ? { previousVolume: BigInt(data.previousVolume) }
          : {}),
        ...(data.changePrice !== undefined ? { changePrice: data.changePrice } : {}),
        ...(data.changeVolume !== undefined ? { changeVolume: BigInt(data.changeVolume) } : {}),
        ...(data.changePercentage !== undefined
          ? { changePercentage: data.changePercentage }
          : {}),
        ...(data.volumePercentage !== undefined
          ? { volumePercentage: data.volumePercentage }
          : {}),
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
      },
    });
  }

  softDelete(id: string, updatedBy?: string) {
    return this.prisma.stock.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  deleteSystemGenerated() {
    return this.prisma.stock.deleteMany({
      where: { isSystemGenerated: true },
    });
  }

  findSystemGenerated(): Promise<Stock[]> {
    return this.prisma.stock.findMany({
      where: { isSystemGenerated: true, deletedAt: null },
    });
  }

  findAll(): Promise<Stock[]> {
    return this.prisma.stock.findMany({
      where: { deletedAt: null },
    });
  }

  async findManyPaginated(params: FindStocksParams) {
    const {
      page,
      limit,
      search,
      minPrice,
      maxPrice,
      minChangePercentage,
      maxChangePercentage,
      sortBy,
      sortOrder,
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.StockWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { symbol: { contains: search, mode: 'insensitive' } },
              { companyName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            currentPrice: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
      ...(minChangePercentage !== undefined || maxChangePercentage !== undefined
        ? {
            changePercentage: {
              ...(minChangePercentage !== undefined ? { gte: minChangePercentage } : {}),
              ...(maxChangePercentage !== undefined ? { lte: maxChangePercentage } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.StockOrderByWithRelationInput =
      sortBy === 'companyName'
        ? { companyName: sortOrder }
        : sortBy === 'createdAt'
          ? { createdAt: sortOrder }
          : { [sortBy]: sortOrder };

    const [total, stocks] = await this.prisma.$transaction([
      this.prisma.stock.count({ where }),
      this.prisma.stock.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return { total, stocks };
  }
}
