import { Injectable, NotFoundException } from '@nestjs/common';
import { RealtimeBroadcastService } from '../../realtime/services/realtime-broadcast.service';
import { REALTIME_EVENTS } from '../../realtime/realtime.events';
import { QueryNotificationsDto } from '../dto/query-notifications.dto';
import {
  CreateNotificationData,
  NotificationRepository,
} from '../repositories/notification.repository';
import { SafeNotification, toSafeNotification } from '../entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly realtimeBroadcast: RealtimeBroadcastService,
  ) {}

  getStatus() {
    return { module: 'notification', status: 'active', phase: 14 };
  }

  async createAndNotify(data: CreateNotificationData): Promise<SafeNotification> {
    const notification = await this.notificationRepository.create(data);
    const safe = toSafeNotification(notification);
    this.realtimeBroadcast.emitToUser(data.userId, REALTIME_EVENTS.NOTIFICATION_CREATED, {
      ...safe,
      createdAt: safe.createdAt.toISOString(),
      updatedAt: safe.updatedAt.toISOString(),
      readAt: safe.readAt?.toISOString() ?? null,
    });
    return safe;
  }

  async listForUser(userId: string, query: QueryNotificationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.notificationRepository.findManyPaginated({
      userId,
      page,
      limit,
      isRead: query.isRead,
      type: query.type,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });

    return {
      data: result.data.map(toSafeNotification),
      meta: result.meta,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.countUnread(userId);
    return { count };
  }

  async markRead(userId: string, id: string) {
    const existing = await this.notificationRepository.findByIdForUser(id, userId);
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    if (existing.isRead) {
      return toSafeNotification(existing);
    }

    const updated = await this.notificationRepository.markRead(id, userId);
    if (!updated) {
      throw new NotFoundException('Notification not found');
    }

    return toSafeNotification(updated);
  }

  async markAllRead(userId: string) {
    const updated = await this.notificationRepository.markAllRead(userId);
    return { updated };
  }
}
