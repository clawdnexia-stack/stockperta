import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';
import { getDashboard } from '../controllers/dashboard.controller.js';
import { createMaterial, listMaterials } from '../controllers/materials.controller.js';
import { createMovement, listMovements } from '../controllers/movements.controller.js';
import {
  createUser,
  getMe,
  listUsers,
  resetUserPassword,
  toggleUserTeamLead,
  updateMyPassword,
  updateUser,
} from '../controllers/users.controller.js';
import {
  archiveWorkEquipment,
  archiveWorkTask,
  createWorkEquipment,
  createWorkTask,
  getAgentKanban,
  getWorkTaskHistory,
  listWorkAgents,
  listWorkEquipments,
  listWorkTasks,
  updateWorkEquipment,
  updateWorkTask,
  updateWorkTaskStatus,
} from '../controllers/work.controller.js';
import { requireAdmin, requireAuth, requireWorkManager } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'stockatelier-backend' });
});

apiRouter.post('/auth/login', asyncHandler(login));

apiRouter.get('/dashboard', requireAuth, asyncHandler(getDashboard));
apiRouter.get('/materials', requireAuth, asyncHandler(listMaterials));
apiRouter.post('/materials', requireAuth, asyncHandler(createMaterial));
apiRouter.get('/movements', requireAuth, asyncHandler(listMovements));
apiRouter.post('/movements', requireAuth, asyncHandler(createMovement));

apiRouter.get('/me', requireAuth, asyncHandler(getMe));
apiRouter.patch('/me/password', requireAuth, asyncHandler(updateMyPassword));

apiRouter.get('/users', requireAuth, requireAdmin, asyncHandler(listUsers));
apiRouter.post('/users', requireAuth, requireAdmin, asyncHandler(createUser));
apiRouter.patch('/users/:id', requireAuth, requireAdmin, asyncHandler(updateUser));
apiRouter.patch('/users/:id/password', requireAuth, requireAdmin, asyncHandler(resetUserPassword));
apiRouter.patch('/users/:id/team-lead', requireAuth, requireAdmin, asyncHandler(toggleUserTeamLead));

apiRouter.get('/work/agents', requireAuth, asyncHandler(listWorkAgents));
apiRouter.get('/work/equipments', requireAuth, asyncHandler(listWorkEquipments));
apiRouter.post('/work/equipments', requireAuth, requireWorkManager, asyncHandler(createWorkEquipment));
apiRouter.patch('/work/equipments/:id', requireAuth, requireWorkManager, asyncHandler(updateWorkEquipment));
apiRouter.patch('/work/equipments/:id/archive', requireAuth, requireWorkManager, asyncHandler(archiveWorkEquipment));

apiRouter.get('/work/equipments/:id/tasks', requireAuth, asyncHandler(listWorkTasks));
apiRouter.post('/work/equipments/:id/tasks', requireAuth, requireWorkManager, asyncHandler(createWorkTask));

apiRouter.patch('/work/tasks/:id', requireAuth, requireWorkManager, asyncHandler(updateWorkTask));
apiRouter.patch('/work/tasks/:id/status', requireAuth, asyncHandler(updateWorkTaskStatus));
apiRouter.patch('/work/tasks/:id/archive', requireAuth, requireWorkManager, asyncHandler(archiveWorkTask));
apiRouter.get('/work/tasks/:id/history', requireAuth, asyncHandler(getWorkTaskHistory));

apiRouter.get('/work/agents/:userId/kanban', requireAuth, asyncHandler(getAgentKanban));
