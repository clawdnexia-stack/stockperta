import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  FolderArchive,
  GripVertical,
  Pencil,
  Plus,
  RotateCcw,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import {
  ApiError,
  archiveWorkEquipment,
  archiveWorkTask,
  createWorkEquipment,
  createWorkTask,
  fetchAgentKanban,
  fetchMe,
  fetchWorkAgents,
  fetchWorkEquipments,
  fetchWorkTasks,
  getStoredUser,
  updateWorkEquipment,
  updateWorkTask,
  updateWorkTaskStatus,
} from '../lib/api';
import type {
  WorkAgent,
  WorkEquipment,
  WorkTask,
  WorkTaskPriority,
  WorkTaskStatus,
} from '../types';
import { formatDate } from '../utils/format';

type ViewMode = 'equipments' | 'agents';

const STATUS_COLUMNS: { key: WorkTaskStatus; label: string }[] = [
  { key: 'TODO', label: 'À faire' },
  { key: 'IN_PROGRESS', label: 'En cours' },
  { key: 'CONTROL', label: 'Contrôle' },
  { key: 'DONE', label: 'Terminé' },
];

const PRIORITY_OPTIONS: { value: WorkTaskPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Basse', color: '#6b7280' },
  { value: 'MEDIUM', label: 'Moyenne', color: '#f59e0b' },
  { value: 'HIGH', label: 'Haute', color: '#ef4444' },
];

function priorityLabel(priority: WorkTaskPriority) {
  return PRIORITY_OPTIONS.find((p) => p.value === priority)?.label ?? priority;
}

