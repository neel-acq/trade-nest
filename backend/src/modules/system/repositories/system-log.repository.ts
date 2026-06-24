import { Injectable } from '@nestjs/common';
import { LogType, Prisma, SystemLog } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface CreateSystemLogData {
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
  logType?: LogType;
}

export interface FindSystemLogsParams {
  page: number;
  limit: number;
  logType?: LogType;
  context?: string;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
  sortBy: 'createdAt' | 'logType';
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class SystemLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateSystemLogData): Promise<SystemLog> {
    return this.prisma.systemLog.create({
      data: {
        message: data.message,
        context: data.context,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
        logType: data.logType ?? LogType.INFO,
      },
    });
  }

  findById(id: string): Promise<SystemLog | null> {
    return this.prisma.systemLog.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findManyPaginated(params: FindSystemLogsParams) {
    const { page, limit, logType, context, search, fromDate, toDate, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.SystemLogWhereInput = {
      deletedAt: null,
      ...(logType ? { logType } : {}),
      ...(context ? { context } : {}),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { message: { contains: search, mode: 'insensitive' } },
              { context: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.SystemLogOrderByWithRelationInput =
      sortBy === 'createdAt' ? { createdAt: sortOrder } : { logType: sortOrder };

    const [total, logs] = await this.prisma.$transaction([
      this.prisma.systemLog.count({ where }),
      this.prisma.systemLog.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return { total, logs };
  }
}
