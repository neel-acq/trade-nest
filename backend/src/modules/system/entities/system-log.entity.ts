import { LogType, SystemLog } from '@prisma/client';

export interface SafeSystemLog {
  id: string;
  message: string;
  context: string | null;
  metadata: Record<string, unknown> | null;
  logType: LogType;
  createdAt: Date;
}

export function toSafeSystemLog(log: SystemLog): SafeSystemLog {
  return {
    id: log.id,
    message: log.message,
    context: log.context,
    metadata: log.metadata as Record<string, unknown> | null,
    logType: log.logType,
    createdAt: log.createdAt,
  };
}
