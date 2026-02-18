import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export async function getDashboard(req: Request, res: Response) {
  const [materials, recentMovements] = await Promise.all([
    prisma.material.findMany({ where: { active: true } }),
    prisma.movement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        material: true,
        user: true,
      },
    }),
  ]);

  const stats = materials.reduce(
    (acc, m) => {
      acc.total += 1;
      if (m.quantity === 0) acc.critical += 1;
      else if (m.quantity <= m.alertThreshold) acc.low += 1;
      else acc.ok += 1;
      return acc;
    },
    { total: 0, ok: 0, low: 0, critical: 0 }
  );

  const alerts = materials.filter((m) => m.quantity <= m.alertThreshold);

  res.json({ stats, alerts, recentMovements });
}
