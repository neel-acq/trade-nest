import { Controller, Get } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';

@Controller('realtime')
export class RealtimeController {
  @Public()
  @Get('status')
  getStatus() {
    return {
      module: 'realtime',
      status: 'active',
      phase: 12,
      namespace: '/realtime',
      transport: 'socket.io',
    };
  }
}
