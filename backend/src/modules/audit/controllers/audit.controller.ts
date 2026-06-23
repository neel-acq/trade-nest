import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { QueryAuditLogsDto } from '../dto/query-audit-logs.dto';
import { AuditService } from '../services/audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.auditService.getStatus();
  }

  @Roles(UserRole.ADMIN)
  @Get('logs')
  listLogs(@Query() query: QueryAuditLogsDto) {
    return this.auditService.listLogs(query);
  }

  @Roles(UserRole.ADMIN)
  @Get('logs/:id')
  getLog(@Param('id') id: string) {
    return this.auditService.getLogById(id);
  }
}
