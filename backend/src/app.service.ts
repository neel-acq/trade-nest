import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'tradenest-api',
      phase: 3,
      timestamp: new Date().toISOString(),
    };
  }
}
