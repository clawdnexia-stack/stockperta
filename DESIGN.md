# StockAtelier — Design System (v2 Mobile-First)

## Nouvelles Couleurs (CEAS Burkina)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--color-primary` | `#3DA349` | Vert principal (Header, Sidebar background) |
| `--color-primary-dark` | `#2E8B3A` | Vert foncé (Hovers, Bordures) |
| `--color-brown` | `#6B2D23` | Marron terre (Accents secondaires) |
| `--color-accent` | `#E8A020` | Or/Orange (Boutons d'action, Highlights) |
| `--color-accent-hover` | `#D4901A` | Or foncé (Hover boutons) |
| `--color-bg` | `#F8FAFC` | Fond de page (Gris très clair) |
| `--color-card` | `#FFFFFF` | Fond des cartes |
| `--color-text` | `#1E293B` | Texte principal |
| `--color-text-muted` | `#64748B` | Texte secondaire |

## Typographie

- **Font Family** : `'Inter', sans-serif`
- **Headings** : Bold weights (`700`), letter-spacing réduit
- **Body** : Regular (`400`) et Medium (`500`)
- **Taille de base** : `16px` (lisibilité mobile)

## Layout Mobile-first

- **Mobile (< 1024px)** :
  - Header fixe (`56px`) avec Hamburger Menu
  - Sidebar en Overlay (Slide-in)
  - Grilles en 1 colonne (`grid-template-columns: 1fr`)
  - Padding réduit (`16px`)

- **Desktop (≥ 1024px)** :
  - Sidebar latérale fixe (`280px`)
  - Grilles étendues (2, 3 ou 4 colonnes)
  - Padding confortable (`32px`)

## Composants

### Boutons

- **Style Flat** (plus de dégradés)
- **Hauteur** : `44px` (touch target minimum)
- **Radius** : `8px`

### Sidebar (Responsive)

- **Mobile** : Masquée par défaut, s'ouvre avec un bouton menu, fond Vert `#3DA349`
- **Desktop** : Toujours visible, largeur `280px`

### Cards

- **Fond blanc**, ombre légère (`box-shadow`), bordure fine
- **Hover** : Elévation et bordure colorée

### Alertes & Badges

- **Succès** : Vert `#22C55E`
- **Attention** : Orange `#F59E0B`
- **Danger** : Rouge `#EF4444`
