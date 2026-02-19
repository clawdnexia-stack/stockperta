import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileTopBar from './MobileTopBar';
import MobileBottomNav from './MobileBottomNav';
import InstallAppPrompt from './InstallAppPrompt';

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [prevPath, setPrevPath] = useState('');
  const location = useLocation();

  // Close sidebar on route change
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <MobileTopBar onMenuClick={() => setIsSidebarOpen(true)} />
      <main className="main-content">
        <Outlet />
      </main>
      <MobileBottomNav />
      <InstallAppPrompt />

      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />
    </div>
  );
}