function priorityColor(priority: WorkTaskPriority) {
  return PRIORITY_OPTIONS.find((p) => p.value === priority)?.color ?? '#6b7280';
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function statusClass(status: WorkTaskStatus) {
  switch (status) {
    case 'TODO':
      return 'todo';
    case 'IN_PROGRESS':
      return 'in-progress';
    case 'CONTROL':
      return 'control';
    case 'DONE':
      return 'done';
    default:
      return 'todo';
  }
}

function statusLabel(status: WorkTaskStatus) {
  return STATUS_COLUMNS.find((col) => col.key === status)?.label ?? status;
}

function canManageWork(user: ReturnType<typeof getStoredUser>) {
  return !!user && (user.role === 'admin' || user.isTeamLead);
}

interface TaskCardProps {
  task: WorkTask;
  canEdit: boolean;
  canChangeStatus: boolean;
  onStatusChange: (taskId: string, status: WorkTaskStatus) => void;
  onEdit: (task: WorkTask) => void;
  onArchive: (task: WorkTask) => void;
  onDragStart: (task: WorkTask) => void;
  onDragEnd: () => void;
}

function TaskCard({
  task,
  canEdit,
  canChangeStatus,
  onStatusChange,
  onEdit,
  onArchive,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const nextStatus = useMemo(() => {
    const idx = STATUS_COLUMNS.findIndex((col) => col.key === task.status);
    return idx < STATUS_COLUMNS.length - 1 ? STATUS_COLUMNS[idx + 1] : null;
  }, [task.status]);

  const prevStatus = useMemo(() => {
    const idx = STATUS_COLUMNS.findIndex((col) => col.key === task.status);
    return idx > 0 ? STATUS_COLUMNS[idx - 1] : null;
  }, [task.status]);

  return (
    <div
      className={`task-card ${task.isOverdue ? 'task-card-overdue' : ''}`}
      draggable={canChangeStatus}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', task.id);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart(task);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="task-card-header">
        <div className="task-card-grip">
          <GripVertical size={14} />
        </div>
        <div className="task-card-title-wrap">
          <span className="task-card-title">{task.title}</span>
          {task.isOverdue && (
            <span className="task-badge task-badge-overdue">
              <AlertTriangle size={12} /> En retard
            </span>
          )}
        </div>
        <button
          className="btn-icon btn-icon-sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <div className="task-card-meta">
        <span className={`task-badge task-badge-status ${statusClass(task.status)}`}>
          {statusLabel(task.status)}
        </span>
        <span className="task-badge task-badge-priority" style={{ borderColor: priorityColor(task.priority) }}>
          <span
            className="task-priority-dot"
            style={{ backgroundColor: priorityColor(task.priority) }}
            title={priorityLabel(task.priority)}
          />
          {priorityLabel(task.priority)}
        </span>
        {task.dueDate && (
          <span className="task-meta-item">
            <Calendar size={12} />
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.estimatedDays !== null && (
          <span className="task-meta-item">
            <Clock size={12} />
            {task.estimatedDays} j
          </span>
        )}
        {task.assignees.length > 0 && (
          <span className="task-meta-item task-assignees">
            <Users size={12} />
            {task.assignees.length > 2
              ? `${task.assignees.length} agents`
              : task.assignees.map((a) => a.fullName.split(' ')[0]).join(', ')}
          </span>
        )}
      </div>

      {isExpanded && (
        <div className="task-card-details">
          {task.notes && <p className="task-notes">{task.notes}</p>}

          {task.assignees.length > 0 && (
            <div className="task-assignees-list">
              <strong>Assignés :</strong>
              <ul>
                {task.assignees.map((a) => (
                  <li key={a.id}>
                    {a.fullName}
                    {a.isTeamLead && <span className="tag tag-sm">Chef</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="task-card-actions">
            {canChangeStatus && prevStatus && (
              <button
                className="btn btn-outline btn-xs"
                onClick={() => onStatusChange(task.id, prevStatus.key)}
              >
                ← {prevStatus.label}
              </button>
            )}
            {canChangeStatus && nextStatus && (
              <button
                className="btn btn-primary btn-xs"
                onClick={() => onStatusChange(task.id, nextStatus.key)}
              >
                {nextStatus.label} →
              </button>
            )}
            {canEdit && (
              <>
                <button className="btn btn-outline btn-xs" onClick={() => onEdit(task)}>
                  <Pencil size={12} /> Modifier
                </button>
                <button className="btn btn-outline btn-xs btn-danger" onClick={() => onArchive(task)}>
                  <Archive size={12} /> Archiver
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TravailPage() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const isManager = canManageWork(currentUser);

  const [viewMode, setViewMode] = useState<ViewMode>('equipments');
  const [showArchived, setShowArchived] = useState(false);

  const [equipments, setEquipments] = useState<WorkEquipment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<WorkTask[]>([]);

  const [agents, setAgents] = useState<WorkAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentTasks, setAgentTasks] = useState<WorkTask[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<WorkEquipment | null>(null);
  const [equipmentForm, setEquipmentForm] = useState({ name: '', deliveryDate: '' });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkTask | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    status: 'TODO' as WorkTaskStatus,
    dueDate: '',
    estimatedDays: '',
    priority: 'MEDIUM' as WorkTaskPriority,
    notes: '',
    assigneeIds: [] as string[],
  });

  const selectedEquipment = useMemo(
    () => equipments.find((e) => e.id === selectedEquipmentId) ?? null,
    [equipments, selectedEquipmentId],
  );

  useEffect(() => {
    fetchMe()
      .then((user) => setCurrentUser(user))
      .catch(() => {
        // ignore sync errors: auth guard will handle redirection if needed
      });
  }, []);

  const loadEquipments = useCallback(async (archived: boolean) => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchWorkEquipments(archived);
      setEquipments(data);

      if (data.length > 0 && !selectedEquipmentId) {
        setSelectedEquipmentId(data[0].id);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Impossible de charger les équipements'));
    } finally {
      setLoading(false);
    }
  }, [selectedEquipmentId]);

  const loadTasks = useCallback(async (equipmentId: string) => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchWorkTasks(equipmentId, false);
      setTasks(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Impossible de charger les tâches'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAgents = useCallback(async () => {
    try {
      const data = await fetchWorkAgents();
      setAgents(data);

      if (data.length > 0 && !selectedAgentId) {
        setSelectedAgentId(data[0].id);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Impossible de charger les agents'));
    }
  }, [selectedAgentId]);

  const loadAgentKanban = useCallback(async (agentId: string) => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchAgentKanban(agentId);
      setAgentTasks(data.tasks);
    } catch (err) {
      setError(extractErrorMessage(err, "Impossible de charger les tâches de l'agent"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  useEffect(() => {
    if (viewMode === 'equipments') {
      loadEquipments(showArchived);
    }
  }, [viewMode, showArchived, loadEquipments]);

  useEffect(() => {
    if (viewMode === 'equipments' && selectedEquipmentId) {
      loadTasks(selectedEquipmentId);
    }
  }, [viewMode, selectedEquipmentId, loadTasks]);

  useEffect(() => {
    if (viewMode === 'agents' && selectedAgentId) {
      loadAgentKanban(selectedAgentId);
    }
  }, [viewMode, selectedAgentId, loadAgentKanban]);

  const resetEquipmentForm = () => {
    setEquipmentForm({ name: '', deliveryDate: '' });
    setEditingEquipment(null);
  };

  const openCreateEquipmentModal = () => {
    resetEquipmentForm();
    setIsEquipmentModalOpen(true);
  };

  const openEditEquipmentModal = (equipment: WorkEquipment) => {
    setEditingEquipment(equipment);
    setEquipmentForm({
      name: equipment.name,
      deliveryDate: equipment.deliveryDate.slice(0, 10),
    });
    setIsEquipmentModalOpen(true);
  };

  const closeEquipmentModal = () => {
    setIsEquipmentModalOpen(false);
    resetEquipmentForm();
  };

  const handleEquipmentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingEquipment) {
        await updateWorkEquipment(editingEquipment.id, {
          name: equipmentForm.name.trim(),
          deliveryDate: equipmentForm.deliveryDate,
        });
        setSuccess('Équipement mis à jour');
      } else {
        await createWorkEquipment({
          name: equipmentForm.name.trim(),
          deliveryDate: equipmentForm.deliveryDate,
        });
        setSuccess('Équipement créé');
      }

      closeEquipmentModal();
      await loadEquipments(showArchived);
    } catch (err) {
      setError(extractErrorMessage(err, "Impossible de sauvegarder l'équipement"));
    }
  };

  const handleArchiveEquipment = async (equipment: WorkEquipment) => {
    const action = equipment.archivedAt ? 'désarchiver' : 'archiver';
    const confirmed = window.confirm(`Confirmer ${action} l'équipement "${equipment.name}" ?`);
    if (!confirmed) return;

    setError('');

    try {
      await archiveWorkEquipment(equipment.id, !equipment.archivedAt);
      setSuccess(equipment.archivedAt ? 'Équipement désarchivé' : 'Équipement archivé');
      await loadEquipments(showArchived);
    } catch (err) {
      setError(extractErrorMessage(err, `Impossible de ${action} l'équipement`));
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      status: 'TODO',
      dueDate: '',
      estimatedDays: '',
      priority: 'MEDIUM',
      notes: '',
      assigneeIds: [],
    });
    setEditingTask(null);
  };

  const openCreateTaskModal = () => {
    resetTaskForm();
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: WorkTask) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      status: task.status,
      dueDate: task.dueDate?.slice(0, 10) ?? '',
      estimatedDays: task.estimatedDays?.toString() ?? '',
      priority: task.priority,
      notes: task.notes ?? '',
      assigneeIds: task.assignees.map((a) => a.id),
    });
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    resetTaskForm();
  };

  const handleTaskSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentId) return;

    setError('');

    const payload = {
      title: taskForm.title.trim(),
      status: taskForm.status,
      dueDate: taskForm.dueDate || null,
      estimatedDays: taskForm.estimatedDays ? parseFloat(taskForm.estimatedDays) : null,
      priority: taskForm.priority,
      notes: taskForm.notes.trim() || null,
      assigneeIds: taskForm.assigneeIds,
    };

    try {
      if (editingTask) {
        await updateWorkTask(editingTask.id, payload);
        setSuccess('Tâche mise à jour');
      } else {
        await createWorkTask(selectedEquipmentId, payload);
        setSuccess('Tâche créée');
      }

      closeTaskModal();
      await loadTasks(selectedEquipmentId);
    } catch (err) {
      setError(extractErrorMessage(err, 'Impossible de sauvegarder la tâche'));
    }
  };

  const handleStatusChange = async (taskId: string, status: WorkTaskStatus) => {
    setError('');

    try {
      await updateWorkTaskStatus(taskId, status);

      if (viewMode === 'equipments' && selectedEquipmentId) {
        await loadTasks(selectedEquipmentId);
      } else if (viewMode === 'agents' && selectedAgentId) {
        await loadAgentKanban(selectedAgentId);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Impossible de changer le statut'));
    }
  };

  const handleTaskDragStart = (task: WorkTask) => {
    if (!canUserChangeStatus(task)) return;
    setDraggedTaskId(task.id);
  };

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleDropOnColumn = async (targetStatus: WorkTaskStatus) => {
    if (!draggedTaskId) return;

    const task = displayedTasks.find((item) => item.id === draggedTaskId);
    if (!task) {
      setDraggedTaskId(null);
      return;
    }

    if (!canUserChangeStatus(task) || task.status === targetStatus) {
      setDraggedTaskId(null);
      return;
    }

    await handleStatusChange(task.id, targetStatus);
    setDraggedTaskId(null);
  };

  const handleArchiveTask = async (task: WorkTask) => {
    const confirmed = window.confirm(`Confirmer archiver la tâche "${task.title}" ?`);
    if (!confirmed) return;

    setError('');

    try {
      await archiveWorkTask(task.id, true);
      setSuccess('Tâche archivée');

      if (selectedEquipmentId) {
        await loadTasks(selectedEquipmentId);
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Impossible d'archiver la tâche"));
    }
  };

  const canUserChangeStatus = (task: WorkTask) => {
    if (isManager) return true;
    return task.assignees.some((a) => a.id === String(currentUser?.id));
  };

  const displayedTasks = viewMode === 'equipments' ? tasks : agentTasks;

  const tasksByStatus = useMemo(() => {
    const grouped: Record<WorkTaskStatus, WorkTask[]> = {
      TODO: [],
      IN_PROGRESS: [],
      CONTROL: [],
      DONE: [],
    };

    for (const task of displayedTasks) {
      grouped[task.status].push(task);
    }

    return grouped;
  }, [displayedTasks]);

  return (
    <div className="travail-page">
      <div className="page-header page-header-row">
        <div>
          <h2>Travail</h2>
          <p>Organisez les tâches et suivez l'avancement des équipements</p>
        </div>
        <div className="page-header-actions">
          <div className="view-switch">
            <button
              className={`btn btn-sm ${viewMode === 'equipments' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('equipments')}
            >
              Équipements
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'agents' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('agents')}
            >
              Agents
            </button>
          </div>
        </div>
      </div>

      {error && <div className="warning-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {viewMode === 'equipments' && (
        <>
          <div className="equipments-toolbar">
            <div className="equipment-tabs">
              {equipments.map((equipment) => (
                <button
                  key={equipment.id}
                  className={`equipment-tab ${equipment.id === selectedEquipmentId ? 'active' : ''} ${equipment.isOverdue ? 'overdue' : ''}`}
                  onClick={() => setSelectedEquipmentId(equipment.id)}
                >
                  {equipment.isOverdue && <AlertTriangle size={14} />}
                  {equipment.name}
                  <span className="equipment-tab-count">
                    {equipment.taskSummary.done}/{equipment.taskSummary.total}
                  </span>
                </button>
              ))}
              {isManager && (
                <button className="equipment-tab equipment-tab-add" onClick={openCreateEquipmentModal}>
                  <Plus size={16} /> Nouvel équipement
                </button>
              )}
            </div>
            <div className="equipments-toolbar-actions">
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                <FolderArchive size={14} /> Voir archives
              </label>
            </div>
          </div>

          {selectedEquipment && (
            <div className="equipment-header-bar">
              <div className="equipment-info">
                <strong>{selectedEquipment.name}</strong>
                <span className="equipment-delivery">
                  <Calendar size={14} />
                  Livraison : {formatDate(selectedEquipment.deliveryDate)}
                  {selectedEquipment.isOverdue && (
                    <span className="task-badge task-badge-overdue">
                      <AlertTriangle size={12} /> En retard
                    </span>
                  )}
                </span>
              </div>
              {isManager && (
                <div className="equipment-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => openEditEquipmentModal(selectedEquipment)}>
                    <Pencil size={14} /> Modifier
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleArchiveEquipment(selectedEquipment)}>
                    {selectedEquipment.archivedAt ? <RotateCcw size={14} /> : <Archive size={14} />}
                    {selectedEquipment.archivedAt ? 'Désarchiver' : 'Archiver'}
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={openCreateTaskModal}>
                    <Plus size={14} /> Nouvelle tâche
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {viewMode === 'agents' && (
        <div className="agents-toolbar">
          <div className="agents-select-wrap">
            <UserIcon size={16} />
            <select
              value={selectedAgentId ?? ''}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.fullName}
                  {agent.isTeamLead ? ' (Chef)' : ''}
                </option>
              ))}
            </select>
          </div>
          <p className="text-muted text-sm">
            Changement de statut autorisé selon vos droits. Édition complète en Vue Équipements.
          </p>
        </div>
      )}

      {loading ? (
        <div className="loading-placeholder">Chargement...</div>
      ) : (
        <div className="kanban-board">
          {STATUS_COLUMNS.map((col) => (
            <div key={col.key} className={`kanban-column kanban-column-${statusClass(col.key)}`}>
              <div className="kanban-column-header">
                <span className={`kanban-column-title kanban-status-pill ${statusClass(col.key)}`}>{col.label}</span>
                <span className="kanban-column-count">{tasksByStatus[col.key].length}</span>
              </div>
              <div
                className={`kanban-column-body ${draggedTaskId ? 'drop-active' : ''}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDropOnColumn(col.key)}
              >
                {tasksByStatus[col.key].length === 0 ? (
                  <div className="kanban-empty">Aucune tâche</div>
                ) : (
                  tasksByStatus[col.key].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      canEdit={isManager && viewMode === 'equipments'}
                      canChangeStatus={canUserChangeStatus(task)}
                      onStatusChange={handleStatusChange}
                      onEdit={openEditTaskModal}
                      onArchive={handleArchiveTask}
                      onDragStart={handleTaskDragStart}
                      onDragEnd={handleTaskDragEnd}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isEquipmentModalOpen && (
        <div className="modal-backdrop" onClick={closeEquipmentModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEquipment ? 'Modifier équipement' : 'Nouvel équipement'}</h3>
              <button className="btn-icon" onClick={closeEquipmentModal}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEquipmentSubmit}>
              <div className="form-group">
                <label>Nom de l'équipement <span className="required">*</span></label>
                <input
                  type="text"
                  value={equipmentForm.name}
                  onChange={(e) => setEquipmentForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Portail Villa Sawadogo"
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de livraison <span className="required">*</span></label>
                <input
                  type="date"
                  value={equipmentForm.deliveryDate}
                  onChange={(e) => setEquipmentForm((f) => ({ ...f, deliveryDate: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeEquipmentModal}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEquipment ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTaskModalOpen && (
        <div className="modal-backdrop" onClick={closeTaskModal}>
          <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTask ? 'Modifier tâche' : 'Nouvelle tâche'}</h3>
              <button className="btn-icon" onClick={closeTaskModal}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label>Titre de la tâche <span className="required">*</span></label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Découpe tubes portail"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value as WorkTaskStatus }))}
                  >
                    {STATUS_COLUMNS.map((col) => (
                      <option key={col.key} value={col.key}>{col.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priorité</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value as WorkTaskPriority }))}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date prévue</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Durée estimée (jours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={taskForm.estimatedDays}
                    onChange={(e) => setTaskForm((f) => ({ ...f, estimatedDays: e.target.value }))}
                    placeholder="Ex: 1.5"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Agents assignés</label>
                <div className="checkbox-list">
                  {agents.map((agent) => (
                    <label key={agent.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={taskForm.assigneeIds.includes(agent.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTaskForm((f) => ({ ...f, assigneeIds: [...f.assigneeIds, agent.id] }));
                          } else {
                            setTaskForm((f) => ({ ...f, assigneeIds: f.assigneeIds.filter((id) => id !== agent.id) }));
                          }
                        }}
                      />
                      <span className="checkbox-item-name">{agent.fullName}</span>
                      {agent.isTeamLead && <span className="tag tag-sm checkbox-item-role">Chef</span>}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Instructions ou remarques..."
                  rows={3}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeTaskModal}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
