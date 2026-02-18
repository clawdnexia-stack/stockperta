import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const workTaskAssigneeUserSelect = {
  id: true,
  fullName: true,
  role: true,
  isTeamLead: true,
  active: true,
} as const;

export const workTaskAssigneesInclude = {
  assignees: {
    include: {
      user: {
        select: workTaskAssigneeUserSelect,
      },
    },
  },
} as const satisfies Prisma.WorkTaskInclude;

export const workTaskInclude = {
  ...workTaskAssigneesInclude,
  equipment: {
    select: {
      id: true,
      name: true,
      deliveryDate: true,
    },
  },
} as const satisfies Prisma.WorkTaskInclude;

export const workTaskIncludeWithArchivedEquipment = {
  ...workTaskAssigneesInclude,
  equipment: {
    select: {
      id: true,
      name: true,
      deliveryDate: true,
      archivedAt: true,
    },
  },
} as const satisfies Prisma.WorkTaskInclude;

export type WorkTaskWithRelations = Prisma.WorkTaskGetPayload<{ include: typeof workTaskInclude }>;
export type WorkTaskWithArchivedEquipment = Prisma.WorkTaskGetPayload<{ include: typeof workTaskIncludeWithArchivedEquipment }>;

export type TaskHistoryEntry = {
  actionType: string;
  field?: string;
  fromValue?: string | null;
  toValue?: string | null;
};

export async function ensureAssigneesExist(assigneeIds: string[]) {
  const uniqueAssigneeIds = [...new Set(assigneeIds)];
  if (uniqueAssigneeIds.length === 0) return [];

  const assignees = await prisma.user.findMany({
    where: {
      id: { in: uniqueAssigneeIds },
      active: true,
    },
    select: { id: true },
  });

  if (assignees.length !== uniqueAssigneeIds.length) {
    throw new Error('Certains agents assignés sont introuvables ou désactivés');
  }

  return uniqueAssigneeIds;
}

export async function appendHistoryEntries(taskId: string, actorId: string, entries: TaskHistoryEntry[]) {
  if (entries.length === 0) return;

  await prisma.workTaskHistory.createMany({
    data: entries.map((entry) => ({
      taskId,
      actorId,
      actionType: entry.actionType,
      field: entry.field,
      fromValue: entry.fromValue ?? null,
      toValue: entry.toValue ?? null,
    })),
  });
}
