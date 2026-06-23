import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { QueryHoldingsDto } from '../dto/query-holdings.dto';
import { PortfolioService } from '../services/portfolio.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.portfolioService.getStatus();
  }

  @Get('me/summary')
  getMySummary(@CurrentUser() user: AuthenticatedUser) {
    return this.portfolioService.getMySummary(user.id);
  }

  @Get('me/holdings/:symbol')
  getMyHoldingBySymbol(
    @CurrentUser() user: AuthenticatedUser,
    @Param('symbol') symbol: string,
  ) {
    return this.portfolioService.getHoldingBySymbol(user.id, symbol, user.role);
  }

  @Get('me/holdings')
  listMyHoldings(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryHoldingsDto) {
    return this.portfolioService.listHoldings(user.id, query, user.role);
  }

  @Get('me')
  getMyPortfolio(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryHoldingsDto) {
    return this.portfolioService.getMyPortfolio(user.id, query);
  }

  @Roles(UserRole.ADMIN)
  @Get('users/:userId/summary')
  async getUserSummary(@Param('userId') userId: string) {
    await this.portfolioService.ensureUserExists(userId);
    return this.portfolioService.getMySummary(userId);
  }

  @Roles(UserRole.ADMIN)
  @Get('users/:userId/holdings')
  async listUserHoldings(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Query() query: QueryHoldingsDto,
  ) {
    await this.portfolioService.ensureUserExists(userId);
    return this.portfolioService.listHoldings(user.id, query, user.role, userId);
  }
}
