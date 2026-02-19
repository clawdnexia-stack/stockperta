import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Boxes, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CreateMaterialInput } from '../lib/api';
import {
  ApiError,
  createMaterial,
  deleteMaterial,
  fetchMaterials,
  getStoredUser,
  updateMaterial,
} from '../lib/api';
import type { Material, MaterialCategory } from '../types';
import { getStockStatus, getStockStatusLabel } from '../utils/stock';

const CATEGORIES: Array<{ key: MaterialCategory; description: string }> = [
  { key: 'Tubes', description: 'Tubes ronds, carrés et rectangulaires' },
  { key: 'Tôles', description: 'Acier, inox, galvanisée - formats atelier' },
  { key: 'Profilés', description: 'Cornières, UPN et autres profils' },
  { key: 'Fers pleins', description: 'Ronds, carrés, plats' },
  { key: 'Divers', description: 'Matériaux hors catégories standards' },
  { key: 'Consommables', description: 'Disques, baguettes, pinceaux, rouleaux' },
  { key: 'Peinture & Diluants', description: 'Boîtes en kg et bidons en litres' },
];

const SHAPE_OPTIONS = {
  tubes: ['Rond', 'Carré', 'Rectangulaire', 'Autre'],
  fers: ['Rond', 'Carré', 'Plat', 'Autre'],
};

const SUBTYPE_OPTIONS = {
  profiles: ['Cornière', 'UPN', 'IPN', 'Tube profilé', 'Autre'],
  divers: ['Grille', 'Treillis', 'Autre'],
  consommables: ['Baguettes', 'Disque à couper', 'Disque à meuler', 'Disque à poncer', 'Pinceau', 'Rouleau', 'Autre'],
  paint: ['Peinture', 'Diluant', 'Autre'],
};

interface FormState {
  category: MaterialCategory;
  subType: string;
  materialKind: string;
  shapeType: string;
  dimAmm: string;
  dimBmm: string;
  thicknessMm: string;
  sheetFormat: 'FEUILLE_2X1' | 'FEUILLE_244X122' | 'FEUILLE_CUSTOM';
  sheetWidthMm: string;
  sheetHeightMm: string;
  quantity: string;
  alertThreshold: string;
  unitType: CreateMaterialInput['unitType'];
  unitVariant: string;
  specText: string;
  packageSize: string;
  packageUnit: string;
}

function initialForm(category: MaterialCategory): FormState {
  if (category === 'Tôles') {
    return {
      category,
      subType: 'Tôle',
      materialKind: 'Acier',
      shapeType: '',
      dimAmm: '',
      dimBmm: '',
      thicknessMm: '',
      sheetFormat: 'FEUILLE_2X1',
      sheetWidthMm: '',
      sheetHeightMm: '',
      quantity: '0',
      alertThreshold: '5',
      unitType: 'FEUILLE',
      unitVariant: 'FEUILLE_2X1',
      specText: '',
      packageSize: '',
      packageUnit: '',
    };
  }

  if (category === 'Divers') {
    return {
      category,
      subType: 'Grille',
      materialKind: '',
      shapeType: '',
      dimAmm: '',
      dimBmm: '',
      thicknessMm: '',
      sheetFormat: 'FEUILLE_2X1',
      sheetWidthMm: '',
      sheetHeightMm: '',
      quantity: '0',
      alertThreshold: '3',
      unitType: 'PIECE',
      unitVariant: '',
      specText: '',
      packageSize: '',
      packageUnit: '',
    };
  }

  if (category === 'Consommables') {
    return {
      category,
      subType: 'Baguettes',
      materialKind: '',
      shapeType: '',
      dimAmm: '',
      dimBmm: '',
      thicknessMm: '',
      sheetFormat: 'FEUILLE_2X1',
      sheetWidthMm: '',
      sheetHeightMm: '',
      quantity: '0',
      alertThreshold: '10',
      unitType: 'PIECE',
      unitVariant: '',
      specText: '',
      packageSize: '',
      packageUnit: '',
    };
  }

  if (category === 'Peinture & Diluants') {
    return {
      category,
      subType: 'Peinture',
      materialKind: '',
      shapeType: '',
      dimAmm: '',
      dimBmm: '',
      thicknessMm: '',
      sheetFormat: 'FEUILLE_2X1',
      sheetWidthMm: '',
      sheetHeightMm: '',
      quantity: '0',
      alertThreshold: '5',
      unitType: 'BOITE',
      unitVariant: '',
      specText: '',
      packageSize: '1',
      packageUnit: 'kg',
    };
  }

  const defaultSubType = category === 'Profilés' ? 'Cornière' : category === 'Tubes' ? 'Tube' : 'Fer plein';

  return {
    category,
    subType: defaultSubType,
    materialKind: 'Acier',
    shapeType: category === 'Tubes' ? 'Rond' : category === 'Fers pleins' ? 'Rond' : '',
    dimAmm: '',
    dimBmm: '',
    thicknessMm: '',
    sheetFormat: 'FEUILLE_2X1',
    sheetWidthMm: '',
    sheetHeightMm: '',
    quantity: '0',
    alertThreshold: '5',
    unitType: 'BARRE',
    unitVariant: 'BARRE_6M',
    specText: '',
    packageSize: '',
    packageUnit: '',
  };
}

