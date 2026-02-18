import type { Material, StockStatus, DashboardStats } from '../types';

/** Determine le statut de stock selon la quantite et le seuil d'alerte */
export function getStockStatus(quantity: number, threshold: number): StockStatus {
  if (quantity === 0) return 'critical';
  if (quantity <= threshold) return 'low';
  return 'ok';
}

/** Retourne le libelle francais d'un statut de stock */
export function getStockStatusLabel(status: StockStatus): string {
  const labels: Record<StockStatus, string> = {
    ok: 'Stock suffisant',
    low: 'Stock bas',
    critical: 'Rupture de stock',
  };
  return labels[status];
}

/** Calcule les statistiques du dashboard a partir de la liste des matieres */
export function getDashboardStats(materials: Material[]): DashboardStats {
  const active = materials.filter(m => m.active);
  return {
    total: active.length,
    ok: active.filter(m => getStockStatus(m.quantity, m.alertThreshold) === 'ok').length,
    low: active.filter(m => getStockStatus(m.quantity, m.alertThreshold) === 'low').length,
    critical: active.filter(m => getStockStatus(m.quantity, m.alertThreshold) === 'critical').length,
  };
}

/** Retourne les matieres en alerte (low ou critical), triees par quantite croissante */
export function getAlerts(materials: Material[]): Material[] {
  return materials
    .filter(m => m.active && getStockStatus(m.quantity, m.alertThreshold) !== 'ok')
    .sort((a, b) => a.quantity - b.quantity);
}
