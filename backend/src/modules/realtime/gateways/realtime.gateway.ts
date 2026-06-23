import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { SessionService } from '../../auth/services/session.service';
import { UserService } from '../../user/services/user.service';
import { JwtPayload } from '../../auth/interfaces/authenticated-user.interface';
import {
  CLIENT_EVENTS,
  REALTIME_EVENTS,
  stockRoom,
  userRoom,
} from '../realtime.events';
import { RealtimeBroadcastService } from '../services/realtime-broadcast.service';

interface StockSubscriptionPayload {
  symbol: string;
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly userService: UserService,
    private readonly broadcastService: RealtimeBroadcastService,
  ) {}

  afterInit(server: Server) {
    this.broadcastService.setServer(server);
    this.logger.log('Realtime gateway initialized on namespace /realtime');
  }

  async handleConnection(client: Socket) {
    try {
      const user = await this.authenticateClient(client);
      client.data.user = user;
      await client.join(userRoom(user.id));

      client.emit(REALTIME_EVENTS.CONNECTED, {
        userId: user.id,
        username: user.username,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn(`Socket connection rejected: ${(error as Error).message}`);
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as { username?: string } | undefined;
    if (user?.username) {
      this.logger.debug(`Client disconnected: ${user.username}`);
    }
  }

  @SubscribeMessage(CLIENT_EVENTS.SUBSCRIBE_STOCK)
  handleSubscribeStock(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: StockSubscriptionPayload,
  ) {
    const symbol = payload?.symbol?.toUpperCase();
    if (!symbol) {
      return { success: false, message: 'Symbol is required' };
    }

    client.join(stockRoom(symbol));
    return { success: true, symbol };
  }

  @SubscribeMessage(CLIENT_EVENTS.UNSUBSCRIBE_STOCK)
  handleUnsubscribeStock(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: StockSubscriptionPayload,
  ) {
    const symbol = payload?.symbol?.toUpperCase();
    if (!symbol) {
      return { success: false, message: 'Symbol is required' };
    }

    client.leave(stockRoom(symbol));
    return { success: true, symbol };
  }

  private async authenticateClient(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedException('Missing auth token');
    }

    const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    const session = await this.sessionService.isSessionActive(payload.jti);
    if (!session) {
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.userService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User inactive');
    }

    return user;
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return null;
  }
}
