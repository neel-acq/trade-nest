import { Controller, Delete, Get, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '@/common/decorators/roles.decorator';
import { SeederService } from '../services/seeder.service';

@Controller('seed')
@Roles(UserRole.ADMIN)
export class SeederController {
  constructor(private readonly seederService: SeederService) {}

  @Get('status')
  getStatus() {
    return this.seederService.getStatus();
  }

  @Post('users')
  seedUsers() {
    return this.seederService.seedUsers();
  }

  @Post('stocks')
  seedStocks() {
    return this.seederService.seedStocks();
  }

  @Post('wallets')
  seedWallets() {
    return this.seederService.seedWallets();
  }

  @Post('orders')
  seedOrders() {
    return this.seederService.seedOrders();
  }

  @Post('trades')
  seedTrades() {
    return this.seederService.seedTrades();
  }

  @Post('all')
  seedAll() {
    return this.seederService.seedAll();
  }

  @Delete('trades')
  deleteTrades() {
    return this.seederService.deleteTrades();
  }

  @Delete('orders')
  deleteOrders() {
    return this.seederService.deleteOrders();
  }

  @Delete('stocks')
  deleteStocks() {
    return this.seederService.deleteStocks();
  }

  @Delete('users')
  deleteUsers() {
    return this.seederService.deleteUsers();
  }
}
