import { useEffect, useRef, useState } from 'react';
import { LogOut, Menu, Settings, Bell, HelpCircle, History, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser, logout } from '../../lib/api';
import ceasLogo from '../../assets/ceas-logo.jpg';

interface MobileTopBarProps {
  onMenuClick: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/travail': 'Travail',
  '/catalogue': 'Catalogue',
  '/mouvements': 'Mouvements',
  '/historique': 'Historique',
  '/parametres': 'Paramètres',
  '/utilisateurs': 'Utilisateurs',
};

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'SA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function MobileTopBar({ onMenuClick }: MobileTopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const currentUser = getStoredUser() ?? {
    id: 'fallback-user',
    name: 'Ouedraogo Stéphane A. K. W.',
    email: 'kderoued@gmail.com',
    role: 'admin' as const,
    active: true,
    isOwner: true,
    isTeamLead: false,
  };
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'StockAtelier';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const goTo = (path: string) => {
    navigate(path);
    setIsUserMenuOpen(false);
  };

  return (
    <header className="mobile-top-bar">
      <div className="mobile-logo">
        <button className="btn-icon" onClick={onMenuClick} style={{ marginRight: 8 }}>
          <Menu size={24} color="white" />
        </button>
        <img src={ceasLogo} alt="Logo CEAS Burkina" className="mobile-brand-logo" />
        <h1>{pageTitle}</h1>
      </div>

      <div className="mobile-user-actions" ref={userMenuRef}>
        <button
          className="btn-icon"
          onClick={() => setIsUserMenuOpen((prev) => !prev)}
          aria-label="Ouvrir le menu utilisateur"
        >
          <LogOut size={20} />
        </button>

        <button
          className="user-avatar-sm user-avatar-btn"
          onClick={() => setIsUserMenuOpen((prev) => !prev)}
          aria-label="Ouvrir le menu utilisateur"
        >
          {getInitials(currentUser.name)}
        </button>

        {isUserMenuOpen && (
          <div className="user-dropdown-menu">
            <button onClick={() => goTo('/parametres')}>
              <Settings size={16} />
              Paramètres
            </button>
            {currentUser.role === 'admin' && (
              <button onClick={() => goTo('/utilisateurs')}>
                <Users size={16} />
                Utilisateurs
              </button>
            )}
            <button onClick={() => goTo('/historique')}>
              <History size={16} />
              Historique
            </button>
            <button onClick={() => goTo('/mouvements')}>
              <Bell size={16} />
              Alertes & mouvements
            </button>
            <button onClick={() => goTo('/catalogue')}>
              <HelpCircle size={16} />
              Aide rapide (catalogue)
            </button>
            <button className="danger" onClick={handleLogout}>
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
