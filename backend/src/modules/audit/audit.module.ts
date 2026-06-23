import { Module } from '@nestjs/common';
import { AuditController } from './controllers/audit.controller';
import { DomainEventAuditListener } from './listeners/domain-event-audit.listener';
import { AuditService } from './services/audit.service';
import { AuditRepository } from './repositories/audit.repository';

@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditRepository, DomainEventAuditListener],
  exports: [AuditService],
})
export class AuditModule {}
