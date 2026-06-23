import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { QuerySystemLogsDto } from '../dto/query-system-logs.dto';
import { SystemService } from '../services/system.service';

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.systemService.getStatus();
  }

  @Roles(UserRole.ADMIN)
  @Get('logs')
  listLogs(@Query() query: QuerySystemLogsDto) {
    return this.systemService.listLogs(query);
  }

  @Roles(UserRole.ADMIN)
  @Get('logs/:id')
  getLog(@Param('id') id: string) {
    return this.systemService.getLogById(id);
  }
}
