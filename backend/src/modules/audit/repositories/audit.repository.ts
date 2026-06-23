import { Injectable } from '@nestjs/common';
import { AuditLog, LogType, Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditLogWithUser } from '../entities/audit-log.entity';

export interface CreateAuditLogData {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  logType?: LogType;
}

export interface FindAuditLogsParams {
  page: number;
  limit: number;
  userId?: string;
  action?: string;
  entityType?: string;
  logType?: LogType;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
  sortBy: 'createdAt' | 'action';
  sortOrder: 'asc' | 'desc';
}

const userSelect = { username: true, fullName: true } as const;

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateAuditLogData): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata ?? undefined,
        logType: data.logType ?? LogType.AUDIT,
      },
    });
  }

  findById(id: string): Promise<AuditLogWithUser | null> {
    return this.prisma.auditLog.findFirst({
      where: { id, deletedAt: null },
      include: { user: { select: userSelect } },
    }) as Promise<AuditLogWithUser | null>;
  }

  async findManyPaginated(params: FindAuditLogsParams) {
    const {
      page,
      limit,
      userId,
      action,
      entityType,
      logType,
      search,
      fromDate,
      toDate,
      sortBy,
      sortOrder,
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      deletedAt: null,
      ...(userId ? { userId } : {}),
      ...(action ? { action } : {}),
      ...(entityType ? { entityType } : {}),
      ...(logType ? { logType } : {}),
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
              { action: { contains: search, mode: 'insensitive' } },
              { entityType: { contains: search, mode: 'insensitive' } },
              { entityId: { contains: search, mode: 'insensitive' } },
              {
                user: {
                  OR: [
                    { username: { contains: search, mode: 'insensitive' } },
                    { fullName: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.AuditLogOrderByWithRelationInput =
      sortBy === 'createdAt' ? { createdAt: sortOrder } : { action: sortOrder };

    const [total, logs] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { user: { select: userSelect } },
      }),
    ]);

    return { total, logs: logs as AuditLogWithUser[] };
  }
}
