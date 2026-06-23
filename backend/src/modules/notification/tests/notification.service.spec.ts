import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { RealtimeBroadcastService } from '../../realtime/services/realtime-broadcast.service';
import { REALTIME_EVENTS } from '../../realtime/realtime.events';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationService } from '../services/notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: jest.Mocked<
    Pick<
      NotificationRepository,
      'create' | 'findByIdForUser' | 'countUnread' | 'markRead' | 'markAllRead' | 'findManyPaginated'
    >
  >;
  let broadcast: jest.Mocked<Pick<RealtimeBroadcastService, 'emitToUser'>>;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    type: NotificationType.ORDER,
    title: 'Order placed',
    message: 'Test message',
    link: '/orders',
    metadata: { orderId: 'order-1' },
    isRead: false,
    readAt: null,
    isSystemGenerated: false,
    createdAt: new Date('2025-06-23T10:00:00.000Z'),
    updatedAt: new Date('2025-06-23T10:00:00.000Z'),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn().mockResolvedValue(mockNotification),
      findByIdForUser: jest.fn().mockResolvedValue(mockNotification),
      countUnread: jest.fn().mockResolvedValue(3),
      markRead: jest.fn().mockResolvedValue({ ...mockNotification, isRead: true, readAt: new Date() }),
      markAllRead: jest.fn().mockResolvedValue(2),
      findManyPaginated: jest.fn().mockResolvedValue({
        data: [mockNotification],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      }),
    };

    broadcast = {
      emitToUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: NotificationRepository, useValue: repository },
        { provide: RealtimeBroadcastService, useValue: broadcast },
      ],
    }).compile();

    service = module.get(NotificationService);
  });

  it('creates notification and emits realtime event', async () => {
    const result = await service.createAndNotify({
      userId: 'user-1',
      type: NotificationType.ORDER,
      title: 'Order placed',
      message: 'Test message',
      link: '/orders',
    });

    expect(repository.create).toHaveBeenCalled();
    expect(broadcast.emitToUser).toHaveBeenCalledWith(
      'user-1',
      REALTIME_EVENTS.NOTIFICATION_CREATED,
      expect.objectContaining({ id: 'notif-1', title: 'Order placed' }),
    );
    expect(result.id).toBe('notif-1');
  });

  it('returns unread count', async () => {
    await expect(service.getUnreadCount('user-1')).resolves.toEqual({ count: 3 });
  });

  it('marks notification as read', async () => {
    const result = await service.markRead('user-1', 'notif-1');
    expect(repository.markRead).toHaveBeenCalledWith('notif-1', 'user-1');
    expect(result.isRead).toBe(true);
  });

  it('throws when notification not found', async () => {
    repository.findByIdForUser.mockResolvedValueOnce(null);
    await expect(service.markRead('user-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
