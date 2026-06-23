import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';

interface AuthRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.authService.getStatus();
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  logout(@Req() req: AuthRequest) {
    return this.authService.logout(req.user.tokenId);
  }

  @Get('me')
  me(@Req() req: AuthRequest) {
    return this.authService.getProfile(req.user.id);
  }
}
