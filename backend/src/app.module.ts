import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { StockModule } from './modules/stock/stock.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { OrderModule } from './modules/order/order.module';
import { MatchingModule } from './modules/matching/matching.module';
import { TradeModule } from './modules/trade/trade.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuditModule } from './modules/audit/audit.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { SeederModule } from './modules/seeder/seeder.module';
import { SystemModule } from './modules/system/system.module';
import { EventsModule } from './common/events/events.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute per IP
    }]),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
    }),
    EventsModule,
    PrismaModule,
    AuthModule,
    UserModule,
    StockModule,
    WalletModule,
    OrderModule,
    TradeModule,
    MatchingModule,
    PortfolioModule,
    NotificationModule,
    AuditModule,
    DashboardModule,
    RealtimeModule,
    SeederModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
