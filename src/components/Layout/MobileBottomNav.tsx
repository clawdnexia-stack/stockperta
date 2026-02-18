import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowLeftRight, ClipboardList } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Accueil', end: true },
  { to: '/travail', icon: ClipboardList, label: 'Travail', end: false },
  { to: '/catalogue', icon: Package, label: 'Catalogue', end: false },
  { to: '/mouvements', icon: ArrowLeftRight, label: 'Mouvements', end: false },
] as const;

export default function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav">
      {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon size={24} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
