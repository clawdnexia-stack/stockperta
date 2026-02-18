import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const createMovementSchema = z.object({
  materialId: z.string().min(1),
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().int().positive(),
  note: z.string().optional(),
});

export async function listMovements(_req: AuthenticatedRequest, res: Response) {
  const movements = await prisma.movement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      material: true,
      user: true,
    },
  });

  res.json(movements);
}

export async function createMovement(req: AuthenticatedRequest, res: Response) {
  const parsed = createMovementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Payload invalide', errors: parsed.error.flatten() });
  }

  if (!req.user?.id) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  const { materialId, type, quantity, note } = parsed.data;

  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) {
    return res.status(404).json({ message: 'Matière introuvable' });
  }

  if (type === 'OUT' && material.quantity < quantity) {
    return res.status(400).json({ message: 'Stock insuffisant pour cette sortie' });
  }

  const nextQuantity = type === 'IN' ? material.quantity + quantity : material.quantity - quantity;

  const [movement] = await prisma.$transaction([
    prisma.movement.create({
      data: {
        materialId,
        type,
        quantity,
        note,
        userId: req.user.id,
      },
      include: {
        material: true,
        user: true,
      },
    }),
    prisma.material.update({
      where: { id: materialId },
      data: { quantity: nextQuantity },
    }),
  ]);

  return res.status(201).json(movement);
}
