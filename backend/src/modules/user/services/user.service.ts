import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { buildPaginationMeta, PaginatedResult } from '@/common/dto/pagination.dto';
import { DomainEventBus } from '@/common/events/domain-event-bus.service';
import { DEFAULT_SEED_PASSWORD, SEED_USERS } from '../../../../prisma/data/users.data';
import { CreateUserDto } from '../dto/create-user.dto';
import { QueryUsersDto } from '../dto/query-users.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { SafeUser, toSafeUser } from '../entities/user.entity';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserUpdatedEvent } from '../events/user-updated.event';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: DomainEventBus,
  ) {}

  getStatus() {
    return { module: 'user', status: 'active', phase: 4 };
  }

  async validateCredentials(username: string, password: string) {
    const user = await this.userRepository.findByUsername(username);
    if (!user || !user.isActive) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    return toSafeUser(user);
  }

  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    return user ? toSafeUser(user) : null;
  }

  async listUsers(query: QueryUsersDto): Promise<PaginatedResult<SafeUser>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { total, users } = await this.userRepository.findManyPaginated({
      page,
      limit,
      search: query.search,
      role: query.role,
      isActive: query.isActive,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });

    return {
      data: users.map(toSafeUser),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async createUser(dto: CreateUserDto, createdBy?: string) {
    await this.ensureUniqueCredentials(dto.username, dto.email);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepository.create({
      username: dto.username,
      password: hashedPassword,
      fullName: dto.fullName,
      email: dto.email,
      role: dto.role,
      isSystemGenerated: false,
      createdBy,
    });

    this.eventBus.publish(
      new UserCreatedEvent({
        userId: user.id,
        username: user.username,
        role: user.role,
        isSystemGenerated: false,
      }),
    );

    return toSafeUser(user);
  }

  async updateUser(id: string, dto: UpdateUserDto, updatedBy?: string) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.userRepository.findByEmail(dto.email, id);
      if (emailTaken) {
        throw new ConflictException('Email is already in use');
      }
    }

    const updatedFields = Object.keys(dto).filter(
      (key) => dto[key as keyof UpdateUserDto] !== undefined,
    );

    const user = await this.userRepository.update(id, {
      ...dto,
      updatedBy,
    });

    this.eventBus.publish(
      new UserUpdatedEvent({
        userId: user.id,
        username: user.username,
        updatedFields,
      }),
    );

    return toSafeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.userRepository.findById(userId);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (dto.username && dto.username !== existing.username) {
      const usernameTaken = await this.userRepository.findByUsername(dto.username, userId);
      if (usernameTaken) {
        throw new ConflictException('Username is already in use');
      }
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.userRepository.findByEmail(dto.email, userId);
      if (emailTaken) {
        throw new ConflictException('Email is already in use');
      }
    }

    const updateData: Parameters<UserRepository['update']>[1] = {
      updatedBy: userId,
    };
    const updatedFields: string[] = [];

    if (dto.username) {
      updateData.username = dto.username;
      updatedFields.push('username');
    }
    if (dto.fullName) {
      updateData.fullName = dto.fullName;
      updatedFields.push('fullName');
    }
    if (dto.email) {
      updateData.email = dto.email;
      updatedFields.push('email');
    }
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
      updatedFields.push('password');
    }

    if (updatedFields.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const user = await this.userRepository.update(userId, updateData);

    this.eventBus.publish(
      new UserUpdatedEvent({
        userId: user.id,
        username: user.username,
        updatedFields,
      }),
    );

    return toSafeUser(user);
  }

  async deleteUser(id: string, deletedBy?: string) {
    if (deletedBy && id === deletedBy) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.softDelete(id, deletedBy);

    this.eventBus.publish(
      new UserUpdatedEvent({
        userId: id,
        username: existing.username,
        updatedFields: ['deletedAt', 'isActive'],
      }),
    );

    return { message: 'User deleted successfully', id };
  }

  async seedSystemUsers() {
    const existing = await this.userRepository.countSystemGenerated();
    if (existing > 0) {
      return { created: 0, skipped: existing, message: 'System users already seeded' };
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_SEED_PASSWORD, 10);
    let created = 0;

    for (const user of SEED_USERS) {
      const record = await this.userRepository.create({
        ...user,
        password: hashedPassword,
        isSystemGenerated: true,
      });
      created += 1;
      this.eventBus.publish(
        new UserCreatedEvent({
          userId: record.id,
          username: record.username,
          role: record.role,
          isSystemGenerated: record.isSystemGenerated,
        }),
      );
    }

    return {
      created,
      skipped: 0,
      defaultPassword: DEFAULT_SEED_PASSWORD,
    };
  }

  async deleteSystemUsers() {
    const deleted = await this.userRepository.deleteSystemGenerated();
    return { deleted: deleted.count };
  }

  async findSystemUsers() {
    const users = await this.userRepository.findSystemGenerated();
    return users.map(toSafeUser);
  }

  async findTraderByUsername(username: string) {
    const user = await this.userRepository.findByUsername(username);
    if (!user || user.role !== UserRole.TRADER) {
      return null;
    }
    return toSafeUser(user);
  }

  private async ensureUniqueCredentials(username: string, email: string) {
    const [existingUsername, existingEmail] = await Promise.all([
      this.userRepository.findByUsername(username),
      this.userRepository.findByEmail(email),
    ]);

    if (existingUsername) {
      throw new ConflictException('Username is already in use');
    }
    if (existingEmail) {
      throw new ConflictException('Email is already in use');
    }
  }

  async getPlatformUserStats() {
    return this.userRepository.getActiveUserCounts();
  }
}
