import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  tokenId: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
  jti: string;
}
