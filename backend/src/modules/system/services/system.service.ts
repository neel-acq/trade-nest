import { Injectable, NotFoundException } from '@nestjs/common';
import { LogType } from '@prisma/client';
import { buildPaginationMeta, PaginatedResult } from '@/common/dto/pagination.dto';
import { QuerySystemLogsDto } from '../dto/query-system-logs.dto';
import { SafeSystemLog, toSafeSystemLog } from '../entities/system-log.entity';
import {
  CreateSystemLogData,
  SystemLogRepository,
} from '../repositories/system-log.repository';

@Injectable()
export class SystemService {
  constructor(private readonly systemLogRepository: SystemLogRepository) {}

  getStatus() {
    return { module: 'system', status: 'active', phase: 13 };
  }

  record(data: CreateSystemLogData) {
    return this.systemLogRepository.create(data);
  }

  info(message: string, context?: string, metadata?: Record<string, unknown>) {
    return this.record({ message, context, metadata, logType: LogType.INFO });
  }

  warning(message: string, context?: string, metadata?: Record<string, unknown>) {
    return this.record({ message, context, metadata, logType: LogType.WARNING });
  }

  error(message: string, context?: string, metadata?: Record<string, unknown>) {
    return this.record({ message, context, metadata, logType: LogType.ERROR });
  }

  async listLogs(query: QuerySystemLogsDto): Promise<PaginatedResult<SafeSystemLog>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { total, logs } = await this.systemLogRepository.findManyPaginated({
      page,
      limit,
      logType: query.logType,
      context: query.context,
      search: query.search,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });

    return {
      data: logs.map(toSafeSystemLog),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getLogById(id: string): Promise<SafeSystemLog> {
    const log = await this.systemLogRepository.findById(id);
    if (!log) {
      throw new NotFoundException('System log not found');
    }
    return toSafeSystemLog(log);
  }
}
