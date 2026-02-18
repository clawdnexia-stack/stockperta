import { Prisma, WorkTaskStatus } from '@prisma/client';
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
import {
  archivePayloadSchema,
  equipmentPayloadSchema,
  equipmentUpdatePayloadSchema,
  listEquipmentsQuerySchema,
  listTasksQuerySchema,
  taskPayloadSchema,
  taskStatusPayloadSchema,
  updateTaskPayloadSchema,
} from './work.schemas.js';
import { dateOnly, isOverdue, mapTask, normalizeDateValue } from './work.mapper.js';
import {
  appendHistoryEntries,
  ensureAssigneesExist,
  type TaskHistoryEntry,
  workTaskInclude,
  workTaskIncludeWithArchivedEquipment,
} from './work.service.js';

function isWorkManager(user?: AuthenticatedRequest['user']) {
  return !!user && (user.role === 'ADMIN' || user.isTeamLead);
}

export async function listWorkAgents(_req: AuthenticatedRequest, res: Response) {
  const agents = await prisma.user.findMany({
    where: { active: true },
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    select: {
      id: true,
      fullName: true,
      role: true,
      isTeamLead: true,
      active: true,
    },
  });

  return res.json(agents);
}

export async function listWorkEquipments(req: AuthenticatedRequest, res: Response) {
  const parsed = listEquipmentsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return badRequest(res, 'Query invalide', parsed.error.flatten());
  }

  const includeArchived = parsed.data.archived === 'true';

  const equipments = await prisma.workEquipment.findMany({
    where: includeArchived ? { archivedAt: { not: null } } : { archivedAt: null },
    include: {
      tasks: {
        where: { archivedAt: null },
        select: {
          id: true,
          status: true,
          dueDate: true,
          archivedAt: true,
        },
      },
    },
    orderBy: [{ deliveryDate: 'asc' }, { createdAt: 'desc' }],
  });

  const mapped = equipments.map((equipment) => {
    const summary = {
      total: equipment.tasks.length,
      todo: 0,
      inProgress: 0,
      control: 0,
      done: 0,
      overdue: 0,
    };

    for (const task of equipment.tasks) {
      if (task.status === WorkTaskStatus.TODO) summary.todo += 1;
      if (task.status === WorkTaskStatus.IN_PROGRESS) summary.inProgress += 1;
      if (task.status === WorkTaskStatus.CONTROL) summary.control += 1;
      if (task.status === WorkTaskStatus.DONE) summary.done += 1;
      if (isOverdue(task.dueDate, task.status, task.archivedAt)) summary.overdue += 1;
    }

    return {
      id: equipment.id,
      name: equipment.name,
      deliveryDate: equipment.deliveryDate,
      archivedAt: equipment.archivedAt,
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
      isOverdue: isOverdue(equipment.deliveryDate, undefined, equipment.archivedAt),
      taskSummary: summary,
    };
  });

  if (!includeArchived) {
    mapped.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
    });
  }

  return res.json(mapped);
}

export async function createWorkEquipment(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.id) {
    return unauthorized(res, 'Non autorisé');
  }

  const parsed = equipmentPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return badRequest(res, 'Payload invalide', parsed.error.flatten());
  }

  const deliveryDate = normalizeDateValue(parsed.data.deliveryDate);
  if (!deliveryDate) {
    return badRequest(res, 'Date de livraison invalide');
  }

  const equipment = await prisma.workEquipment.create({
    data: {
      name: parsed.data.name.trim(),
      deliveryDate,
      createdById: req.user.id,
    },
  });

  return res.status(201).json(equipment);
}

export async function updateWorkEquipment(req: AuthenticatedRequest, res: Response) {
  const equipmentId = readIdParam(req.params.id);
  const parsed = equipmentUpdatePayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return badRequest(res, 'Payload invalide', parsed.error.flatten());
  }

  const target = await prisma.workEquipment.findUnique({
    where: { id: equipmentId },
    select: { id: true },
  });

  if (!target) {
    return notFound(res, 'Équipement introuvable');
  }

  const updatePayload: Prisma.WorkEquipmentUpdateInput = {
    ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
  };

  if (parsed.data.deliveryDate !== undefined) {
    const parsedDate = normalizeDateValue(parsed.data.deliveryDate);
    if (!parsedDate) {
      return badRequest(res, 'Date de livraison invalide');
    }
    updatePayload.deliveryDate = parsedDate;
  }

  const equipment = await prisma.workEquipment.update({
    where: { id: target.id },
    data: updatePayload,
  });

  return res.json(equipment);
}