function numberOrUndefined(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

function previewName(form: FormState): string {
  const material = form.materialKind.trim();
  const subType = form.subType.trim();
  const shape = form.shapeType.trim().toLowerCase();
  const dimA = numberOrUndefined(form.dimAmm);
  const dimB = numberOrUndefined(form.dimBmm);
  const thickness = numberOrUndefined(form.thicknessMm);

  if (form.category === 'Tubes') {
    const dims = shape.includes('rond')
      ? `Ø${dimA ?? '?'} x ${thickness ?? '?'} mm`
      : shape.includes('carr')
        ? `${dimA ?? '?'} x ${dimA ?? '?'} x ${thickness ?? '?'} mm`
        : `${dimA ?? '?'} x ${dimB ?? '?'} x ${thickness ?? '?'} mm`;
    return `Tube ${form.shapeType} ${material} ${dims}`.replace(/\s+/g, ' ').trim();
  }

  if (form.category === 'Tôles') {
    return `Tôle ${material} ${thickness ?? '?'} mm`.replace(/\s+/g, ' ').trim();
  }

  if (form.category === 'Profilés') {
    return `Profilé ${subType} ${material} ${dimA ?? '?'} x ${dimB ?? '?'} x ${thickness ?? '?'} mm`
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (form.category === 'Fers pleins') {
    if (shape.includes('rond')) return `Fer plein rond ${material} Ø${dimA ?? '?'} mm`;
    if (shape.includes('carr')) return `Fer plein carré ${material} ${dimA ?? '?'} mm`;
    if (shape.includes('plat')) return `Fer plat ${material} ${dimA ?? '?'} x ${thickness ?? '?'} mm`;
  }

  if (form.category === 'Peinture & Diluants') {
    return `${subType} ${form.specText} ${form.packageSize || '?'} ${form.packageUnit || ''}`.replace(/\s+/g, ' ').trim();
  }

  return `${subType || form.category} ${form.specText}`.replace(/\s+/g, ' ').trim();
}

function validateForm(form: FormState): string | null {
  const dimA = numberOrUndefined(form.dimAmm);
  const dimB = numberOrUndefined(form.dimBmm);
  const thickness = numberOrUndefined(form.thicknessMm);

  if (['Tubes', 'Profilés', 'Fers pleins'].includes(form.category)) {
    if (!['BARRE_6M', 'BARRE_12M'].includes(form.unitVariant)) {
      return 'Choisis 6 m ou 12 m pour cette référence.';
    }
  }

  if (form.category === 'Tubes') {
    if (!form.materialKind.trim()) return 'Choisis la matière du tube.';
    if (!form.shapeType.trim()) return 'Choisis le type de tube.';
    if (!dimA) return 'Dimension principale obligatoire pour le tube.';
    if (form.shapeType !== 'Rond' && form.shapeType !== 'Carré' && !dimB) {
      return 'Deux dimensions sont nécessaires pour ce tube.';
    }
    if (!thickness) return 'Épaisseur obligatoire pour les tubes.';
  }

  if (form.category === 'Tôles') {
    if (!form.materialKind.trim()) return 'Choisis la matière de la tôle.';
    if (!thickness) return 'Épaisseur obligatoire pour les tôles.';
    if (form.sheetFormat === 'FEUILLE_CUSTOM' && (!numberOrUndefined(form.sheetWidthMm) || !numberOrUndefined(form.sheetHeightMm))) {
      return 'Le format personnalisé de tôle nécessite largeur et hauteur.';
    }
  }

  if (form.category === 'Profilés') {
    if (!form.subType.trim()) return 'Choisis la famille de profilé.';
    if (!form.materialKind.trim()) return 'Choisis la matière du profilé.';
    if (!dimA || !dimB || !thickness) return 'Dimensions et épaisseur sont obligatoires pour les profilés.';
  }

  if (form.category === 'Fers pleins') {
    if (!form.shapeType.trim()) return 'Choisis le type de fer plein.';
    if (!form.materialKind.trim()) return 'Choisis la matière du fer plein.';
    if (!dimA) return 'Dimension obligatoire pour ce fer plein.';
    if (form.shapeType === 'Plat' && !thickness) return 'Épaisseur obligatoire pour un fer plat.';
  }

  if (form.category === 'Peinture & Diluants') {
    if (!form.subType.trim()) return 'Choisis peinture ou diluant.';
    if (!numberOrUndefined(form.packageSize)) return 'Le conditionnement est obligatoire.';
  }

  return null;
}

function buildPayload(form: FormState): CreateMaterialInput {
  const dimA = numberOrUndefined(form.dimAmm);
  const dimB = numberOrUndefined(form.dimBmm);
  const thickness = numberOrUndefined(form.thicknessMm);

  let unitType = form.unitType;
  let unitVariant = form.unitVariant || undefined;
  let packageUnit = form.packageUnit || undefined;

  if (form.category === 'Tôles') {
    unitType = 'FEUILLE';
    unitVariant = form.sheetFormat;
  }

  if (form.category === 'Divers' || form.category === 'Consommables') {
    unitVariant = undefined;
  }

  if (form.category === 'Peinture & Diluants') {
    if (form.subType === 'Peinture') {
      unitType = 'BOITE';
      packageUnit = 'kg';
    } else if (form.subType === 'Diluant') {
      unitType = 'BIDON';
      packageUnit = 'L';
    }
    unitVariant = undefined;
  }

  return {
    category: form.category,
    subType: form.subType || undefined,
    materialKind: form.materialKind || undefined,
    shapeType: form.shapeType || undefined,
    dimAmm: dimA,
    dimBmm: dimB,
    thicknessMm: thickness,
    sheetWidthMm: form.sheetFormat === 'FEUILLE_CUSTOM' ? numberOrUndefined(form.sheetWidthMm) : undefined,
    sheetHeightMm: form.sheetFormat === 'FEUILLE_CUSTOM' ? numberOrUndefined(form.sheetHeightMm) : undefined,
    packageSize: numberOrUndefined(form.packageSize),
    packageUnit,
    specText: form.specText || undefined,
    unitType,
    unitVariant,
    quantity: Math.max(0, Number(form.quantity) || 0),
    alertThreshold: Math.max(0, Number(form.alertThreshold) || 0),
  };
}

export default function CataloguePage() {
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === 'admin';

  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<Material['id'] | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [duplicateMaterialId, setDuplicateMaterialId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMaterials(isAdmin && includeInactive);
        setMaterials(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur chargement catalogue');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isAdmin, includeInactive]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<MaterialCategory, number>();
    CATEGORIES.forEach((item) => counts.set(item.key, 0));

    materials.filter((m) => m.active).forEach((material) => {
      counts.set(material.category, (counts.get(material.category) ?? 0) + 1);
    });

    return counts;
  }, [materials]);

  const categoryMaterials = useMemo(() => {
    if (!selectedCategory) return [];
    const query = searchQuery.toLowerCase();

    return materials
      .filter((material) => (includeInactive || material.active) && material.category === selectedCategory)
      .filter((material) => {
        if (!query) return true;
        return [material.name, material.subType, material.materialKind, material.dimensions]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      });
  }, [materials, searchQuery, selectedCategory, includeInactive]);

  const groupedMaterials = useMemo(() => {
    const groups = new Map<string, Map<string, Material[]>>();

    categoryMaterials.forEach((material) => {
      const level1 = material.materialKind || 'Autre matière';
      const level2 = material.subType || material.shapeType || 'Autre type';

      if (!groups.has(level1)) {
        groups.set(level1, new Map<string, Material[]>());
      }

      const level2Group = groups.get(level1)!;
      if (!level2Group.has(level2)) {
        level2Group.set(level2, []);
      }

      level2Group.get(level2)!.push(material);
    });

    return Array.from(groups.entries()).map(([materialKind, typeGroup]) => ({
      materialKind,
      types: Array.from(typeGroup.entries()).map(([type, refs]) => ({
        type,
        refs: refs.sort((a, b) => a.name.localeCompare(b.name)),
      })),
    }));
  }, [categoryMaterials]);

  const openCreate = () => {
    if (!isAdmin) return;
    if (!selectedCategory) return;
    setEditingMaterialId(null);
    setForm(initialForm(selectedCategory));
    setIsCreating(true);
    setError('');
    setSuccess('');
    setDuplicateMaterialId(null);
  };

  const closeCreate = () => {
    setIsCreating(false);
    setEditingMaterialId(null);
    setForm(null);
  };

  const materialToForm = (material: Material): FormState => {
    const base = initialForm(material.category);

    const unitType = material.unitType ?? base.unitType;
    const unitVariant = material.unitVariant ?? base.unitVariant;

    const sheetFormat = material.category === 'Tôles'
      ? ((material.unitVariant as FormState['sheetFormat']) ?? base.sheetFormat)
      : base.sheetFormat;

    return {
      ...base,
      category: material.category,
      subType: material.subType ?? base.subType,
      materialKind: material.materialKind ?? base.materialKind,
      shapeType: material.shapeType ?? base.shapeType,
      dimAmm: material.dimAmm ? String(material.dimAmm) : '',
      dimBmm: material.dimBmm ? String(material.dimBmm) : '',
      thicknessMm: material.thicknessMm ? String(material.thicknessMm) : '',
      sheetFormat,
      sheetWidthMm: material.sheetWidthMm ? String(material.sheetWidthMm) : '',
      sheetHeightMm: material.sheetHeightMm ? String(material.sheetHeightMm) : '',
      quantity: String(material.quantity ?? 0),
      alertThreshold: String(material.alertThreshold ?? 0),
      unitType,
      unitVariant: unitVariant ?? '',
      specText: material.specText ?? base.specText,
      packageSize: material.packageSize ? String(material.packageSize) : base.packageSize,
      packageUnit: material.packageUnit ?? base.packageUnit,
    };
  };

  const openEdit = (material: Material) => {
    if (!isAdmin) return;
    setSelectedCategory(material.category);
    setSearchQuery('');
    setEditingMaterialId(material.id);
    setForm(materialToForm(material));
    setIsCreating(true);
    setError('');
    setSuccess('');
    setDuplicateMaterialId(null);
  };

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => {
      if (!current) return current;
      const next = { ...current, [key]: value };

      if (key === 'sheetFormat') {
        next.unitType = 'FEUILLE';
        next.unitVariant = value as string;
      }

      if (key === 'subType' && current.category === 'Peinture & Diluants') {
        if (value === 'Peinture') {
          next.unitType = 'BOITE';
          next.packageUnit = 'kg';
        } else if (value === 'Diluant') {
          next.unitType = 'BIDON';
          next.packageUnit = 'L';
        }
      }

      return next;
    });
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;

    if (!isAdmin) {
      setError('Accès réservé aux administrateurs.');
      return;
    }

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const isEditing = editingMaterialId !== null;

    try {
      setError('');
      setSuccess('');
      setDuplicateMaterialId(null);

      const payload = buildPayload(form);

      if (isEditing) {
        const updated = await updateMaterial(editingMaterialId as string | number, payload);
        setMaterials((current) => current.map((m) => (String(m.id) === String(updated.id) ? updated : m)));
        setSuccess('Référence mise à jour.');
      } else {
        const created = await createMaterial(payload);
        setMaterials((current) => [created, ...current]);
        setSuccess('Référence créée avec succès.');
      }

      closeCreate();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const payload = err.payload as { existingMaterialId?: string } | undefined;
        setDuplicateMaterialId(payload?.existingMaterialId ?? null);
      }

      const fallback = isEditing ? 'Erreur mise à jour référence' : 'Erreur création référence';
      setError(err instanceof Error ? err.message : fallback);
    }
  };

  const handleToggleActive = async (material: Material, nextActive: boolean) => {
    if (!isAdmin) return;

    try {
      setError('');
      setSuccess('');

      const updated = await updateMaterial(material.id, { active: nextActive });
      setMaterials((current) => current.map((m) => (String(m.id) === String(updated.id) ? updated : m)));
      setSuccess(nextActive ? 'Référence réactivée.' : 'Référence archivée.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur mise à jour référence');
    }
  };

  const handleDelete = async (material: Material) => {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      `Supprimer définitivement "${material.name}" ?\n\n⚠️ Si cette référence a déjà des mouvements, la suppression sera refusée.`,
    );
    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');

      await deleteMaterial(material.id);
      setMaterials((current) => current.filter((m) => String(m.id) !== String(material.id)));
      setSuccess('Référence supprimée.');

      if (editingMaterialId !== null && String(editingMaterialId) === String(material.id)) {
        closeCreate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur suppression référence');
    }
  };

  if (isLoading) {
    return <div className="card text-center">Chargement du catalogue...</div>;
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>Catalogue simplifié</h2>
            <p>Navigation par catégories puis création guidée des références.</p>
          </div>

          {selectedCategory && (
            <div className="page-header-actions">
              <button className="btn btn-outline" onClick={() => { setSelectedCategory(null); setSearchQuery(''); closeCreate(); }}>
                <ArrowLeft size={16} />
                Retour catégories
              </button>
              {isAdmin && (
                <button className="btn btn-primary" onClick={openCreate}>
                  <Plus size={16} />
                  Ajouter une référence
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <div className="warning-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {duplicateMaterialId && (
        <div className="warning-msg">
          Cette référence existe déjà.{' '}
          <Link to={`/mouvements?type=in&materialId=${duplicateMaterialId}`} className="link">Augmenter le stock</Link>
        </div>
      )}

      {!selectedCategory && (
        <div className="catalogue-category-grid">
          {CATEGORIES.map((category) => (
            <button
              key={category.key}
              className="catalogue-category-card"
              onClick={() => {
                setSelectedCategory(category.key);
                setSearchQuery('');
                closeCreate();
              }}
            >
              <div className="catalogue-category-card-top">
                <div className="catalogue-category-icon"><Boxes size={18} /></div>
                <span className="tag">{categoryCounts.get(category.key) ?? 0} refs</span>
              </div>
              <h3>{category.key}</h3>
              <p>{category.description}</p>
            </button>
          ))}
        </div>
      )}

      {selectedCategory && (
        <>
          <div className="card card-spaced">
            <div className="filter-bar">
              <div className="filter-group filter-group-grow">
                <label className="filter-label">Rechercher dans {selectedCategory}</label>
                <div className="search-input">
                  <Search />
                  <input
                    type="text"
                    placeholder="Nom, matière, type, dimensions..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="filter-group">
                  <label className="filter-label">&nbsp;</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includeInactive}
                      onChange={(e) => setIncludeInactive(e.target.checked)}
                    />
                    Inclure archivées
                  </label>
                </div>
              )}
            </div>
          </div>

          {isCreating && form && (
            <div className="card card-spaced">
              <h3 className="card-title card-title-spaced">
                {editingMaterialId ? 'Modifier la référence' : 'Nouvelle référence'} — {selectedCategory}
              </h3>

              <form onSubmit={handleCreate}>
                {(form.category === 'Tubes' || form.category === 'Profilés' || form.category === 'Fers pleins' || form.category === 'Tôles') && (
                  <div className="form-group">
                    <label>Matière</label>
                    <select value={form.materialKind} onChange={(event) => updateForm('materialKind', event.target.value)}>
                      <option>Acier</option>
                      <option>Inox</option>
                      <option>Galvanisée</option>
                      <option>Autre</option>
                    </select>
                  </div>
                )}

                {form.category === 'Tubes' && (
                  <>
                    <div className="form-group">
                      <label>Type de tube</label>
                      <select value={form.shapeType} onChange={(event) => updateForm('shapeType', event.target.value)}>
                        {SHAPE_OPTIONS.tubes.map((shape) => <option key={shape}>{shape}</option>)}
                      </select>
                    </div>
                    <div className="catalogue-form-grid">
                      <div className="form-group">
                        <label>{form.shapeType === 'Rond' ? 'Diamètre (mm)' : 'Dimension A (mm)'}</label>
                        <input type="number" min={1} value={form.dimAmm} onChange={(event) => updateForm('dimAmm', event.target.value)} />
                      </div>
                      {(form.shapeType !== 'Rond' && form.shapeType !== 'Carré') && (
                        <div className="form-group">
                          <label>Dimension B (mm)</label>
                          <input type="number" min={1} value={form.dimBmm} onChange={(event) => updateForm('dimBmm', event.target.value)} />
                        </div>
                      )}
                      <div className="form-group">
                        <label>Épaisseur (mm)</label>
                        <input type="number" min={1} value={form.thicknessMm} onChange={(event) => updateForm('thicknessMm', event.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {form.category === 'Tôles' && (
                  <>
                    <div className="form-group">
                      <label>Épaisseur (mm)</label>
                      <input type="number" min={1} value={form.thicknessMm} onChange={(event) => updateForm('thicknessMm', event.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Format de feuille</label>
                      <select value={form.sheetFormat} onChange={(event) => updateForm('sheetFormat', event.target.value as FormState['sheetFormat'])}>
                        <option value="FEUILLE_2X1">Petit format — 2 m x 1 m</option>
                        <option value="FEUILLE_244X122">Grand format — 2,44 m x 1,22 m</option>
                        <option value="FEUILLE_CUSTOM">Autre format</option>
                      </select>
                    </div>

                    {form.sheetFormat === 'FEUILLE_CUSTOM' && (
                      <div className="catalogue-form-grid">
                        <div className="form-group">
                          <label>Largeur (mm)</label>
                          <input type="number" min={1} value={form.sheetWidthMm} onChange={(event) => updateForm('sheetWidthMm', event.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Hauteur (mm)</label>
                          <input type="number" min={1} value={form.sheetHeightMm} onChange={(event) => updateForm('sheetHeightMm', event.target.value)} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {form.category === 'Profilés' && (
                  <>
                    <div className="form-group">
                      <label>Famille de profilé</label>
                      <select value={form.subType} onChange={(event) => updateForm('subType', event.target.value)}>
                        {SUBTYPE_OPTIONS.profiles.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </div>
                    <div className="catalogue-form-grid">
                      <div className="form-group">
                        <label>Dimension A (mm)</label>
                        <input type="number" min={1} value={form.dimAmm} onChange={(event) => updateForm('dimAmm', event.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Dimension B (mm)</label>
                        <input type="number" min={1} value={form.dimBmm} onChange={(event) => updateForm('dimBmm', event.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Épaisseur (mm)</label>
                        <input type="number" min={1} value={form.thicknessMm} onChange={(event) => updateForm('thicknessMm', event.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {form.category === 'Fers pleins' && (
                  <>
                    <div className="form-group">
                      <label>Type</label>
                      <select value={form.shapeType} onChange={(event) => updateForm('shapeType', event.target.value)}>
                        {SHAPE_OPTIONS.fers.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </div>
                    <div className="catalogue-form-grid">
                      <div className="form-group">
                        <label>{form.shapeType === 'Rond' ? 'Diamètre (mm)' : 'Dimension (mm)'}</label>
                        <input type="number" min={1} value={form.dimAmm} onChange={(event) => updateForm('dimAmm', event.target.value)} />
                      </div>
                      {form.shapeType === 'Plat' && (
                        <div className="form-group">
                          <label>Épaisseur (mm)</label>
                          <input type="number" min={1} value={form.thicknessMm} onChange={(event) => updateForm('thicknessMm', event.target.value)} />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {form.category === 'Divers' && (
                  <>
                    <div className="form-group">
                      <label>Type</label>
                      <select value={form.subType} onChange={(event) => updateForm('subType', event.target.value)}>
                        {SUBTYPE_OPTIONS.divers.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Unité</label>
                      <select value={form.unitType} onChange={(event) => updateForm('unitType', event.target.value as FormState['unitType'])}>
                        <option value="PIECE">Pièce</option>
                        <option value="PAQUET">Paquet</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Détail (optionnel)</label>
                      <input type="text" placeholder="Ex: maille 50x50" value={form.specText} onChange={(event) => updateForm('specText', event.target.value)} />
                    </div>
                  </>
                )}

                {form.category === 'Consommables' && (
                  <>
                    <div className="form-group">
                      <label>Type</label>
                      <select value={form.subType} onChange={(event) => updateForm('subType', event.target.value)}>
                        {SUBTYPE_OPTIONS.consommables.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Unité</label>
                      <select value={form.unitType} onChange={(event) => updateForm('unitType', event.target.value as FormState['unitType'])}>
                        <option value="PIECE">Pièce</option>
                        <option value="PAQUET">Paquet</option>
                      </select>
                    </div>
                    {(form.subType.includes('Disque')) && (
                      <div className="catalogue-form-grid">
                        <div className="form-group">
                          <label>Diamètre (mm)</label>
                          <input type="number" min={1} value={form.dimAmm} onChange={(event) => updateForm('dimAmm', event.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Grain / spécification</label>
                          <input type="text" placeholder="Ex: grain 80" value={form.specText} onChange={(event) => updateForm('specText', event.target.value)} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {form.category === 'Peinture & Diluants' && (
                  <>
                    <div className="form-group">
                      <label>Type</label>
                      <select value={form.subType} onChange={(event) => updateForm('subType', event.target.value)}>
                        {SUBTYPE_OPTIONS.paint.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </div>
                    <div className="catalogue-form-grid">
                      <div className="form-group">
                        <label>Spécification</label>
                        <input type="text" placeholder="Ex: Antirouille" value={form.specText} onChange={(event) => updateForm('specText', event.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Conditionnement</label>
                        <input type="number" min={0.1} step={0.1} value={form.packageSize} onChange={(event) => updateForm('packageSize', event.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Unité de conditionnement</label>
                        <input
                          type="text"
                          value={form.packageUnit}
                          onChange={(event) => updateForm('packageUnit', event.target.value)}
                          disabled={form.subType === 'Peinture' || form.subType === 'Diluant'}
                        />
                      </div>
                    </div>
                  </>
                )}

                {['Tubes', 'Profilés', 'Fers pleins'].includes(form.category) && (
                  <div className="form-group">
                    <label>Longueur de barre</label>
                    <select value={form.unitVariant} onChange={(event) => updateForm('unitVariant', event.target.value)}>
                      <option value="BARRE_6M">Barre 6 m</option>
                      <option value="BARRE_12M">Barre 12 m</option>
                    </select>
                  </div>
                )}

                <div className="catalogue-form-grid">
                  <div className="form-group">
                    <label>Stock initial</label>
                    <input type="number" min={0} value={form.quantity} onChange={(event) => updateForm('quantity', event.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Seuil d'alerte</label>
                    <input type="number" min={0} value={form.alertThreshold} onChange={(event) => updateForm('alertThreshold', event.target.value)} />
                  </div>
                </div>

                <div className="catalogue-preview-box">
                  <span className="filter-label">Nom généré automatiquement</span>
                  <strong>{previewName(form)}</strong>
                </div>

                <div className="page-header-actions">
                  <button type="button" className="btn btn-outline" onClick={closeCreate}>Annuler</button>
                  <button type="submit" className="btn btn-primary">
                    {editingMaterialId ? 'Enregistrer' : 'Créer la référence'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {groupedMaterials.length === 0 && (
            <div className="card empty-state">
              <p>Aucune référence trouvée dans cette catégorie.</p>
            </div>
          )}

          {groupedMaterials.map((materialGroup) => (
            <div className="card card-spaced" key={materialGroup.materialKind}>
              <h3 className="card-title">{materialGroup.materialKind}</h3>
              <div className="catalogue-group-stack">
                {materialGroup.types.map((typeGroup) => (
                  <div key={typeGroup.type} className="catalogue-subgroup">
                    <h4>{typeGroup.type}</h4>
                    <div className="catalogue-ref-list">
                      {typeGroup.refs.map((material) => {
                        const status = getStockStatus(material.quantity, material.alertThreshold);
                        return (
                          <div className="catalogue-ref-item" key={material.id}>
                            <div>
                              <p className="text-medium">
                                {material.name}{' '}
                                {!material.active && <span className="tag">archivée</span>}
                              </p>
                              <p className="text-sm text-muted">{material.dimensions} • unité: {material.unit}</p>
                            </div>
                            <div className="catalogue-ref-stock">
                              <strong>{material.quantity}</strong>
                              <span>{material.unit}</span>
                              <small className={status === 'critical' ? 'text-danger' : status === 'low' ? 'text-warning' : ''}>
                                {getStockStatusLabel(status)}
                              </small>

                              {isAdmin && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                  <button type="button" className="btn btn-outline" onClick={() => openEdit(material)}>
                                    Modifier
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => handleToggleActive(material, !material.active)}
                                  >
                                    {material.active ? 'Archiver' : 'Réactiver'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline text-danger"
                                    onClick={() => handleDelete(material)}
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
