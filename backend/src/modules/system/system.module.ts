import { Module } from '@nestjs/common';
import { SystemController } from './controllers/system.controller';
import { DomainEventSystemListener } from './listeners/domain-event-system.listener';
import { SystemService } from './services/system.service';
import { SystemLogRepository } from './repositories/system-log.repository';

@Module({
  controllers: [SystemController],
  providers: [SystemService, SystemLogRepository, DomainEventSystemListener],
  exports: [SystemService],
})
export class SystemModule {}
