import { Injectable } from '@nestjs/common';
import { Notification, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface FindNotificationsParams {
  userId: string;
  page: number;
  limit: number;
  isRead?: boolean;
  type?: NotificationType;
  sortBy: 'createdAt' | 'readAt';
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateNotificationData): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        metadata: data.metadata ?? undefined,
      },
    });
  }

  findByIdForUser(id: string, userId: string): Promise<Notification | null> {
    return this.prisma.notification.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false, deletedAt: null },
    });
  }

  markRead(id: string, userId: string): Promise<Notification | null> {
    return this.prisma.notification.updateMany({
      where: { id, userId, isRead: false, deletedAt: null },
      data: { isRead: true, readAt: new Date() },
    }).then((result) => {
      if (result.count === 0) return null;
      return this.findByIdForUser(id, userId);
    });
  }

  markAllRead(userId: string): Promise<number> {
    return this.prisma.notification
      .updateMany({
        where: { userId, isRead: false, deletedAt: null },
        data: { isRead: true, readAt: new Date() },
      })
      .then((result) => result.count);
  }

  async findManyPaginated(params: FindNotificationsParams) {
    const { userId, page, limit, isRead, type, sortBy, sortOrder } = params;
    const where: Prisma.NotificationWhereInput = {
      userId,
      deletedAt: null,
      ...(isRead !== undefined ? { isRead } : {}),
      ...(type ? { type } : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
