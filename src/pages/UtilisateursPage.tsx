import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { KeyRound, Pencil, Plus, Search, Shield, UserCheck, UserX, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ApiError,
  createUserAccount,
  fetchUsers,
  getStoredUser,
  logout,
  resetUserPassword,
  setStoredUser,
  toggleUserTeamLead,
  updateUserAccount,
  type UserStatusFilter,
} from '../lib/api';
import type { ManagedUser } from '../types';
import { formatDate } from '../utils/format';

interface CreateUserForm {
  fullName: string;
  email: string;
  password: string;
}

interface EditUserForm {
  fullName: string;
  email: string;
}

const EMPTY_CREATE_FORM: CreateUserForm = {
  fullName: '',
  email: '',
  password: '',
};

const EMPTY_EDIT_FORM: EditUserForm = {
  fullName: '',
  email: '',
};

function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function roleLabel(role: ManagedUser['role']) {
  return role === 'admin' ? 'ADMIN' : 'USER';
}

export default function UtilisateursPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('active');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [createForm, setCreateForm] = useState<CreateUserForm>(EMPTY_CREATE_FORM);
  const [editForm, setEditForm] = useState<EditUserForm>(EMPTY_EDIT_FORM);
  const [passwordValue, setPasswordValue] = useState('');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  const currentUser = getStoredUser();

  const activeUsersCount = useMemo(() => users.filter((user) => user.active).length, [users]);

  const loadUsers = async (filter: UserStatusFilter, searchTerm: string) => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchUsers(filter, searchTerm);
      setUsers(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Impossible de charger les utilisateurs'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadUsers(statusFilter, search);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [statusFilter, search]);

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateForm(EMPTY_CREATE_FORM);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
    setEditForm(EMPTY_EDIT_FORM);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setSelectedUser(null);
    setPasswordValue('');
  };

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (createForm.password.trim().length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      await createUserAccount({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim().toLowerCase(),
        password: createForm.password,
      });

      closeCreateModal();
      setSuccess('Utilisateur créé avec succès');
      await loadUsers(statusFilter, search);
    } catch (err) {
      setError(extractErrorMessage(err, 'Impossible de créer cet utilisateur'));
    }
  };

  const openEditModal = (user: ManagedUser) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.name,
      email: user.email,
    });
    setIsEditModalOpen(true);
  };

  const handleEditUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedUser) return;

    setError('');

    try {
      const updatedUser = await updateUserAccount(selectedUser.id, {
        fullName: editForm.fullName.trim(),
        ...(selectedUser.isOwner ? {} : { email: editForm.email.trim().toLowerCase() }),
      });

      if (currentUser && updatedUser.id === String(currentUser.id)) {
        setStoredUser({
          ...currentUser,
          name: updatedUser.name,
          email: updatedUser.email,
        });
      }

      closeEditModal();
      setSuccess('Utilisateur mis à jour');
      await loadUsers(statusFilter, search);
    } catch (err) {
      setError(extractErrorMessage(err, 'Impossible de modifier cet utilisateur'));
    }
  };

  const handleToggleActive = async (user: ManagedUser) => {
    const action = user.active ? 'désactiver' : 'réactiver';
    const confirmed = window.confirm(`Confirmer ${action} le compte de ${user.name} ?`);
    if (!confirmed) return;

    setError('');

    try {
      await updateUserAccount(user.id, { active: !user.active });
      setSuccess(user.active ? 'Utilisateur désactivé' : 'Utilisateur réactivé');
      await loadUsers(statusFilter, search);
    } catch (err) {
      setError(extractErrorMessage(err, `Impossible de ${action} cet utilisateur`));
    }
  };

  const handleToggleTeamLead = async (user: ManagedUser) => {
    if (user.role !== 'user') return;

    const nextValue = !user.isTeamLead;
    const action = nextValue ? 'nommer chef d’équipe' : 'retirer le rôle de chef d’équipe';
    const confirmed = window.confirm(`Confirmer: ${action} pour ${user.name} ?`);
    if (!confirmed) return;

    setError('');

    try {
      await toggleUserTeamLead(user.id, nextValue);
      setSuccess(nextValue ? 'Chef d’équipe activé' : 'Chef d’équipe retiré');
      await loadUsers(statusFilter, search);
    } catch (err) {
      setError(extractErrorMessage(err, 'Impossible de mettre à jour le rôle chef d’équipe'));
    }
  };

  const openPasswordModal = (user: ManagedUser) => {
    setSelectedUser(user);
    setPasswordValue('');
    setIsPasswordModalOpen(true);
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedUser) return;

    setError('');

    if (passwordValue.trim().length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      await resetUserPassword(selectedUser.id, passwordValue);
      closePasswordModal();

      if (currentUser && selectedUser.id === String(currentUser.id)) {
        logout();
        navigate('/login', { replace: true });
        return;
      }

      setSuccess('Mot de passe réinitialisé');
      await loadUsers(statusFilter, search);
    } catch (err) {
      setError(extractErrorMessage(err, 'Impossible de réinitialiser le mot de passe'));
    }
  };

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h2>Gestion des utilisateurs</h2>
          <p>Créez, modifiez et désactivez les comptes de l’atelier</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => loadUsers(statusFilter, search)}>
            Actualiser
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Nouvel utilisateur
          </button>
        </div>
      </div>

      {error && <div className="warning-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="card users-toolbar-card">
        <div className="users-toolbar-grid">
          <div className="form-group users-toolbar-field">
            <label>Statut</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as UserStatusFilter)}>
              <option value="active">Actifs</option>
              <option value="inactive">Désactivés</option>
              <option value="all">Tous</option>
            </select>
          </div>

          <div className="form-group users-toolbar-field">
            <label>Recherche</label>
            <div className="users-search-input-wrap">
              <Search size={16} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nom ou email"
              />
            </div>
          </div>
        </div>

        <span className="text-muted text-sm">{activeUsersCount} compte(s) actif(s) affiché(s)</span>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Chef équipe</th>
                <th>Statut</th>
                <th>Date création</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-muted">Chargement...</td>
                </tr>
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-muted">Aucun utilisateur trouvé.</td>
                </tr>
              )}

              {!loading && users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="users-name-cell">
                      <strong>{user.name}</strong>
                      {user.isOwner && (
                        <span className="tag users-owner-tag"><Shield size={12} /> Owner</span>
                      )}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`tag ${user.role === 'admin' ? 'tag-out' : 'tag-in'}`}>
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    {user.role === 'user' ? (
                      <button
                        className={`btn btn-sm ${user.isTeamLead ? 'btn-success' : 'btn-outline'}`}
                        onClick={() => handleToggleTeamLead(user)}
                        disabled={!user.active}
                        title={!user.active ? 'Utilisateur désactivé' : undefined}
                      >
                        {user.isTeamLead ? 'Oui ✓' : 'Non'}
                      </button>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`tag ${user.active ? 'tag-in' : 'tag-out'}`}>
                      {user.active ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="users-actions-cell">
                      <button className="btn btn-outline btn-sm" onClick={() => openEditModal(user)}>
                        <Pencil size={14} /> Modifier
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => openPasswordModal(user)}>
                        <KeyRound size={14} /> Mot de passe
                      </button>
                      <button
                        className={`btn btn-sm ${user.active ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleActive(user)}
                        disabled={user.isOwner}
                        title={user.isOwner ? 'Le compte owner ne peut pas être désactivé' : undefined}
                      >
                        {user.active ? <UserX size={14} /> : <UserCheck size={14} />}
                        {user.active ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={closeCreateModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Nouvel utilisateur</h3>
              <button className="btn-icon" onClick={closeCreateModal}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Nom complet <span className="required">*</span></label>
                <input
                  type="text"
                  value={createForm.fullName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mot de passe <span className="required">*</span></label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                  minLength={8}
                  required
                />
                <span className="form-hint">Minimum 8 caractères. Rôle créé: USER.</span>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeCreateModal}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedUser && (
        <div className="modal-backdrop" onClick={closeEditModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Modifier utilisateur</h3>
              <button className="btn-icon" onClick={closeEditModal}><X size={18} /></button>
            </div>

            <form onSubmit={handleEditUser}>
              <div className="form-group">
                <label>Nom complet <span className="required">*</span></label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                  disabled={selectedUser.isOwner}
                  required
                />
                {selectedUser.isOwner && (
                  <span className="form-hint">Email owner verrouillé.</span>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeEditModal}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPasswordModalOpen && selectedUser && (
        <div className="modal-backdrop" onClick={closePasswordModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Réinitialiser le mot de passe</h3>
              <button className="btn-icon" onClick={closePasswordModal}><X size={18} /></button>
            </div>

            <form onSubmit={handleResetPassword}>
              <p className="text-sm text-muted modal-subtitle">
                Compte ciblé : <strong>{selectedUser.name}</strong>
              </p>

              <div className="form-group mt-16">
                <label>Nouveau mot de passe <span className="required">*</span></label>
                <input
                  type="password"
                  value={passwordValue}
                  onChange={(event) => setPasswordValue(event.target.value)}
                  minLength={8}
                  required
                />
                <span className="form-hint">Minimum 8 caractères.</span>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closePasswordModal}>Annuler</button>
                <button type="submit" className="btn btn-primary">Confirmer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
