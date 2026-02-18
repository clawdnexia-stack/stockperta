import bcrypt from 'bcryptjs';
import { Prisma, UserRole } from '@prisma/client';
import { Response } from 'express';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  unauthorized,
} from '../lib/http-errors.js';
import { prisma } from '../lib/prisma.js';
import { readIdParam } from '../lib/request.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { mapUser, userPublicSelect } from './users.mapper.js';
import {
  createUserSchema,
  listUsersQuerySchema,
  resetPasswordSchema,
  toggleTeamLeadSchema,
  updateMyPasswordSchema,
  updateUserSchema,
} from './users.schemas.js';

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function countOtherActiveAdmins(userId: string) {
  return prisma.user.count({
    where: {
      role: UserRole.ADMIN,
      active: true,
      id: { not: userId },
    },
  });
}

export async function listUsers(req: AuthenticatedRequest, res: Response) {
  const parsed = listUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return badRequest(res, 'Query invalide', parsed.error.flatten());
  }

  const { status, search } = parsed.data;

  const users = await prisma.user.findMany({
    where: {
      ...(status === 'active' ? { active: true } : {}),
      ...(status === 'inactive' ? { active: false } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search.toLowerCase(), mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    select: userPublicSelect,
  });

  return res.json(users.map(mapUser));
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return badRequest(res, 'Payload invalide', parsed.error.flatten());
  }

  const { fullName, email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        role: UserRole.USER,
        active: true,
        isOwner: false,
        isTeamLead: false,
      },
      select: userPublicSelect,
    });

    return res.status(201).json(mapUser(user));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return conflict(res, 'Cet email est déjà utilisé');
    }

    throw error;
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response) {
  const userId = readIdParam(req.params.id);
  const parsed = updateUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return badRequest(res, 'Payload invalide', parsed.error.flatten());
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      active: true,
      isOwner: true,
    },
  });

  if (!target) {
    return notFound(res, 'Utilisateur introuvable');
  }

  const data = parsed.data;

  if (target.isOwner && data.email !== undefined) {
    return forbidden(res, 'L’email du compte propriétaire est verrouillé');
  }

  if (data.active === false) {
    if (target.isOwner) {
      return forbidden(res, 'Le compte propriétaire ne peut pas être désactivé');
    }

    if (target.role === UserRole.ADMIN && target.active) {
      const otherAdminsCount = await countOtherActiveAdmins(target.id);
      if (otherAdminsCount === 0) {
        return conflict(res, 'Impossible de désactiver le dernier admin actif');
      }
    }
  }

  const shouldInvalidateTokens = data.active === false && target.active;

  const updatePayload: Prisma.UserUpdateInput = {
    ...(data.fullName !== undefined ? { fullName: data.fullName.trim() } : {}),
    ...(data.email !== undefined ? { email: data.email.trim().toLowerCase() } : {}),
    ...(data.active !== undefined ? { active: data.active } : {}),
    ...(shouldInvalidateTokens ? { tokenVersion: { increment: 1 } } : {}),
  };

  try {
    const user = await prisma.user.update({
      where: { id: target.id },
      data: updatePayload,
      select: userPublicSelect,
    });

    return res.json(mapUser(user));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return conflict(res, 'Cet email est déjà utilisé');
    }

    throw error;
  }
}

export async function toggleUserTeamLead(req: AuthenticatedRequest, res: Response) {
  const userId = readIdParam(req.params.id);
  const parsed = toggleTeamLeadSchema.safeParse(req.body);

  if (!parsed.success) {
    return badRequest(res, 'Payload invalide', parsed.error.flatten());
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      active: true,
      isTeamLead: true,
    },
  });

  if (!target) {
    return notFound(res, 'Utilisateur introuvable');
  }

  if (target.role !== UserRole.USER) {
    return conflict(res, 'Le statut chef d’équipe s’applique uniquement aux utilisateurs USER');
  }

  if (!target.active && parsed.data.isTeamLead) {
    return conflict(res, 'Impossible de nommer chef d’équipe un compte désactivé');
  }

  const user = await prisma.user.update({
    where: { id: target.id },
    data: { isTeamLead: parsed.data.isTeamLead },
    select: userPublicSelect,
  });

  return res.json(mapUser(user));
}

export async function resetUserPassword(req: AuthenticatedRequest, res: Response) {
  const userId = readIdParam(req.params.id);
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return badRequest(res, 'Payload invalide', parsed.error.flatten());
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!target) {
    return notFound(res, 'Utilisateur introuvable');
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.update({
    where: { id: target.id },
    data: {
      passwordHash,
      tokenVersion: { increment: 1 },
    },
  });

  return res.json({ message: 'Mot de passe réinitialisé avec succès' });
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.id) {
    return unauthorized(res, 'Non autorisé');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: userPublicSelect,
  });

  if (!user || !user.active) {
    return unauthorized(res, 'Compte inactif ou introuvable');
  }

  return res.json(mapUser(user));
}

export async function updateMyPassword(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.id) {
    return unauthorized(res, 'Non autorisé');
  }

  const parsed = updateMyPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return badRequest(res, 'Payload invalide', parsed.error.flatten());
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      passwordHash,
      tokenVersion: { increment: 1 },
    },
  });

  return res.json({ message: 'Mot de passe mis à jour. Veuillez vous reconnecter.' });
}
