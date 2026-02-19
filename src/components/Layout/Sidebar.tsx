import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  History,
  LogOut,
  X,
  Settings,
  Bell,
  HelpCircle,
  Users,
  ClipboardList,
} from 'lucide-react';
import { getStoredUser, logout } from '../../lib/api';
import ceasLogo from '../../assets/ceas-logo.jpg';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const BASE_NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/travail', icon: ClipboardList, label: 'Travail', end: false },
  { to: '/catalogue', icon: Package, label: 'Catalogue', end: false },
  { to: '/mouvements', icon: ArrowRightLeft, label: 'Mouvements', end: false },
  { to: '/historique', icon: History, label: 'Historique', end: false },
] as const;

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'SA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userSectionRef = useRef<HTMLDivElement>(null);

  const currentUser = getStoredUser() ?? {
    id: 'fallback-user',
    name: 'Ouedraogo Stéphane A. K. W.',
    email: 'kderoued@gmail.com',
    role: 'admin' as const,
    active: true,
    isOwner: true,
    isTeamLead: false,
  };

  const navItems = useMemo(() => {
    if (currentUser.role !== 'admin') {
      return BASE_NAV_ITEMS;
    }

    return [
      ...BASE_NAV_ITEMS,
      { to: '/utilisateurs', icon: Users, label: 'Utilisateurs', end: false },
    ] as const;
  }, [currentUser.role]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!userSectionRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const goTo = (path: string) => {
    navigate(path);
    setIsUserMenuOpen(false);
    onClose?.();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {onClose && (
        <button className="sidebar-close-btn" onClick={onClose}>
          <X size={24} />
        </button>
      )}

      <div className="sidebar-logo">
        <img src={ceasLogo} alt="Logo CEAS Burkina" className="sidebar-brand-logo" />
        <h1>StockAtelier</h1>
        <span>Atelier de Soudure</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onClose?.()}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer" ref={userSectionRef}>
        <div className="sidebar-user-menu">
          <button
            className="sidebar-user sidebar-user-trigger"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
          >
            <div className="sidebar-user-avatar">
              {getInitials(currentUser.name)}
            </div>
            <div className="sidebar-user-info">
              <strong title={currentUser.name}>{currentUser.name}</strong>
              <span>{currentUser.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</span>
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="sidebar-user-dropdown" role="menu">
              <button role="menuitem" onClick={() => goTo('/parametres')}><Settings size={16} /> Paramètres</button>
              {currentUser.role === 'admin' && (
                <button role="menuitem" onClick={() => goTo('/utilisateurs')}><Users size={16} /> Utilisateurs</button>
              )}
              <button role="menuitem" onClick={() => goTo('/historique')}><History size={16} /> Historique</button>
              <button role="menuitem" onClick={() => goTo('/mouvements')}><Bell size={16} /> Alertes & mouvements</button>
              <button role="menuitem" onClick={() => goTo('/catalogue')}><HelpCircle size={16} /> Aide rapide</button>
            </div>
          )}
        </div>

        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
