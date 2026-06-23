import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StockModule } from '../stock/stock.module';
import { UserModule } from '../user/user.module';
import { RealtimeController } from './controllers/realtime.controller';
import { RealtimeGateway } from './gateways/realtime.gateway';
import { DomainEventRealtimeListener } from './listeners/domain-event-realtime.listener';
import { RealtimeBroadcastService } from './services/realtime-broadcast.service';

@Module({
  imports: [AuthModule, UserModule, StockModule],
  controllers: [RealtimeController],
  providers: [RealtimeGateway, RealtimeBroadcastService, DomainEventRealtimeListener],
  exports: [RealtimeBroadcastService],
})
export class RealtimeModule {}
