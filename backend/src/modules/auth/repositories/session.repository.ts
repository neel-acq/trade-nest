import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { userId: string; tokenId: string; expiresAt: Date }) {
    return this.prisma.session.create({ data });
  }

  findActiveByTokenId(tokenId: string) {
    return this.prisma.session.findFirst({
      where: {
        tokenId,
        invalidatedAt: null,
        deletedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  invalidateByTokenId(tokenId: string) {
    return this.prisma.session.updateMany({
      where: { tokenId, invalidatedAt: null },
      data: { invalidatedAt: new Date() },
    });
  }

  invalidateAllForUser(userId: string) {
    return this.prisma.session.updateMany({
      where: { userId, invalidatedAt: null },
      data: { invalidatedAt: new Date() },
    });
  }
}