export async function archiveWorkEquipment(req: AuthenticatedRequest, res: Response) {
  const equipmentId = readIdParam(req.params.id);
  const parsed = archivePayloadSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    return badRequest(res, 'Payload invalide', parsed.error.flatten());
  }

  const target = await prisma.workEquipment.findUnique({
    where: { id: equipmentId },
    select: { id: true },
  });

  if (!target) {
    return notFound(res, 'Équipement introuvable');
  }

  const equipment = await prisma.workEquipment.update({
    where: { id: target.id },
    data: {
      archivedAt: parsed.data.archived ? new Date() : null,
    },
  });

  return res.json(equipment);
}

export async function listWorkTasks(req: AuthenticatedRequest, res: Response) {
  const equipmentId = readIdParam(req.params.id);

  const parsed = listTasksQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return badRequest(res, 'Query invalide', parsed.error.flatten());
  }

  const includeArchived = parsed.data.archived === 'true';

  const equipment = await prisma.workEquipment.findUnique({
    where: { id: equipmentId },
    select: { id: true, archivedAt: true },
  });

  if (!equipment) {
    return notFound(res, 'Équipement introuvable');
  }

  if (!includeArchived && equipment.archivedAt) {
    return res.json([]);
  }

  const tasks = await prisma.workTask.findMany({
    where: {
      equipmentId,
      ...(includeArchived ? { archivedAt: { not: null } } : { archivedAt: null }),
    },
    include: workTaskInclude,
    orderBy: [{ createdAt: 'asc' }],
  });

  return res.json(tasks.map((task) => mapTask(task)));
}

export async function createWorkTask(req: AuthenticatedRequest, res: Response) {
  const equipmentId = readIdParam(req.params.id);
  if (!req.user?.id) {
    return unauthorized(res, 'Non autorisé');
  }

  const parsed = taskPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return badRequest(res, 'Payload invalide', parsed.error.flatten());
  }

  const equipment = await prisma.workEquipment.findUnique({
    where: { id: equipmentId },
    select: { id: true, archivedAt: true },
  });

  if (!equipment) {
    return notFound(res, 'Équipement introuvable');
  }

  if (equipment.archivedAt) {
    return conflict(res, 'Impossible d’ajouter une tâche sur un équipement archivé');
  }

  const dueDate = normalizeDateValue(parsed.data.dueDate ?? null);
  if (parsed.data.dueDate !== undefined && parsed.data.dueDate !== null && !dueDate) {
    return badRequest(res, 'Date prévue invalide');
  }

  let assigneeIds: string[] = [];
  try {
    assigneeIds = await ensureAssigneesExist(parsed.data.assigneeIds ?? []);
  } catch (error) {
    return badRequest(res, error instanceof Error ? error.message : 'Agents invalides');
  }

  const task = await prisma.workTask.create({
    data: {
      equipmentId,
      title: parsed.data.title.trim(),
      status: parsed.data.status,
      dueDate,
      estimatedDays: parsed.data.estimatedDays ?? null,
      priority: parsed.data.priority,
      notes: parsed.data.notes?.trim() || null,
      createdById: req.user.id,
      updatedById: req.user.id,
      assignees: {
        create: assigneeIds.map((userId) => ({ userId })),
      },
    },
    include: workTaskInclude,
  });

  await appendHistoryEntries(task.id, req.user.id, [{
    actionType: 'CREATE',
    toValue: JSON.stringify({
      title: task.title,
      status: task.status,
      dueDate: task.dueDate ? dateOnly(task.dueDate) : null,
      estimatedDays: task.estimatedDays ? Number(task.estimatedDays) : null,
      priority: task.priority,
      assigneeIds,
    }),
  }]);

  return res.status(201).json(mapTask(task));
}

