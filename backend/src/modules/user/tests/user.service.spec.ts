import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { DomainEventBus } from '@/common/events/domain-event-bus.service';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserUpdatedEvent } from '../events/user-updated.event';
import { UserRepository } from '../repositories/user.repository';
import { UserService } from '../services/user.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<
    Pick<
      UserRepository,
      | 'findByUsername'
      | 'findByEmail'
      | 'findById'
      | 'create'
      | 'update'
      | 'softDelete'
      | 'findManyPaginated'
      | 'countSystemGenerated'
    >
  >;
  let eventBus: jest.Mocked<Pick<DomainEventBus, 'publish'>>;

  const mockUser = {
    id: 'user-1',
    username: 'trader_99',
    password: 'hashed',
    fullName: 'Trader 99',
    email: 'trader99@test.local',
    role: UserRole.TRADER,
    isActive: true,
    isSystemGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(async () => {
    userRepository = {
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findManyPaginated: jest.fn(),
      countSystemGenerated: jest.fn(),
    };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: userRepository },
        { provide: DomainEventBus, useValue: eventBus },
      ],
    }).compile();

    service = module.get(UserService);
  });

  describe('createUser', () => {
    it('throws when username already exists', async () => {
      userRepository.findByUsername.mockResolvedValue(mockUser);
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.createUser({
          username: 'trader_99',
          password: 'TradeNest@123',
          fullName: 'Trader 99',
          email: 'new@test.local',
          role: UserRole.TRADER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates user and publishes UserCreated event', async () => {
      userRepository.findByUsername.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);

      const result = await service.createUser({
        username: 'trader_99',
        password: 'TradeNest@123',
        fullName: 'Trader 99',
        email: 'trader99@test.local',
        role: UserRole.TRADER,
      });

      expect(result.username).toBe('trader_99');
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(UserCreatedEvent));
    });
  });

  describe('updateProfile', () => {
    it('throws when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateProfile('missing', { fullName: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates profile and publishes UserUpdated event', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({ ...mockUser, fullName: 'Updated Name' });

      const result = await service.updateProfile('user-1', { fullName: 'Updated Name' });

      expect(result.fullName).toBe('Updated Name');
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(UserUpdatedEvent));
    });
  });

  describe('listUsers', () => {
    it('returns paginated users', async () => {
      userRepository.findManyPaginated.mockResolvedValue({
        total: 1,
        users: [mockUser],
      });

      const result = await service.listUsers({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0]).not.toHaveProperty('password');
    });
  });
});
