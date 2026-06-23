import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.dashboardService.getStatus();
  }

  @Get('me')
  getMyDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getTraderOverview(user.id);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin')
  getAdminDashboard() {
    return this.dashboardService.getAdminOverview();
  }
}