export async function updateWorkTask(req: AuthenticatedRequest, res: Response) {
  const taskId = readIdParam(req.params.id);
  if (!req.user?.id) {
    return unauthorized(res, 'Non autorisé');
  }

  const parsed = updateTaskPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return badRequest(res, 'Payload invalide', parsed.error.flatten());
  }

  const currentTask = await prisma.workTask.findUnique({
    where: { id: taskId },
    include: {
      assignees: {
        select: { userId: true },
      },
    },
  });

  if (!currentTask) {
    return notFound(res, 'Tâche introuvable');
  }

  if (currentTask.archivedAt) {
    return conflict(res, 'La tâche est archivée. Désarchivez-la avant modification.');
  }

  const payload = parsed.data;
  const dueDate = payload.dueDate !== undefined ? normalizeDateValue(payload.dueDate) : undefined;
  if (payload.dueDate !== undefined && payload.dueDate !== null && !dueDate) {
    return badRequest(res, 'Date prévue invalide');
  }

  let assigneeIds: string[] | undefined;
  if (payload.assigneeIds !== undefined) {
    try {
      assigneeIds = await ensureAssigneesExist(payload.assigneeIds);
    } catch (error) {
      return badRequest(res, error instanceof Error ? error.message : 'Agents invalides');
    }
  }

  const historyEntries: TaskHistoryEntry[] = [];
  const updatePayload: Prisma.WorkTaskUpdateInput = {
    updatedBy: { connect: { id: req.user.id } },
  };

  if (payload.title !== undefined) {
    const next = payload.title.trim();
    if (next !== currentTask.title) {
      updatePayload.title = next;
      historyEntries.push({ actionType: 'UPDATE_FIELD', field: 'title', fromValue: currentTask.title, toValue: next });
    }
  }

  if (payload.status !== undefined && payload.status !== currentTask.status) {
    updatePayload.status = payload.status;
    historyEntries.push({ actionType: 'STATUS_CHANGED', field: 'status', fromValue: currentTask.status, toValue: payload.status });
  }

  if (payload.dueDate !== undefined) {
    const currentDue = currentTask.dueDate ? dateOnly(currentTask.dueDate) : null;
    const nextDue = dueDate ? dateOnly(dueDate) : null;

    if (currentDue !== nextDue) {
      updatePayload.dueDate = dueDate;
      historyEntries.push({ actionType: 'UPDATE_FIELD', field: 'dueDate', fromValue: currentDue, toValue: nextDue });
    }
  }

  if (payload.estimatedDays !== undefined) {
    const currentEstimated = currentTask.estimatedDays ? Number(currentTask.estimatedDays).toString() : null;
    const nextEstimated = payload.estimatedDays === null ? null : payload.estimatedDays.toString();

    if (currentEstimated !== nextEstimated) {
      updatePayload.estimatedDays = payload.estimatedDays;
      historyEntries.push({ actionType: 'UPDATE_FIELD', field: 'estimatedDays', fromValue: currentEstimated, toValue: nextEstimated });
    }
  }

  if (payload.priority !== undefined && payload.priority !== currentTask.priority) {
    updatePayload.priority = payload.priority;
    historyEntries.push({ actionType: 'UPDATE_FIELD', field: 'priority', fromValue: currentTask.priority, toValue: payload.priority });
  }

  if (payload.notes !== undefined) {
    const currentNotes = currentTask.notes ?? null;
    const nextNotes = payload.notes?.trim() || null;

    if (currentNotes !== nextNotes) {
      updatePayload.notes = nextNotes;
      historyEntries.push({ actionType: 'UPDATE_FIELD', field: 'notes', fromValue: currentNotes, toValue: nextNotes });
    }
  }

  if (assigneeIds !== undefined) {
    const currentAssignees = [...new Set(currentTask.assignees.map((entry) => entry.userId))].sort();
    const nextAssignees = [...assigneeIds].sort();

    if (JSON.stringify(currentAssignees) !== JSON.stringify(nextAssignees)) {
      historyEntries.push({
        actionType: 'UPDATE_FIELD',
        field: 'assignees',
        fromValue: JSON.stringify(currentAssignees),
        toValue: JSON.stringify(nextAssignees),
      });
    }
  }

  if (historyEntries.length === 0) {
    return badRequest(res, 'Aucune modification détectée');
  }

  const task = await prisma.$transaction(async (tx) => {
    await tx.workTask.update({
      where: { id: currentTask.id },
      data: updatePayload,
    });

    if (assigneeIds !== undefined) {
      await tx.workTaskAssignee.deleteMany({ where: { taskId: currentTask.id } });
      if (assigneeIds.length > 0) {
        await tx.workTaskAssignee.createMany({
          data: assigneeIds.map((userId) => ({ taskId: currentTask.id, userId })),
        });
      }
    }

    await tx.workTaskHistory.createMany({
      data: historyEntries.map((entry) => ({
        taskId: currentTask.id,
        actorId: req.user!.id,
        actionType: entry.actionType,
        field: entry.field,
        fromValue: entry.fromValue ?? null,
        toValue: entry.toValue ?? null,
      })),
    });

    return tx.workTask.findUniqueOrThrow({
      where: { id: currentTask.id },
      include: workTaskInclude,
    });
  });

  return res.json(mapTask(task));
}

