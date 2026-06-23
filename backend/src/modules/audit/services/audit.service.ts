import { Injectable, NotFoundException } from '@nestjs/common';
import { LogType } from '@prisma/client';
import { buildPaginationMeta, PaginatedResult } from '@/common/dto/pagination.dto';
import { QueryAuditLogsDto } from '../dto/query-audit-logs.dto';
import { SafeAuditLog, toSafeAuditLog } from '../entities/audit-log.entity';
import { AuditRepository, CreateAuditLogData } from '../repositories/audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  getStatus() {
    return { module: 'audit', status: 'active', phase: 13 };
  }

  record(data: CreateAuditLogData) {
    return this.auditRepository.create(data);
  }

  async listLogs(query: QueryAuditLogsDto): Promise<PaginatedResult<SafeAuditLog>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { total, logs } = await this.auditRepository.findManyPaginated({
      page,
      limit,
      userId: query.userId,
      action: query.action,
      entityType: query.entityType,
      logType: query.logType,
      search: query.search,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });

    return {
      data: logs.map(toSafeAuditLog),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getLogById(id: string): Promise<SafeAuditLog> {
    const log = await this.auditRepository.findById(id);
    if (!log) {
      throw new NotFoundException('Audit log not found');
    }
    return toSafeAuditLog(log);
  }

  recordFromDomainEvent(
    eventName: string,
    payload: Record<string, unknown>,
    options?: {
      action?: string;
      entityType?: string;
      entityId?: string;
      logType?: LogType;
    },
  ) {
    const userId = (payload.userId as string | undefined) ?? undefined;
    const action = options?.action ?? eventName;
    const entityId =
      options?.entityId ??
      (payload.orderId as string | undefined) ??
      (payload.tradeId as string | undefined) ??
      (payload.userId as string | undefined);

    return this.record({
      userId,
      action,
      entityType: options?.entityType,
      entityId,
      metadata: payload,
      logType: options?.logType ?? LogType.AUDIT,
    });
  }
}
