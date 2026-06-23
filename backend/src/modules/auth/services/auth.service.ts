import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { DomainEventBus } from '@/common/events/domain-event-bus.service';
import { UserService } from '../../user/services/user.service';
import { LoginDto } from '../dto/login.dto';
import { LoginFailedEvent, LoginSuccessEvent } from '../events/login.events';
import { AuthenticatedUser, JwtPayload } from '../interfaces/authenticated-user.interface';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventBus: DomainEventBus,
  ) {}

  getStatus() {
    return { module: 'auth', status: 'active', phase: 3 };
  }

  async login(dto: LoginDto) {
    const user = await this.userService.validateCredentials(dto.username, dto.password);

    if (!user) {
      this.eventBus.publish(new LoginFailedEvent({ username: dto.username, reason: 'invalid_credentials' }));
      throw new UnauthorizedException('Invalid username or password');
    }

    const tokenId = randomUUID();
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '24h');
    const expiresAt = this.resolveExpiryDate(expiresIn);

    await this.sessionService.createSession(user.id, tokenId, expiresAt);

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      jti: tokenId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    this.eventBus.publish(
      new LoginSuccessEvent({
        userId: user.id,
        username: user.username,
        role: user.role,
      }),
    );

    return {
      accessToken,
      expiresIn,
      user,
    };
  }

  async logout(tokenId: string) {
    await this.sessionService.invalidateSession(tokenId);
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  buildAuthenticatedUser(user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  private resolveExpiryDate(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }
}