export async function updateWorkTaskStatus(req: AuthenticatedRequest, res: Response) {
  const taskId = readIdParam(req.params.id);
  if (!req.user?.id) {
    return unauthorized(res, 'Non autorisé');
  }

  const parsed = taskStatusPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return badRequest(res, 'Payload invalide', parsed.error.flatten());
  }

  const task = await prisma.workTask.findUnique({
    where: { id: taskId },
    include: workTaskIncludeWithArchivedEquipment,
  });

  if (!task) {
    return notFound(res, 'Tâche introuvable');
  }

  if (task.archivedAt || task.equipment.archivedAt) {
    return conflict(res, 'Impossible de modifier le statut d’une tâche archivée');
  }

  const isAssigned = task.assignees.some((assignee) => assignee.userId === req.user!.id);
  if (!isWorkManager(req.user) && !isAssigned) {
    return forbidden(res, 'Vous pouvez modifier uniquement le statut de vos tâches assignées');
  }

  if (task.status === parsed.data.status) {
    return res.json(mapTask(task));
  }

  const updatedTask = await prisma.$transaction(async (tx) => {
    await tx.workTask.update({
      where: { id: task.id },
      data: {
        status: parsed.data.status,
        updatedBy: { connect: { id: req.user!.id } },
      },
    });

    await tx.workTaskHistory.create({
      data: {
        taskId: task.id,
        actorId: req.user!.id,
        actionType: 'STATUS_CHANGED',
        field: 'status',
        fromValue: task.status,
        toValue: parsed.data.status,
      },
    });

    return tx.workTask.findUniqueOrThrow({
      where: { id: task.id },
      include: workTaskInclude,
    });
  });

  return res.json(mapTask(updatedTask));
}

export async function archiveWorkTask(req: AuthenticatedRequest, res: Response) {
  const taskId = readIdParam(req.params.id);
  if (!req.user?.id) {
    return unauthorized(res, 'Non autorisé');
  }

  const parsed = archivePayloadSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return badRequest(res, 'Payload invalide', parsed.error.flatten());
  }

  const task = await prisma.workTask.findUnique({
    where: { id: taskId },
    include: workTaskInclude,
  });

  if (!task) {
    return notFound(res, 'Tâche introuvable');
  }

  const archivedAt = parsed.data.archived ? new Date() : null;

  const updatedTask = await prisma.$transaction(async (tx) => {
    await tx.workTask.update({
      where: { id: task.id },
      data: {
        archivedAt,
        updatedBy: { connect: { id: req.user!.id } },
      },
    });

    await tx.workTaskHistory.create({
      data: {
        taskId: task.id,
        actorId: req.user!.id,
        actionType: parsed.data.archived ? 'ARCHIVED' : 'UNARCHIVED',
      },
    });

    return tx.workTask.findUniqueOrThrow({
      where: { id: task.id },
      include: workTaskInclude,
    });
  });

  return res.json(mapTask(updatedTask));
}

export async function getAgentKanban(req: AuthenticatedRequest, res: Response) {
  const agentId = readIdParam(req.params.userId);

  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      fullName: true,
      role: true,
      isTeamLead: true,
      active: true,
    },
  });

  if (!agent) {
    return notFound(res, 'Agent introuvable');
  }

  if (!agent.active) {
    return conflict(res, 'Cet agent est désactivé');
  }

  const tasks = await prisma.workTask.findMany({
    where: {
      archivedAt: null,
      equipment: { archivedAt: null },
      assignees: {
        some: { userId: agentId },
      },
    },
    include: workTaskInclude,
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'asc' }],
  });

  return res.json({
    agent,
    tasks: tasks.map((task) => mapTask(task)),
  });
}

export async function getWorkTaskHistory(req: AuthenticatedRequest, res: Response) {
  if (!isWorkManager(req.user)) {
    return forbidden(res, 'Historique réservé aux admins et chefs d’équipe');
  }

  const taskId = readIdParam(req.params.id);

  const task = await prisma.workTask.findUnique({
    where: { id: taskId },
    select: { id: true },
  });

  if (!task) {
    return notFound(res, 'Tâche introuvable');
  }

  const history = await prisma.workTaskHistory.findMany({
    where: { taskId: task.id },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  return res.json(history.map((entry) => ({
    id: entry.id,
    actionType: entry.actionType,
    field: entry.field,
    fromValue: entry.fromValue,
    toValue: entry.toValue,
    createdAt: entry.createdAt,
    actor: entry.actor,
  })));
}
