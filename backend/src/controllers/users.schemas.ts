import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'all']).default('active'),
  search: z.string().trim().max(120).optional(),
});

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
});

export const updateUserSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().optional(),
    active: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Aucune donnée à mettre à jour',
  });

export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(100),
});

export const updateMyPasswordSchema = z.object({
  password: z.string().min(8).max(100),
});

export const toggleTeamLeadSchema = z.object({
  isTeamLead: z.boolean(),
});
