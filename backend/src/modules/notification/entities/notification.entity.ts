import { Notification, NotificationType } from '@prisma/client';

export type SafeNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: Date | null;
  isSystemGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toSafeNotification(notification: Notification): SafeNotification {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    metadata: notification.metadata as Record<string, unknown> | null,
    isRead: notification.isRead,
    readAt: notification.readAt,
    isSystemGenerated: notification.isSystemGenerated,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}
