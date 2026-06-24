import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DomainEventBus } from '@/common/events/domain-event-bus.service';
import { StockCreatedEvent } from '../events/stock-created.event';
import { StockUpdatedEvent } from '../events/stock-updated.event';
import { StockRepository } from '../repositories/stock.repository';
import { StockService } from '../services/stock.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('StockService', () => {
  let service: StockService;
  let stockRepository: jest.Mocked<
    Pick<
      StockRepository,
      | 'findManyPaginated'
      | 'findById'
      | 'findBySymbol'
      | 'create'
      | 'update'
      | 'softDelete'
      | 'countSystemGenerated'
    >
  >;
  let eventBus: jest.Mocked<Pick<DomainEventBus, 'publish'>>;

  const mockStock = {
    id: 'stock-1',
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries Ltd',
    currentPrice: 2450.5,
    currentVolume: BigInt(1250000),
    previousPrice: 2425.0,
    previousVolume: BigInt(1187500),
    changePrice: 25.5,
    changeVolume: BigInt(62500),
    changePercentage: 1.0515,
    volumePercentage: 5.2632,
    isSystemGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(async () => {
    stockRepository = {
      findManyPaginated: jest.fn(),
      findById: jest.fn(),
      findBySymbol: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      countSystemGenerated: jest.fn(),
    };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: StockRepository, useValue: stockRepository },
        { provide: DomainEventBus, useValue: eventBus },
      ],
    }).compile();

    service = module.get(StockService);
  });

  describe('listStocks', () => {
    it('returns paginated stocks with numeric volumes', async () => {
      stockRepository.findManyPaginated.mockResolvedValue({
        total: 1,
        stocks: [mockStock as any],
      });

      const result = await service.listStocks({ page: 1, limit: 10, search: 'REL' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].currentVolume).toBe(1250000);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('createStock', () => {
    it('throws when symbol already exists', async () => {
      stockRepository.findBySymbol.mockResolvedValue({
        ...mockStock,
        currentPrice: new Decimal(mockStock.currentPrice),
        previousPrice: new Decimal(mockStock.previousPrice),
        changePrice: new Decimal(mockStock.changePrice),
        changeVolume: BigInt(mockStock.changeVolume),
        currentVolume: BigInt(mockStock.currentVolume),
        previousVolume: BigInt(mockStock.previousVolume),
        volumePercentage: new Decimal(mockStock.volumePercentage),
        changePercentage: new Decimal(mockStock.changePercentage),
      });

      await expect(
        service.createStock({
          symbol: 'RELIANCE',
          companyName: 'Reliance',
          currentPrice: 2500,
          currentVolume: 1000,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates stock and publishes StockCreated event', async () => {
      stockRepository.findBySymbol.mockResolvedValue(null);
      stockRepository.create.mockResolvedValue({
        ...mockStock,
        currentPrice: new Decimal(mockStock.currentPrice),
        previousPrice: new Decimal(mockStock.previousPrice),
        changePrice: new Decimal(mockStock.changePrice),
        changeVolume: BigInt(mockStock.changeVolume),
        currentVolume: BigInt(mockStock.currentVolume),
        previousVolume: BigInt(mockStock.previousVolume),
        volumePercentage: new Decimal(mockStock.volumePercentage),
        changePercentage: new Decimal(mockStock.changePercentage),
      });

      const result = await service.createStock({
        symbol: 'reliance',
        companyName: 'Reliance Industries Ltd',
        currentPrice: 2450.5,
        currentVolume: 1250000,
      });

      expect(result.symbol).toBe('RELIANCE');
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(StockCreatedEvent));
    });
  });

  describe('updateStock', () => {
    it('throws when stock not found', async () => {
      stockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateStock('missing', { currentPrice: 2500 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates stock and publishes StockUpdated event', async () => {
      stockRepository.findById.mockResolvedValue({
        ...mockStock,
        currentPrice: new Decimal(mockStock.currentPrice),
        previousPrice: new Decimal(mockStock.previousPrice),
        changePrice: new Decimal(mockStock.changePrice),
        changeVolume: BigInt(mockStock.changeVolume),
        currentVolume: BigInt(mockStock.currentVolume),
        previousVolume: BigInt(mockStock.previousVolume),
        volumePercentage: new Decimal(mockStock.volumePercentage),
        changePercentage: new Decimal(mockStock.changePercentage),
      });
      stockRepository.update.mockResolvedValue({
        ...mockStock,
        currentPrice: new Decimal(2500),
        previousPrice: new Decimal(mockStock.previousPrice),
        changePrice: new Decimal(mockStock.changePrice),
        changeVolume: BigInt(mockStock.changeVolume),
        currentVolume: BigInt(mockStock.currentVolume),
        previousVolume: BigInt(mockStock.previousVolume),
        volumePercentage: new Decimal(mockStock.volumePercentage),
        changePercentage: new Decimal(mockStock.changePercentage),
      });

      await service.updateStock('stock-1', { currentPrice: 2500 });

      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(StockUpdatedEvent));
    });
  });

  describe('seedSystemStocks', () => {
    it('skips when system stocks already exist', async () => {
      stockRepository.countSystemGenerated.mockResolvedValue(55);

      const result = await service.seedSystemStocks();

      expect(result.skipped).toBe(55);
      expect(stockRepository.create).not.toHaveBeenCalled();
    });
  });
});
