import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { formatDateTime, getRecentMovements } from '../utils/format';
import type { Material, Movement, MovementType } from '../types';
import { createMovement, fetchMaterials, fetchMovements } from '../lib/api';

const SUCCESS_DISPLAY_MS = 2000;

function materialOptionLabel(material: Material) {
  const details = [material.dimensions && material.dimensions !== '-' ? material.dimensions : null, material.unit]
    .filter(Boolean)
    .join(' • ');

  return details ? `${material.name} — ${details}` : material.name;
}

export default function MouvementsPage() {
  const [searchParams] = useSearchParams();
  const initialType: MovementType = searchParams.get('type') === 'out' ? 'OUT' : 'IN';
  const initialMaterialId = searchParams.get('materialId') ?? '';

  const [movementType, setMovementType] = useState<MovementType>(initialType);
  const [selectedCategory, setSelectedCategory] = useState<Material['category'] | ''>('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(initialMaterialId);
  const [materialQuery, setMaterialQuery] = useState('');
  const [showMaterialSuggestions, setShowMaterialSuggestions] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [error, setError] = useState('');
  const hasPrefilledFromUrl = useRef(false);

  const recentMovements = getRecentMovements(movements, 5);

  const availableMaterials = useMemo(
    () => materials.filter((m) => m.active && (movementType === 'IN' || m.quantity > 0)),
    [materials, movementType],
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set(availableMaterials.map((m) => m.category))).sort((a, b) => a.localeCompare(b)),
    [availableMaterials],
  );

  const categorySuggestions = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) return categoryOptions;

    return categoryOptions.filter((category) => category.toLowerCase().includes(query));
  }, [categoryOptions, categoryQuery]);

  const filteredMaterials = useMemo(
    () => availableMaterials.filter((m) => !selectedCategory || m.category === selectedCategory),
    [availableMaterials, selectedCategory],
  );

  const materialSuggestions = useMemo(() => {
    const query = materialQuery.trim().toLowerCase();
    const source = filteredMaterials;

    if (!query) return source.slice(0, 8);

    return source
      .filter((material) => (`${material.name} ${material.dimensions} ${material.unit}`).toLowerCase().includes(query))
      .slice(0, 8);
  }, [filteredMaterials, materialQuery]);

  const selectedMat = filteredMaterials.find((m) => String(m.id) === selectedMaterial);

  const loadData = useCallback(async () => {
    const [materialsData, movementsData] = await Promise.all([fetchMaterials(), fetchMovements()]);
    setMaterials(materialsData);
    setMovements(movementsData);

    if (!hasPrefilledFromUrl.current && initialMaterialId) {
      const materialFromUrl = materialsData.find((m) => String(m.id) === initialMaterialId);
      if (materialFromUrl) {
        setSelectedCategory(materialFromUrl.category);
        setCategoryQuery(materialFromUrl.category);
        setSelectedMaterial(String(materialFromUrl.id));
        setMaterialQuery(materialFromUrl.name);
      }
      hasPrefilledFromUrl.current = true;
    }
  }, [initialMaterialId]);

  useEffect(() => {
    const run = async () => {
      try {
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur chargement mouvements');
      }
    };

    run();
  }, [loadData]);

  // Pré-remplissage géré dans loadData (à partir de materialId URL)

  const updateQuantityWarning = (newQty: number) => {
    setShowWarning(
      selectedMat !== undefined && movementType === 'OUT' && newQty > selectedMat.quantity,
    );
  };

  const handleQuantityChange = (delta: number) => {
    const newVal = Math.max(1, quantity + delta);
    setQuantity(newVal);
    updateQuantityWarning(newVal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      setError('Choisis d’abord une catégorie.');
      return;
    }

    if (!selectedMaterial || !selectedMat) {
      setError('Choisis une matière valide dans les propositions.');
      return;
    }

    if (selectedMat && movementType === 'OUT' && quantity > selectedMat.quantity) {
      setShowWarning(true);
      return;
    }

    try {
      setError('');
      await createMovement({
        materialId: selectedMaterial,
        type: movementType,
        quantity,
        note: reason,
      });

      await loadData();
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedMaterial('');
        setMaterialQuery('');
        setQuantity(1);
        setReason('');
      }, SUCCESS_DISPLAY_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement du mouvement');
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Mouvements de Stock</h2>
        <p>Enregistrez les entrées et sorties de matières premières</p>
      </div>

      {error && <div className="warning-msg">{error}</div>}

      <div className="two-columns">
        {/* Formulaire */}
        <div className="card">
          <h3 className="card-title card-title-spaced">Enregistrer un Mouvement</h3>

          <div className="toggle-tabs">
            <button
              className={`toggle-tab ${movementType === 'IN' ? 'active-in' : ''}`}
              onClick={() => {
                setMovementType('IN');
                setSelectedMaterial('');
                setMaterialQuery('');
                setShowWarning(false);
              }}
            >
              ↑ ENTRÉE
            </button>
            <button
              className={`toggle-tab ${movementType === 'OUT' ? 'active-out' : ''}`}
              onClick={() => {
                setMovementType('OUT');
                setSelectedMaterial('');
                setMaterialQuery('');
                setShowWarning(false);
              }}
            >
              ↓ SORTIE
            </button>
          </div>

          {submitted && (
            <div className="success-msg">
              Mouvement enregistré avec succès !
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group material-search-wrap">
              <label>Catégorie <span className="required">*</span></label>
              <input
                type="text"
                value={categoryQuery}
                placeholder="Commence à écrire une catégorie..."
                onChange={(e) => {
                  setCategoryQuery(e.target.value);
                  setSelectedCategory('');
                  setSelectedMaterial('');
                  setMaterialQuery('');
                  setShowCategorySuggestions(true);
                  setShowMaterialSuggestions(false);
                  setShowWarning(false);
                }}
                onFocus={() => setShowCategorySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 120)}
                autoComplete="off"
                required
              />

              {showCategorySuggestions && (
                <div className="material-suggestions">
                  {categorySuggestions.length > 0 ? (
                    categorySuggestions.map((category) => (
                      <button
                        type="button"
                        key={category}
                        className="material-suggestion-item"
                        onMouseDown={() => {
                          setSelectedCategory(category as Material['category']);
                          setCategoryQuery(category);
                          setSelectedMaterial('');
                          setMaterialQuery('');
                          setShowCategorySuggestions(false);
                          setShowWarning(false);
                        }}
                      >
                        {category}
                      </button>
                    ))
                  ) : (
                    <div className="material-suggestion-empty">Aucune catégorie trouvée.</div>
                  )}
                </div>
              )}

              {movementType === 'OUT' && (
                <span className="form-hint">En sortie, seules les matières avec stock disponible sont affichées.</span>
              )}
            </div>

            <div className="form-group material-search-wrap">
              <label>Matière <span className="required">*</span></label>
              <input
                type="text"
                value={materialQuery}
                placeholder={selectedCategory ? 'Commence à écrire une matière...' : 'Choisis d’abord une catégorie'}
                onChange={(e) => {
                  setMaterialQuery(e.target.value);
                  setSelectedMaterial('');
                  setShowMaterialSuggestions(true);
                  setShowWarning(false);
                }}
                onFocus={() => setShowMaterialSuggestions(true)}
                onBlur={() => setTimeout(() => setShowMaterialSuggestions(false), 120)}
                disabled={!selectedCategory}
                autoComplete="off"
                required
              />

              {showMaterialSuggestions && selectedCategory && (
                <div className="material-suggestions">
                  {materialSuggestions.length > 0 ? (
                    materialSuggestions.map((material) => (
                      <button
                        type="button"
                        key={material.id}
                        className="material-suggestion-item"
                        onMouseDown={() => {
                          setSelectedMaterial(String(material.id));
                          setMaterialQuery(material.name);
                          setShowMaterialSuggestions(false);
                          setShowWarning(false);
                        }}
                      >
                        {materialOptionLabel(material)}
                      </button>
                    ))
                  ) : (
                    <div className="material-suggestion-empty">Aucune matière trouvée.</div>
                  )}
                </div>
              )}

              {!!selectedCategory && (
                <span className="form-hint">{filteredMaterials.length} matière(s) disponible(s) dans cette catégorie.</span>
              )}
            </div>

            <div className="form-group">
              <label>Quantité <span className="required">*</span></label>
              <div className="number-stepper">
                <button type="button" className="stepper-btn" onClick={() => handleQuantityChange(-1)}>−</button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const v = Math.max(1, Number(e.target.value));
                    setQuantity(v);
                    updateQuantityWarning(v);
                  }}
                  min={1}
                  required
                />
                <button type="button" className="stepper-btn" onClick={() => handleQuantityChange(1)}>+</button>
              </div>
              {selectedMat && (
                <span className="form-hint">{selectedMat.unit}</span>
              )}
            </div>

            {showWarning && (
              <div className="warning-msg">
                <AlertTriangle size={16} />
                Stock insuffisant ! Disponible: {selectedMat?.quantity} {selectedMat?.unit}
              </div>
            )}

            <div className="form-group">
              <label>Raison <span className="required">*</span></label>
              <textarea
                placeholder={movementType === 'IN'
                  ? 'Ex: Livraison fournisseur Métal+ — Commande #4521'
                  : 'Ex: Projet portail — Client Sawadogo'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={`btn btn-lg btn-full ${movementType === 'IN' ? 'btn-success' : 'btn-primary'}`}
            >
              {movementType === 'IN' ? "Confirmer l'Entrée" : 'Confirmer la Sortie'}
            </button>
          </form>
        </div>

        {/* Timeline des mouvements recents */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Mouvements Récents</h3>
          </div>

          {recentMovements.map((m) => (
            <div className="timeline-item" key={m.id}>
              <div className={`timeline-dot ${m.type === 'IN' ? 'in' : 'out'}`} />
              <div className="timeline-content">
                <span className="time">{formatDateTime(m.createdAt)}</span>
                <div className="material">{m.materialName}</div>
                <div className="details">
                  <span className={`tag ${m.type === 'IN' ? 'tag-in' : 'tag-out'}`}>
                    {m.type === 'IN' ? 'ENTRÉE' : 'SORTIE'}
                  </span>
                  <span>{m.quantity} unités</span>
                  <span>&bull; {m.userName}</span>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center mt-16">
            <Link to="/historique" className="link">
              Voir tout l'historique &rarr;
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
