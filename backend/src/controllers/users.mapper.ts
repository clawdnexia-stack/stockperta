import { Prisma } from '@prisma/client';

export const userPublicSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  active: true,
  isOwner: true,
  isTeamLead: true,
  createdAt: true,
} as const satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof userPublicSelect }>;

export function mapUser(user: PublicUser) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    active: user.active,
    isOwner: user.isOwner,
    isTeamLead: user.isTeamLead,
    createdAt: user.createdAt,
  };
}
