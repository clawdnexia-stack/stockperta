import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CataloguePage from './pages/CataloguePage';
import MouvementsPage from './pages/MouvementsPage';
import HistoriquePage from './pages/HistoriquePage';
import ParametresPage from './pages/ParametresPage';
import TravailPage from './pages/TravailPage';
import UtilisateursPage from './pages/UtilisateursPage';
import { getStoredUser } from './lib/api';

function ProtectedLayout() {
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/travail" element={<TravailPage />} />
          <Route path="/catalogue" element={<CataloguePage />} />
          <Route path="/mouvements" element={<MouvementsPage />} />
          <Route path="/historique" element={<HistoriquePage />} />
          <Route path="/parametres" element={<ParametresPage />} />
          <Route
            path="/utilisateurs"
            element={(
              <AdminOnlyRoute>
                <UtilisateursPage />
              </AdminOnlyRoute>
            )}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
