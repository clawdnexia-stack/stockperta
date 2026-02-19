import type {
  DashboardStats,
  ManagedUser,
  Material,
  Movement,
  User,
  WorkAgent,
  WorkEquipment,
  WorkTask,
  WorkTaskHistoryItem,
  WorkTaskPriority,
  WorkTaskStatus,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'stockatelier_token';
const USER_KEY = 'stockatelier_user';

function getStorageValue(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

function getActiveAuthStorage(): Storage {
  if (localStorage.getItem(TOKEN_KEY) || localStorage.getItem(USER_KEY)) {
    return localStorage;
  }

  if (sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(USER_KEY)) {
    return sessionStorage;
  }

  return localStorage;
}

export type UserStatusFilter = 'active' | 'inactive' | 'all';

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: 'ADMIN' | 'USER';
    active: boolean;
    isOwner: boolean;
    isTeamLead: boolean;
  };
}

interface MaterialApiResponse {
  id: string;
  name: string;
  category: string;
  subType?: string | null;
  materialKind?: string | null;
  shapeType?: string | null;
  dimAmm?: number | null;
  dimBmm?: number | null;
  thicknessMm?: number | null;
  sheetWidthMm?: number | null;
  sheetHeightMm?: number | null;
  packageSize?: number | null;
  packageUnit?: string | null;
  specText?: string | null;
  unit: string;
  unitType?: string | null;
  unitVariant?: string | null;
  quantity: number;
  alertThreshold: number;
  active?: boolean;
}

interface DashboardResponse {
  stats: DashboardStats;
  alerts: MaterialApiResponse[];
  recentMovements: Array<{
    id: string;
    type: 'IN' | 'OUT';
    quantity: number;
    note?: string | null;
    createdAt: string;
    materialId: string;
    userId: string;
    material: { id: string; name: string; quantity: number };
    user: { id: string; fullName: string };
  }>;
}

interface ManagedUserApiResponse {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  active: boolean;
  isOwner: boolean;
  isTeamLead: boolean;
  createdAt: string;
}

interface WorkAgentApiResponse {
  id: string;
  fullName: string;
  role: 'ADMIN' | 'USER';
  active: boolean;
  isTeamLead: boolean;
}

interface WorkEquipmentApiResponse {
  id: string;
  name: string;
  deliveryDate: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  taskSummary: {
    total: number;
    todo: number;
    inProgress: number;
    control: number;
    done: number;
    overdue: number;
  };
}

interface WorkTaskApiResponse {
  id: string;
  equipmentId: string;
  title: string;
  status: WorkTaskStatus;
  dueDate: string | null;
  estimatedDays: number | null;
  priority: WorkTaskPriority;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  updatedById: string;
  isOverdue: boolean;
  equipment?: {
    id: string;
    name: string;
    deliveryDate: string;
  };
  assignees: Array<{
    id: string;
    fullName: string;
    role: 'ADMIN' | 'USER';
    active: boolean;
    isTeamLead: boolean;
  }>;
}

interface WorkTaskHistoryApiResponse {
  id: string;
  actionType: string;
  field?: string | null;
  fromValue?: string | null;
  toValue?: string | null;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
  };
}

export interface CreateMaterialInput {
  category: Material['category'];
  subType?: string;
  materialKind?: string;
  shapeType?: string;
  dimAmm?: number;
  dimBmm?: number;
  thicknessMm?: number;
  sheetWidthMm?: number;
  sheetHeightMm?: number;
  packageSize?: number;
  packageUnit?: string;
  specText?: string;
  unitType: 'BARRE' | 'FEUILLE' | 'PIECE' | 'PAQUET' | 'BOITE' | 'BIDON';
  unitVariant?: string;
  quantity: number;
  alertThreshold: number;
}

export interface UpdateMaterialInput extends Partial<CreateMaterialInput> {
  active?: boolean;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  active?: boolean;
}

