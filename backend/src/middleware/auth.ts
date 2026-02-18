import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

interface JwtPayload {
  id: string;
  role: 'ADMIN' | 'USER';
  tokenVersion: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'ADMIN' | 'USER';
    tokenVersion: number;
    isOwner: boolean;
    isTeamLead: boolean;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        role: true,
        active: true,
        tokenVersion: true,
        isOwner: true,
        isTeamLead: true,
      },
    });

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Compte inactif ou introuvable' });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ message: 'Session expirée, reconnectez-vous' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
      isOwner: user.isOwner,
      isTeamLead: user.isTeamLead,
    };

    return next();
  } catch {
    return res.status(401).json({ message: 'Token invalide' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }

  return next();
}

export function requireWorkManager(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  if (req.user.role === 'ADMIN' || req.user.isTeamLead) {
    return next();
  }

  return res.status(403).json({ message: 'Accès réservé aux admins et chefs d’équipe' });
}
