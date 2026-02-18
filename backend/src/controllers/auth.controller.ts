import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { badRequest, forbidden, unauthorized } from '../lib/http-errors.js';
import { prisma } from '../lib/prisma.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return badRequest(res, 'Payload invalide', parsed.error.flatten());
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    return unauthorized(res, 'Identifiants invalides');
  }

  if (!user.active) {
    return forbidden(res, 'Compte désactivé. Contactez un administrateur.');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return unauthorized(res, 'Identifiants invalides');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, tokenVersion: user.tokenVersion },
    env.JWT_SECRET,
    { expiresIn: '30d' },
  );

  return res.json({
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      active: user.active,
      isOwner: user.isOwner,
      isTeamLead: user.isTeamLead,
    },
  });
}
