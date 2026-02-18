import { WorkTaskStatus } from '@prisma/client';
import type { WorkTaskWithArchivedEquipment, WorkTaskWithRelations } from './work.service.js';

export function normalizeDateValue(value?: string | null) {
  if (!value) return null;

  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T00:00:00.000Z`);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function isOverdue(date: Date | null | undefined, status?: WorkTaskStatus, archivedAt?: Date | null) {
  if (!date || archivedAt) return false;
  if (status === WorkTaskStatus.DONE) return false;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const due = new Date(date);
  due.setUTCHours(0, 0, 0, 0);

  return due.getTime() < today.getTime();
}

export function mapTask(task: WorkTaskWithRelations | WorkTaskWithArchivedEquipment) {
  return {
    id: task.id,
    equipmentId: task.equipmentId,
    title: task.title,
    status: task.status,
    dueDate: task.dueDate,
    estimatedDays: task.estimatedDays ? Number(task.estimatedDays) : null,
    priority: task.priority,
    notes: task.notes,
    archivedAt: task.archivedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    createdById: task.createdById,
    updatedById: task.updatedById,
    isOverdue: isOverdue(task.dueDate, task.status, task.archivedAt),
    equipment: task.equipment,
    assignees: task.assignees.map(({ user }) => ({
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      isTeamLead: user.isTeamLead,
      active: user.active,
    })),
  };
}
