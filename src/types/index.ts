/** Categorie de matiere premiere geree par l'atelier */
export type MaterialCategory =
  | 'Tubes'
  | 'Tôles'
  | 'Profilés'
  | 'Fers pleins'
  | 'Divers'
  | 'Consommables'
  | 'Peinture & Diluants';

/** Unites metier verrouillees */
export type MaterialUnitType = 'BARRE' | 'FEUILLE' | 'PIECE' | 'PAQUET' | 'BOITE' | 'BIDON';

/** Etat du niveau de stock d'une matiere */
export type StockStatus = 'ok' | 'low' | 'critical';

/** Direction d'un mouvement de stock */
export type MovementType = 'IN' | 'OUT';

/** Role utilisateur dans l'application */
export type UserRole = 'admin' | 'user';

/** Statut d'une tâche de production */
export type WorkTaskStatus = 'TODO' | 'IN_PROGRESS' | 'CONTROL' | 'DONE';

/** Priorité d'une tâche de production */
export type WorkTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

/** Matiere premiere en stock */
export interface Material {
  id: string | number;
  name: string;
  category: MaterialCategory;
  subType?: string;
  materialKind?: string;
  shapeType?: string;
  type: string;
  dimensions: string;
  dimAmm?: number;
  dimBmm?: number;
  thicknessMm?: number;
  sheetWidthMm?: number;
  sheetHeightMm?: number;
  packageSize?: number;
  packageUnit?: string;
  specText?: string;
  unit: string;
  unitType?: MaterialUnitType;
  unitVariant?: string;
  quantity: number;
  alertThreshold: number;
  active: boolean;
}

/** Mouvement de stock (entree ou sortie) */
export interface Movement {
  id: string | number;
  materialId: string | number;
  materialName: string;
  userId: string | number;
  userName: string;
  type: MovementType;
  quantity: number;
  stockAfter: number;
  reason: string;
  createdAt: string;
}

/** Utilisateur de l'application (session courante) */
export interface User {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  isOwner: boolean;
  isTeamLead: boolean;
}

/** Utilisateur visible dans la gestion admin */
export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  isOwner: boolean;
  isTeamLead: boolean;
  createdAt: string;
}

/** Agent de l'atelier visible dans le module Travail */
export interface WorkAgent {
  id: string;
  fullName: string;
  role: 'ADMIN' | 'USER';
  active: boolean;
  isTeamLead: boolean;
}

/** Equipement piloté dans l'onglet Travail */
export interface WorkEquipment {
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

/** Tâche de production */
export interface WorkTask {
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

/** Historique des modifications de tâche */
export interface WorkTaskHistoryItem {
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

/** Statistiques affichees sur le dashboard */
export interface DashboardStats {
  total: number;
  ok: number;
  low: number;
  critical: number;
}
