import { User, UserRole } from '@prisma/client';

export type SafeUser = Omit<User, 'password'>;

export function toSafeUser(user: User): SafeUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}
