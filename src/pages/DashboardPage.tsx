import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, CheckCircle, AlertTriangle, XCircle, Plus, Minus } from 'lucide-react';
import { getStockStatus, getStockStatusLabel } from '../utils/stock';
import { formatDate } from '../utils/format';
import type { DashboardStats, Material, Movement } from '../types';
import { fetchDashboard } from '../lib/api';

const EMPTY_STATS: DashboardStats = { total: 0, ok: 0, low: 0, critical: 0 };

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [alerts, setAlerts] = useState<Material[]>([]);
  const [recentMovements, setRecentMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDashboard();
        setStats(data.stats);
        setAlerts(data.alerts);
        setRecentMovements(data.recentMovements);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement du dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <>
      <div className="page-header">
        <h2>Vue d'ensemble</h2>
        <p>
          État du stock en temps réel
          {' '}&bull;{' '}
          {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {error && <div className="warning-msg">{error}</div>}
      {isLoading && <div className="card card-spaced text-center">Chargement du dashboard...</div>}

      {/* KPI */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Package size={24} /></div>
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Références</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={24} /></div>
          <div>
            <div className="stat-value">{stats.ok}</div>
            <div className="stat-label">Stock Suffisant</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><AlertTriangle size={24} /></div>
          <div>
            <div className="stat-value">{stats.low}</div>
            <div className="stat-label">Stock Bas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><XCircle size={24} /></div>
          <div>
            <div className="stat-value">{stats.critical}</div>
            <div className="stat-label">Rupture de Stock</div>
          </div>
        </div>
      </div>

      {/* Mouvements recents + Alertes */}
      <div className="two-columns">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Derniers Mouvements</h3>
            <Link to="/historique" className="link">Voir tout &rarr;</Link>
          </div>
          <div className="table-container desktop-only">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Matière</th>
                  <th>Type</th>
                  <th>Qté</th>
                  <th>Opérateur</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.map(m => (
                  <tr key={m.id}>
                    <td>{formatDate(m.createdAt)}</td>
                    <td className="text-medium">{m.materialName}</td>
                    <td>
                      <span className={`tag ${m.type === 'IN' ? 'tag-in' : 'tag-out'}`}>
                        {m.type === 'IN' ? '↑ ENTRÉE' : '↓ SORTIE'}
                      </span>
                    </td>
                    <td className="text-bold">{m.quantity}</td>
                    <td className="text-muted">{m.userName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobile-movements mobile-only">
            {recentMovements.map(m => (
              <div className="mobile-movement-item" key={`mobile-${m.id}`}>
                <div className="mobile-movement-top">
                  <p className="text-medium">{m.materialName}</p>
                  <span className={`tag ${m.type === 'IN' ? 'tag-in' : 'tag-out'}`}>
                    {m.type === 'IN' ? '↑ ENTRÉE' : '↓ SORTIE'}
                  </span>
                </div>
                <div className="mobile-movement-meta">
                  <span>{formatDate(m.createdAt)}</span>
                  <span>Qté: <strong>{m.quantity}</strong></span>
                  <span>{m.userName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Alertes Stock</h3>
            <span className="tag tag-out">{alerts.length} alertes</span>
          </div>
          {alerts.map(material => {
            const status = getStockStatus(material.quantity, material.alertThreshold);
            return (
              <div className="alert-item" key={material.id}>
                <div className="alert-item-left">
                  <span className={`status-dot ${status}`} />
                  <div className="alert-info">
                    <h4>{material.name}</h4>
                    <p>Actuel: {material.quantity} {material.unit} / Seuil: {material.alertThreshold}</p>
                  </div>
                </div>
                <span className={`text-sm text-bold ${status === 'critical' ? 'text-danger' : 'text-warning'}`}>
                  {getStockStatusLabel(status)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="quick-actions">
        <Link to="/mouvements?type=in" className="action-card entry">
          <div className="action-icon"><Plus size={24} /></div>
          <h3>Nouvelle Entrée</h3>
          <p>Ajouter des matériaux au stock</p>
        </Link>
        <Link to="/mouvements?type=out" className="action-card exit">
          <div className="action-icon"><Minus size={24} /></div>
          <h3>Nouvelle Sortie</h3>
          <p>Retirer pour un projet</p>
        </Link>
      </div>
    </>
  );
}
