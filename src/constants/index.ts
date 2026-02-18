import type { MaterialCategory } from '../types';

/** Onglets de filtre par categorie (avec "Tous" en premier) */
export const CATEGORY_FILTERS = [
  'Tous',
  'Tubes',
  'Tôles',
  'Profilés',
  'Fers pleins',
  'Divers',
  'Consommables',
  'Peinture & Diluants',
] as const;

/** Mapping categorie → classe CSS pour les badges de couleur */
export const CATEGORY_CSS_CLASS: Record<MaterialCategory, string> = {
  Tubes: 'tag-tubes',
  'Tôles': 'tag-toles',
  'Profilés': 'tag-profiles',
  'Fers pleins': 'tag-fers',
  Divers: 'tag-divers',
  Consommables: 'tag-consommables',
  'Peinture & Diluants': 'tag-peinture',
};

/** Nombre de lignes par page dans les tableaux pagines */
export const ITEMS_PER_PAGE = 10;
