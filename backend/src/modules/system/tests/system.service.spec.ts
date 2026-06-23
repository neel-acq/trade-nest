import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LogType } from '@prisma/client';
import { SystemLogRepository } from '../repositories/system-log.repository';
import { SystemService } from '../services/system.service';

describe('SystemService', () => {
  let service: SystemService;
  let systemLogRepository: jest.Mocked<
    Pick<SystemLogRepository, 'create' | 'findManyPaginated' | 'findById'>
  >;

  const mockLog = {
    id: 'log-1',
    message: 'Trade executed: TRD-001',
    context: 'trade.execution',
    metadata: { tradeId: 'TRD-001' },
    logType: LogType.SUCCESS,
    isSystemGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(async () => {
    systemLogRepository = {
      create: jest.fn().mockResolvedValue(mockLog),
      findManyPaginated: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemService,
        { provide: SystemLogRepository, useValue: systemLogRepository },
      ],
    }).compile();

    service = module.get(SystemService);
  });

  it('records info system logs', async () => {
    await service.info('Test message', 'test.context');

    expect(systemLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test message',
        context: 'test.context',
        logType: LogType.INFO,
      }),
    );
  });

  it('lists system logs', async () => {
    systemLogRepository.findManyPaginated.mockResolvedValue({ total: 1, logs: [mockLog] });

    const result = await service.listLogs({ logType: LogType.SUCCESS });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].message).toContain('Trade executed');
  });

  it('throws when system log not found', async () => {
    systemLogRepository.findById.mockResolvedValue(null);

    await expect(service.getLogById('missing')).rejects.toThrow(NotFoundException);
  });
});
