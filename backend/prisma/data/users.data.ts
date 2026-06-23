import { UserRole } from '@prisma/client';

export const DEFAULT_SEED_PASSWORD = 'TradeNest@123';

export interface SeedUserInput {
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export const SEED_USERS: SeedUserInput[] = [
  {
    username: 'admin_01',
    fullName: 'Admin One',
    email: 'admin_01@tradenest.local',
    role: UserRole.ADMIN,
  },
  {
    username: 'admin_02',
    fullName: 'Admin Two',
    email: 'admin_02@tradenest.local',
    role: UserRole.ADMIN,
  },
  ...Array.from({ length: 60 }, (_, index) => {
    const num = String(index + 1).padStart(2, '0');
    return {
      username: `trader_${num}`,
      fullName: `Trader ${num}`,
      email: `trader_${num}@tradenest.local`,
      role: UserRole.TRADER,
    };
  }),
];
