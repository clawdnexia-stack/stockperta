import { type FormEvent, useState } from 'react';
import {
  Bell,
  Shield,
  Download,
  Globe,
  User,
  Save,
  MessageCircle,
  Info,
  ChevronRight,
  KeyRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ApiError, getStoredUser, logout, updateMyPassword } from '../lib/api';

function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export default function ParametresPage() {
  const navigate = useNavigate();
  const [stockAlerts, setStockAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const user = getStoredUser();

  const handleChangeMyPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password.trim().length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== passwordConfirm) {
      setError('La confirmation du mot de passe ne correspond pas');
      return;
    }

    try {
      await updateMyPassword(password);
      setSuccess('Mot de passe mis à jour. Reconnecte-toi pour continuer.');
      setPassword('');
      setPasswordConfirm('');

      setTimeout(() => {
        logout();
        navigate('/login', { replace: true });
      }, 700);
    } catch (err) {
      setError(extractErrorMessage(err, 'Impossible de changer le mot de passe'));
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>Paramètres</h2>
        <p>Profil, alertes, sécurité et support de l’atelier</p>
      </div>

      {error && <div className="warning-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="settings-stack">
        <section className="card settings-card">
          <h3 className="card-title card-title-spaced">Compte</h3>
          <button className="settings-row-btn">
            <div className="settings-row-left">
              <span className="settings-icon blue"><User size={16} /></span>
              <div>
                <p className="text-medium">Profil utilisateur</p>
                <span className="text-muted text-sm">
                  {user?.name ?? 'Utilisateur'} • {user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                </span>
              </div>
            </div>
            <ChevronRight size={16} />
          </button>

          <button className="settings-row-btn">
            <div className="settings-row-left">
              <span className="settings-icon purple"><Globe size={16} /></span>
              <div>
                <p className="text-medium">Langue</p>
                <span className="text-muted text-sm">Français</span>
              </div>
            </div>
            <ChevronRight size={16} />
          </button>

          <form className="settings-password-form" onSubmit={handleChangeMyPassword}>
            <div className="settings-row-left">
              <span className="settings-icon slate"><KeyRound size={16} /></span>
              <div>
                <p className="text-medium">Changer mon mot de passe</p>
                <span className="text-muted text-sm">
                  {user?.role === 'admin'
                    ? 'Ton email admin est verrouillé, mais tu peux changer ton mot de passe.'
                    : 'Tu peux modifier uniquement ton mot de passe.'}
                </span>
              </div>
            </div>

            <div className="settings-password-grid">
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                minLength={8}
                required
              />
            </div>

            <button type="submit" className="btn btn-outline btn-sm">
              <KeyRound size={14} /> Mettre à jour
            </button>
          </form>
        </section>

        <section className="card settings-card">
          <h3 className="card-title card-title-spaced">Notifications & suivi</h3>

          <div className="settings-row-toggle">
            <div className="settings-row-left">
              <span className="settings-icon green"><Bell size={16} /></span>
              <div>
                <p className="text-medium">Alertes stock bas/rupture</p>
                <span className="text-muted text-sm">Prévenir immédiatement en cas de risque</span>
              </div>
            </div>
            <button
              className={`switch ${stockAlerts ? 'on' : ''}`}
              onClick={() => setStockAlerts((v) => !v)}
              aria-label="Activer les alertes stock"
            >
              <span />
            </button>
          </div>

          <div className="settings-row-toggle">
            <div className="settings-row-left">
              <span className="settings-icon orange"><Save size={16} /></span>
              <div>
                <p className="text-medium">Résumé quotidien</p>
                <span className="text-muted text-sm">Recevoir un résumé des mouvements</span>
              </div>
            </div>
            <button
              className={`switch ${dailySummary ? 'on' : ''}`}
              onClick={() => setDailySummary((v) => !v)}
              aria-label="Activer le résumé quotidien"
            >
              <span />
            </button>
          </div>
        </section>

        <section className="card settings-card">
          <h3 className="card-title card-title-spaced">Données & sécurité</h3>

          <div className="settings-row-static">
            <div className="settings-row-left">
              <span className="settings-icon slate"><Shield size={16} /></span>
              <div>
                <p className="text-medium">Sécurité session</p>
                <span className="text-muted text-sm">Session persistante 30 jours (backend prévu)</span>
              </div>
            </div>
            <span className="tag">Bientôt</span>
          </div>

          <div className="settings-row-static">
            <div className="settings-row-left">
              <span className="settings-icon slate"><Download size={16} /></span>
              <div>
                <p className="text-medium">Export des mouvements</p>
                <span className="text-muted text-sm">CSV / PDF (prévu)</span>
              </div>
            </div>
            <span className="tag">Bientôt</span>
          </div>
        </section>

        <section className="card settings-card">
          <h3 className="card-title card-title-spaced">Support</h3>
          <button className="settings-row-btn">
            <div className="settings-row-left">
              <span className="settings-icon green"><MessageCircle size={16} /></span>
              <div>
                <p className="text-medium">Contacter le support</p>
                <span className="text-muted text-sm">Assistance rapide pour l’atelier</span>
              </div>
            </div>
            <ChevronRight size={16} />
          </button>

          <button className="settings-row-btn">
            <div className="settings-row-left">
              <span className="settings-icon slate"><Info size={16} /></span>
              <div>
                <p className="text-medium">À propos de StockAtelier</p>
                <span className="text-muted text-sm">Version 0.1 • CEAS Burkina Faso</span>
              </div>
            </div>
            <ChevronRight size={16} />
          </button>
        </section>
      </div>
    </div>
  );
}
