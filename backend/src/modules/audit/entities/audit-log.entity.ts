import { AuditLog, LogType, User } from '@prisma/client';

export type AuditLogWithUser = AuditLog & {
  user?: Pick<User, 'username' | 'fullName'> | null;
};

export interface SafeAuditLog {
  id: string;
  userId: string | null;
  username: string | null;
  fullName: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  logType: LogType;
  createdAt: Date;
}

export function toSafeAuditLog(log: AuditLogWithUser): SafeAuditLog {
  return {
    id: log.id,
    userId: log.userId,
    username: log.user?.username ?? null,
    fullName: log.user?.fullName ?? null,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata as Record<string, unknown> | null,
    logType: log.logType,
    createdAt: log.createdAt,
  };
}