export interface CreateWorkEquipmentInput {
  name: string;
  deliveryDate: string;
}

export interface UpdateWorkEquipmentInput {
  name?: string;
  deliveryDate?: string;
}

export interface CreateWorkTaskInput {
  title: string;
  status?: WorkTaskStatus;
  dueDate?: string | null;
  estimatedDays?: number | null;
  priority?: WorkTaskPriority;
  notes?: string | null;
  assigneeIds?: string[];
}

export interface UpdateWorkTaskInput {
  title?: string;
  status?: WorkTaskStatus;
  dueDate?: string | null;
  estimatedDays?: number | null;
  priority?: WorkTaskPriority;
  notes?: string | null;
  assigneeIds?: string[];
}

function roleToFrontend(role: 'ADMIN' | 'USER'): 'admin' | 'user' {
  return role === 'ADMIN' ? 'admin' : 'user';
}

function formatDimensions(raw: MaterialApiResponse): string {
  if (raw.category === 'Tôles' && raw.thicknessMm) {
    return `${raw.thicknessMm} mm`;
  }

  if (raw.category === 'Peinture & Diluants' && raw.packageSize && raw.packageUnit) {
    return `${raw.packageSize} ${raw.packageUnit}`;
  }

  if (raw.shapeType?.toLowerCase().includes('rond') && raw.dimAmm) {
    if (raw.thicknessMm) return `Ø${raw.dimAmm} x ${raw.thicknessMm} mm`;
    return `Ø${raw.dimAmm} mm`;
  }

  if (raw.dimAmm && raw.dimBmm && raw.thicknessMm) {
    return `${raw.dimAmm} x ${raw.dimBmm} x ${raw.thicknessMm} mm`;
  }

  if (raw.dimAmm && raw.thicknessMm) {
    return `${raw.dimAmm} x ${raw.thicknessMm} mm`;
  }

  if (raw.specText) return raw.specText;
  return '-';
}

function mapMaterial(raw: MaterialApiResponse): Material {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category as Material['category'],
    subType: raw.subType ?? undefined,
    materialKind: raw.materialKind ?? undefined,
    shapeType: raw.shapeType ?? undefined,
    type: raw.subType ?? raw.shapeType ?? raw.category,
    dimensions: formatDimensions(raw),
    dimAmm: raw.dimAmm ?? undefined,
    dimBmm: raw.dimBmm ?? undefined,
    thicknessMm: raw.thicknessMm ?? undefined,
    sheetWidthMm: raw.sheetWidthMm ?? undefined,
    sheetHeightMm: raw.sheetHeightMm ?? undefined,
    packageSize: raw.packageSize ?? undefined,
    packageUnit: raw.packageUnit ?? undefined,
    specText: raw.specText ?? undefined,
    unit: raw.unit,
    unitType: (raw.unitType as Material['unitType']) ?? undefined,
    unitVariant: raw.unitVariant ?? undefined,
    quantity: raw.quantity,
    alertThreshold: raw.alertThreshold,
    active: raw.active ?? true,
  };
}

function mapMovement(raw: {
  id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  note?: string | null;
  createdAt: string;
  materialId: string;
  userId: string;
  material: { id: string; name: string; quantity: number };
  user: { id: string; fullName: string };
}): Movement {
  return {
    id: raw.id,
    materialId: raw.materialId,
    materialName: raw.material.name,
    userId: raw.userId,
    userName: raw.user.fullName,
    type: raw.type,
    quantity: raw.quantity,
    stockAfter: raw.material.quantity,
    reason: raw.note ?? '-',
    createdAt: raw.createdAt,
  };
}

function mapManagedUser(raw: ManagedUserApiResponse): ManagedUser {
  return {
    id: raw.id,
    name: raw.fullName,
    email: raw.email,
    role: roleToFrontend(raw.role),
    active: raw.active,
    isOwner: raw.isOwner,
    isTeamLead: raw.isTeamLead,
    createdAt: raw.createdAt,
  };
}

