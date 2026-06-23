import { Injectable } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface CreateUserData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: UserRole;
  isSystemGenerated?: boolean;
  createdBy?: string;
}

export interface UpdateUserData {
  username?: string;
  password?: string;
  fullName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  updatedBy?: string;
}

export interface FindUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy: 'username' | 'fullName' | 'email' | 'role' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUsername(username: string, excludeId?: string) {
    return this.prisma.user.findFirst({
      where: {
        username,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  findByEmail(email: string, excludeId?: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  countSystemGenerated() {
    return this.prisma.user.count({
      where: { isSystemGenerated: true, deletedAt: null },
    });
  }

  create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        username: data.username,
        password: data.password,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        isSystemGenerated: data.isSystemGenerated ?? false,
        createdBy: data.createdBy,
      },
    });
  }

  createMany(data: CreateUserData[]) {
    return this.prisma.user.createMany({
      data: data.map((item) => ({
        ...item,
        isSystemGenerated: item.isSystemGenerated ?? true,
      })),
      skipDuplicates: true,
    });
  }

  update(id: string, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  softDelete(id: string, updatedBy?: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedBy,
      },
    });
  }

  deleteSystemGenerated() {
    return this.prisma.user.deleteMany({
      where: { isSystemGenerated: true },
    });
  }

  findSystemGenerated(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { isSystemGenerated: true, deletedAt: null },
    });
  }

  async findManyPaginated(params: FindUsersParams) {
    const { page, limit, search, role, isActive, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role ? { role } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.UserOrderByWithRelationInput =
      sortBy === 'fullName'
        ? { fullName: sortOrder }
        : sortBy === 'createdAt'
          ? { createdAt: sortOrder }
          : { [sortBy]: sortOrder };

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return { total, users };
  }

  async getActiveUserCounts() {
    const [total, traders, admins] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.user.count({
        where: { deletedAt: null, isActive: true, role: UserRole.TRADER },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, isActive: true, role: UserRole.ADMIN },
      }),
    ]);

    return { total, traders, admins };
  }
}
