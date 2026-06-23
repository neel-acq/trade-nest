import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LogType } from '@prisma/client';
import { AuditRepository } from '../repositories/audit.repository';
import { AuditService } from '../services/audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let auditRepository: jest.Mocked<Pick<AuditRepository, 'findManyPaginated' | 'findById' | 'create'>>;

  const mockLog = {
    id: 'log-1',
    userId: 'user-1',
    action: 'ORDER_CREATED',
    entityType: 'Order',
    entityId: 'order-1',
    metadata: { orderId: 'order-1' },
    logType: LogType.AUDIT,
    isSystemGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    user: { username: 'trader_01', fullName: 'Trader One' },
  };

  beforeEach(async () => {
    auditRepository = {
      create: jest.fn().mockResolvedValue(mockLog),
      findManyPaginated: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: AuditRepository, useValue: auditRepository },
      ],
    }).compile();

    service = module.get(AuditService);
  });

  it('records audit logs from domain events', async () => {
    await service.recordFromDomainEvent(
      'OrderCreated',
      { userId: 'user-1', orderId: 'order-1' },
      { action: 'ORDER_CREATED', entityType: 'Order', entityId: 'order-1' },
    );

    expect(auditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        action: 'ORDER_CREATED',
        entityType: 'Order',
        entityId: 'order-1',
      }),
    );
  });

  it('lists audit logs for admin', async () => {
    auditRepository.findManyPaginated.mockResolvedValue({ total: 1, logs: [mockLog] });

    const result = await service.listLogs({});

    expect(result.data[0].action).toBe('ORDER_CREATED');
    expect(result.data[0].username).toBe('trader_01');
  });

  it('throws when audit log not found', async () => {
    auditRepository.findById.mockResolvedValue(null);

    await expect(service.getLogById('missing')).rejects.toThrow(NotFoundException);
  });
});