async function apiRequest<T>(path: string, options: RequestInit = {}, needsAuth = true): Promise<T> {
  const token = getStorageValue(TOKEN_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (needsAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({ message: 'Erreur API' }));

  if (!response.ok) {
    if (response.status === 401 && needsAuth) {
      logout();
    }

    throw new ApiError(
      (payload as { message?: string })?.message ?? 'Erreur API',
      response.status,
      payload,
    );
  }

  return payload as T;
}

export function getStoredUser(): User | null {
  const raw = getStorageValue(USER_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<User>;
    if (!parsed.id || !parsed.name || !parsed.email || !parsed.role) {
      return null;
    }

    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      active: parsed.active ?? true,
      isOwner: parsed.isOwner ?? false,
      isTeamLead: parsed.isTeamLead ?? false,
    };
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  const storage = getActiveAuthStorage();
  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout() {
  clearAuthStorage();
}

export async function login(email: string, password: string, remember = false): Promise<User> {
  const payload = await apiRequest<LoginResponse>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
    false,
  );

  const user: User = {
    id: payload.user.id,
    name: payload.user.fullName,
    email: payload.user.email,
    role: roleToFrontend(payload.user.role),
    active: payload.user.active,
    isOwner: payload.user.isOwner,
    isTeamLead: payload.user.isTeamLead,
  };

  const storage = remember ? localStorage : sessionStorage;
  clearAuthStorage();
  storage.setItem(TOKEN_KEY, payload.token);
  storage.setItem(USER_KEY, JSON.stringify(user));

  return user;
}

export async function fetchDashboard(): Promise<{
  stats: DashboardStats;
  alerts: Material[];
  recentMovements: Movement[];
}> {
  const data = await apiRequest<DashboardResponse>('/dashboard');

  return {
    stats: data.stats,
    alerts: data.alerts.map(mapMaterial),
    recentMovements: data.recentMovements.map(mapMovement),
  };
}

export async function fetchMaterials(includeInactive = false): Promise<Material[]> {
  const params = new URLSearchParams();
  if (includeInactive) {
    params.set('includeInactive', 'true');
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  const data = await apiRequest<MaterialApiResponse[]>(`/materials${suffix}`);
  return data.map(mapMaterial);
}

export async function createMaterial(input: CreateMaterialInput): Promise<Material> {
  const data = await apiRequest<MaterialApiResponse>('/materials', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return mapMaterial(data);
}

export async function updateMaterial(materialId: string | number, input: UpdateMaterialInput): Promise<Material> {
  const data = await apiRequest<MaterialApiResponse>(`/materials/${materialId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  return mapMaterial(data);
}

export async function deleteMaterial(materialId: string | number): Promise<{ message: string; deletedId: string }> {
  return apiRequest<{ message: string; deletedId: string }>(`/materials/${materialId}`, {
    method: 'DELETE',
  });
}

export async function fetchMovements(): Promise<Movement[]> {
  const data = await apiRequest<Array<{
    id: string;
    type: 'IN' | 'OUT';
    quantity: number;
    note?: string | null;
    createdAt: string;
    materialId: string;
    userId: string;
    material: { id: string; name: string; quantity: number };
    user: { id: string; fullName: string };
  }>>('/movements');

  return data.map(mapMovement);
}

export async function createMovement(input: {
  materialId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  note: string;
}) {
  return apiRequest('/movements', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchUsers(status: UserStatusFilter = 'active', search = ''): Promise<ManagedUser[]> {
  const params = new URLSearchParams();
  params.set('status', status);
  if (search.trim()) {
    params.set('search', search.trim());
  }

  const data = await apiRequest<ManagedUserApiResponse[]>(`/users?${params.toString()}`);
  return data.map(mapManagedUser);
}

export async function createUserAccount(input: CreateUserInput): Promise<ManagedUser> {
  const data = await apiRequest<ManagedUserApiResponse>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return mapManagedUser(data);
}

export async function updateUserAccount(userId: string, input: UpdateUserInput): Promise<ManagedUser> {
  const data = await apiRequest<ManagedUserApiResponse>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  return mapManagedUser(data);
}

export async function toggleUserTeamLead(userId: string, isTeamLead: boolean): Promise<ManagedUser> {
  const data = await apiRequest<ManagedUserApiResponse>(`/users/${userId}/team-lead`, {
    method: 'PATCH',
    body: JSON.stringify({ isTeamLead }),
  });

  return mapManagedUser(data);
}

export async function resetUserPassword(userId: string, password: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/users/${userId}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}

export async function fetchMe(): Promise<User> {
  const data = await apiRequest<ManagedUserApiResponse>('/me');

  const user: User = {
    id: data.id,
    name: data.fullName,
    email: data.email,
    role: roleToFrontend(data.role),
    active: data.active,
    isOwner: data.isOwner,
    isTeamLead: data.isTeamLead,
  };

  setStoredUser(user);
  return user;
}

export async function updateMyPassword(password: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}

export async function fetchWorkAgents(): Promise<WorkAgent[]> {
  return apiRequest<WorkAgentApiResponse[]>('/work/agents');
}

export async function fetchWorkEquipments(includeArchived = false): Promise<WorkEquipment[]> {
  const params = new URLSearchParams();
  params.set('archived', includeArchived ? 'true' : 'false');

  return apiRequest<WorkEquipmentApiResponse[]>(`/work/equipments?${params.toString()}`);
}

export async function createWorkEquipment(input: CreateWorkEquipmentInput): Promise<WorkEquipment> {
  return apiRequest<WorkEquipmentApiResponse>('/work/equipments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateWorkEquipment(equipmentId: string, input: UpdateWorkEquipmentInput): Promise<WorkEquipment> {
  return apiRequest<WorkEquipmentApiResponse>(`/work/equipments/${equipmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function archiveWorkEquipment(equipmentId: string, archived = true): Promise<WorkEquipment> {
  return apiRequest<WorkEquipmentApiResponse>(`/work/equipments/${equipmentId}/archive`, {
    method: 'PATCH',
    body: JSON.stringify({ archived }),
  });
}

export async function fetchWorkTasks(equipmentId: string, includeArchived = false): Promise<WorkTask[]> {
  const params = new URLSearchParams();
  params.set('archived', includeArchived ? 'true' : 'false');

  return apiRequest<WorkTaskApiResponse[]>(`/work/equipments/${equipmentId}/tasks?${params.toString()}`);
}

export async function createWorkTask(equipmentId: string, input: CreateWorkTaskInput): Promise<WorkTask> {
  return apiRequest<WorkTaskApiResponse>(`/work/equipments/${equipmentId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateWorkTask(taskId: string, input: UpdateWorkTaskInput): Promise<WorkTask> {
  return apiRequest<WorkTaskApiResponse>(`/work/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function updateWorkTaskStatus(taskId: string, status: WorkTaskStatus): Promise<WorkTask> {
  return apiRequest<WorkTaskApiResponse>(`/work/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function archiveWorkTask(taskId: string, archived = true): Promise<WorkTask> {
  return apiRequest<WorkTaskApiResponse>(`/work/tasks/${taskId}/archive`, {
    method: 'PATCH',
    body: JSON.stringify({ archived }),
  });
}

export async function fetchAgentKanban(agentId: string): Promise<{ agent: WorkAgent; tasks: WorkTask[] }> {
  return apiRequest<{ agent: WorkAgentApiResponse; tasks: WorkTaskApiResponse[] }>(`/work/agents/${agentId}/kanban`);
}

export async function fetchWorkTaskHistory(taskId: string): Promise<WorkTaskHistoryItem[]> {
  return apiRequest<WorkTaskHistoryApiResponse[]>(`/work/tasks/${taskId}/history`);
}
