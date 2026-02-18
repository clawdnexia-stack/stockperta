import { useEffect, useMemo, useState } from 'react';
import { FileText, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateTime } from '../utils/format';
import { ITEMS_PER_PAGE } from '../constants';
import { fetchMovements } from '../lib/api';
import type { Movement } from '../types';

export default function HistoriquePage() {
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [operatorFilter, setOperatorFilter] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMovements();
        setMovements(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur chargement historique');
      }
    };

    load();
  }, []);

  const operators = useMemo(
    () => Array.from(new Set(movements.map(m => m.userName))).sort((a, b) => a.localeCompare(b)),
    [movements],
  );

  const filtered = movements
    .filter(m => {
      const matchType = typeFilter === 'Tous'
        || (typeFilter === 'Entrées' && m.type === 'IN')
        || (typeFilter === 'Sorties' && m.type === 'OUT');
      const matchOperator = operatorFilter === 'Tous' || m.userName === operatorFilter;
      const query = searchQuery.toLowerCase();
      const matchSearch = m.materialName.toLowerCase().includes(query)
        || m.reason.toLowerCase().includes(query);
      return matchType && matchOperator && matchSearch;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const totalIn = movements.filter(m => m.type === 'IN').length;
  const totalOut = movements.filter(m => m.type === 'OUT').length;

  const resetPage = () => setCurrentPage(1);

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>Historique des Mouvements</h2>
            <p>Traçabilité complète de tous les mouvements de stock</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-outline" disabled>
              <FileText size={16} />
              Exporter CSV
            </button>
            <button className="btn btn-primary" disabled>
              <Download size={16} />
              Exporter PDF
            </button>
          </div>
        </div>
      </div>

      {error && <div className="warning-msg">{error}</div>}

      {/* Filtres */}
      <div className="card card-spaced">
        <div className="filter-bar">
          <div className="filter-group">
            <label className="filter-label">Type</label>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); resetPage(); }}
              className="filter-select-sm"
            >
              <option>Tous</option>
              <option>Entrées</option>
              <option>Sorties</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Opérateur</label>
            <select
              value={operatorFilter}
              onChange={e => { setOperatorFilter(e.target.value); resetPage(); }}
              className="filter-select-md"
            >
              <option>Tous</option>
              {operators.map(name => <option key={name}>{name}</option>)}
            </select>
          </div>
          <div className="filter-group filter-group-grow">
            <label className="filter-label">Rechercher</label>
            <div className="search-input">
              <Search />
              <input
                type="text"
                placeholder="Rechercher une matière ou raison..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); resetPage(); }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Matière</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Stock Après</th>
                <th>Raison</th>
                <th>Opérateur</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(m => (
                <tr key={m.id}>
                  <td className="text-muted text-nowrap">{formatDateTime(m.createdAt)}</td>
                  <td className="text-medium">{m.materialName}</td>
                  <td>
                    <span className={`tag ${m.type === 'IN' ? 'tag-in' : 'tag-out'}`}>
                      {m.type === 'IN' ? '↑ ENTRÉE' : '↓ SORTIE'}
                    </span>
                  </td>
                  <td className="text-bold">{m.quantity}</td>
                  <td>{m.stockAfter}</td>
                  <td className="text-muted text-truncate">{m.reason}</td>
                  <td>{m.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <span>Page {currentPage} sur {totalPages || 1} ({filtered.length} résultats)</span>
          <div className="pagination-buttons">
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft size={14} /> Précédent
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage >= totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Suivant <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Resume */}
      <div className="summary-bar">
        <div className="summary-item"><strong>{movements.length}</strong> Total mouvements</div>
        <div className="summary-item"><strong>{totalIn}</strong> Entrées</div>
        <div className="summary-item"><strong>{totalOut}</strong> Sorties</div>
        <div className="summary-item"><strong>{new Date().toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</strong> Période</div>
      </div>
    </>
  );
}
