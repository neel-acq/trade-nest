import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../repositories/session.repository';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  createSession(userId: string, tokenId: string, expiresAt: Date) {
    return this.sessionRepository.create({ userId, tokenId, expiresAt });
  }

  isSessionActive(tokenId: string) {
    return this.sessionRepository.findActiveByTokenId(tokenId);
  }

  invalidateSession(tokenId: string) {
    return this.sessionRepository.invalidateByTokenId(tokenId);
  }

  invalidateAllUserSessions(userId: string) {
    return this.sessionRepository.invalidateAllForUser(userId);
  }
}
