import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationController } from './controllers/notification.controller';
import { DomainEventNotificationListener } from './listeners/domain-event-notification.listener';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [RealtimeModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository, DomainEventNotificationListener],
  exports: [NotificationService],
})
export class NotificationModule {}
