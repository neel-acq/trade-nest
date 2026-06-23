import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { QueryWalletsDto } from '../dto/query-wallets.dto';
import { WalletAmountDto } from '../dto/wallet-amount.dto';
import { WalletService } from '../services/wallet.service';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.walletService.getStatus();
  }

  @Get('me')
  getMyWallet(@CurrentUser() user: AuthenticatedUser) {
    return this.walletService.getMyWallet(user.id);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  listWallets(@Query() query: QueryWalletsDto) {
    return this.walletService.listWallets(query);
  }

  @Roles(UserRole.ADMIN)
  @Get('user/:userId')
  getWalletByUser(@Param('userId') userId: string) {
    return this.walletService.getWalletByUserId(userId);
  }

  @Roles(UserRole.ADMIN)
  @Post('user/:userId/credit')
  adminCredit(@Param('userId') userId: string, @Body() dto: WalletAmountDto) {
    return this.walletService.adminCredit(userId, dto);
  }

  @Roles(UserRole.ADMIN)
  @Post('user/:userId/debit')
  adminDebit(@Param('userId') userId: string, @Body() dto: WalletAmountDto) {
    return this.walletService.adminDebit(userId, dto);
  }
}
