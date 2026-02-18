import { WorkTaskPriority, WorkTaskStatus } from '@prisma/client';
import { z } from 'zod';

export const listEquipmentsQuerySchema = z.object({
  archived: z.enum(['true', 'false']).optional().default('false'),
});

export const listTasksQuerySchema = z.object({
  archived: z.enum(['true', 'false']).optional().default('false'),
});

export const equipmentPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  deliveryDate: z.string().min(10),
});

export const equipmentUpdatePayloadSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    deliveryDate: z.string().min(10).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Aucune donnée à mettre à jour',
  });

export const archivePayloadSchema = z.object({
  archived: z.boolean().optional().default(true),
});

export const taskPayloadSchema = z.object({
  title: z.string().trim().min(2).max(160),
  status: z.nativeEnum(WorkTaskStatus).optional().default(WorkTaskStatus.TODO),
  dueDate: z.string().min(10).optional().nullable(),
  estimatedDays: z.number().min(0).max(365).optional().nullable(),
  priority: z.nativeEnum(WorkTaskPriority).optional().default(WorkTaskPriority.MEDIUM),
  notes: z.string().trim().max(1500).optional().nullable(),
  assigneeIds: z.array(z.string().min(1)).max(20).optional().default([]),
});

export const updateTaskPayloadSchema = z
  .object({
    title: z.string().trim().min(2).max(160).optional(),
    status: z.nativeEnum(WorkTaskStatus).optional(),
    dueDate: z.string().min(10).optional().nullable(),
    estimatedDays: z.number().min(0).max(365).optional().nullable(),
    priority: z.nativeEnum(WorkTaskPriority).optional(),
    notes: z.string().trim().max(1500).optional().nullable(),
    assigneeIds: z.array(z.string().min(1)).max(20).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Aucune donnée à mettre à jour',
  });

export const taskStatusPayloadSchema = z.object({
  status: z.nativeEnum(WorkTaskStatus),
});
