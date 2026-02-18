/**
 * Donnees mock pour le developpement frontend.
 * A remplacer par des appels API vers le backend Node.js/Express.
 */
import type { Material, Movement, User } from '../types';

// ── Utilisateurs ──────────────────────────────────────────────

export const users: User[] = [
  { id: 1, name: 'Ouedraogo Stéphane A. K. W.', email: 'kderoued@gmail.com', role: 'admin', active: true, isOwner: true, isTeamLead: false },
  { id: 2, name: 'Ibrahim Ouédraogo', email: 'ibrahim@atelier.bf', role: 'user', active: true, isOwner: false, isTeamLead: true },
  { id: 3, name: 'Fatimata Diallo', email: 'fatimata@atelier.bf', role: 'user', active: true, isOwner: false, isTeamLead: false },
  { id: 4, name: 'Moussa Konaté', email: 'moussa@atelier.bf', role: 'user', active: true, isOwner: false, isTeamLead: false },
];

// ── Matieres premieres ────────────────────────────────────────

export const materials: Material[] = [
  { id: 1,  name: 'Tube Rond',           category: 'Tubes',     type: 'Rond',          dimensions: 'Ø50mm - Barre 6m',     unit: 'barres',   quantity: 12, alertThreshold: 5, active: true },
  { id: 2,  name: 'Tube Carré',          category: 'Tubes',     type: 'Carré',         dimensions: '40x40mm - Barre 6m',   unit: 'barres',   quantity: 8,  alertThreshold: 5, active: true },
  { id: 3,  name: 'Tube Rectangulaire',  category: 'Tubes',     type: 'Rectangulaire', dimensions: '60x40mm - Barre 6m',   unit: 'barres',   quantity: 3,  alertThreshold: 5, active: true },
  { id: 4,  name: 'Tube Rond Inox',      category: 'Tubes',     type: 'Rond',          dimensions: 'Ø25mm - Barre 6m',     unit: 'barres',   quantity: 15, alertThreshold: 5, active: true },
  { id: 5,  name: 'Tôle Plate',          category: 'Tôles',     type: 'Plate',         dimensions: '2mm - Grand format',    unit: 'feuilles', quantity: 6,  alertThreshold: 5, active: true },
  { id: 6,  name: 'Tôle Striée',         category: 'Tôles',     type: 'Striée',        dimensions: '3mm - Grand format',    unit: 'feuilles', quantity: 0,  alertThreshold: 5, active: true },
  { id: 7,  name: 'Tôle Perforée',       category: 'Tôles',     type: 'Perforée',      dimensions: '2mm - Petit format',    unit: 'feuilles', quantity: 4,  alertThreshold: 5, active: true },
  { id: 8,  name: 'Tôle Galvanisée',     category: 'Tôles',     type: 'Galvanisée',    dimensions: '1.5mm - Grand format',  unit: 'feuilles', quantity: 9,  alertThreshold: 5, active: true },
  { id: 9,  name: 'Cornière',            category: 'Profilés',  type: 'Cornière',      dimensions: '40x40mm - Barre 6m',   unit: 'barres',   quantity: 7,  alertThreshold: 5, active: true },
  { id: 10, name: 'IPN 100',             category: 'Profilés',  type: 'IPN',           dimensions: 'IPN 100 - Barre 6m',   unit: 'barres',   quantity: 2,  alertThreshold: 5, active: true },
  { id: 11, name: 'UPN 80',              category: 'Profilés',  type: 'UPN',           dimensions: 'UPN 80 - Barre 6m',    unit: 'barres',   quantity: 0,  alertThreshold: 5, active: true },
  { id: 12, name: 'Électrodes Rutile',   category: 'Consommables', type: 'Électrode',     dimensions: 'Ø2.5mm',               unit: 'paquets',  quantity: 14, alertThreshold: 5, active: true },
  { id: 13, name: 'Électrodes Basiques', category: 'Consommables', type: 'Électrode',     dimensions: 'Ø3.2mm',               unit: 'paquets',  quantity: 1,  alertThreshold: 5, active: true },
  { id: 14, name: 'Fil MIG/MAG',         category: 'Consommables', type: 'Fil',           dimensions: 'Ø0.8mm - Bobine 15kg', unit: 'bobines',  quantity: 5,  alertThreshold: 3, active: true },
  { id: 15, name: 'Fil Fourré Inox',     category: 'Consommables', type: 'Fil',           dimensions: 'Ø1.2mm - Bobine 5kg',  unit: 'bobines',  quantity: 0,  alertThreshold: 3, active: true },
];

// ── Mouvements de stock ───────────────────────────────────────

export const movements: Movement[] = [
  { id: 1,  materialId: 1,  materialName: 'Tube Rond Ø50mm',           userId: 2, userName: 'Ibrahim Ouédraogo', type: 'OUT', quantity: 3,  stockAfter: 12, reason: 'Projet portail client Sawadogo',        createdAt: '2026-02-17T14:30:00' },
  { id: 2,  materialId: 5,  materialName: 'Tôle Plate 2mm',            userId: 3, userName: 'Fatimata Diallo',   type: 'IN',  quantity: 10, stockAfter: 6,  reason: 'Livraison fournisseur Métal+',          createdAt: '2026-02-17T11:15:00' },
  { id: 3,  materialId: 12, materialName: 'Électrodes Rutile Ø2.5mm',  userId: 4, userName: 'Moussa Konaté',     type: 'OUT', quantity: 2,  stockAfter: 14, reason: 'Chantier entrepôt zone ZACA',           createdAt: '2026-02-17T09:45:00' },
  { id: 4,  materialId: 9,  materialName: 'Cornière 40x40mm',          userId: 2, userName: 'Ibrahim Ouédraogo', type: 'OUT', quantity: 4,  stockAfter: 7,  reason: 'Fabrication chassis véhicule',           createdAt: '2026-02-16T16:20:00' },
  { id: 5,  materialId: 2,  materialName: 'Tube Carré 40x40mm',        userId: 3, userName: 'Fatimata Diallo',   type: 'IN',  quantity: 20, stockAfter: 8,  reason: 'Commande mensuelle - Grossiste Ouaga',  createdAt: '2026-02-16T14:00:00' },
  { id: 6,  materialId: 6,  materialName: 'Tôle Striée 3mm',           userId: 4, userName: 'Moussa Konaté',     type: 'OUT', quantity: 2,  stockAfter: 0,  reason: 'Escalier métallique villa Koudougou',   createdAt: '2026-02-16T10:30:00' },
  { id: 7,  materialId: 14, materialName: 'Fil MIG/MAG Ø0.8mm',        userId: 2, userName: 'Ibrahim Ouédraogo', type: 'IN',  quantity: 5,  stockAfter: 5,  reason: 'Réapprovisionnement urgent',            createdAt: '2026-02-15T15:45:00' },
  { id: 8,  materialId: 10, materialName: 'IPN 100',                    userId: 3, userName: 'Fatimata Diallo',   type: 'OUT', quantity: 1,  stockAfter: 2,  reason: 'Charpente hangar agricole',             createdAt: '2026-02-15T11:20:00' },
  { id: 9,  materialId: 3,  materialName: 'Tube Rectangulaire 60x40mm', userId: 4, userName: 'Moussa Konaté',     type: 'OUT', quantity: 5,  stockAfter: 3,  reason: 'Grilles fenêtres lot 12 unités',        createdAt: '2026-02-15T09:00:00' },
  { id: 10, materialId: 13, materialName: 'Électrodes Basiques Ø3.2mm', userId: 2, userName: 'Ibrahim Ouédraogo', type: 'OUT', quantity: 3,  stockAfter: 1,  reason: 'Soudure haute résistance pont roulant', createdAt: '2026-02-14T16:30:00' },
  { id: 11, materialId: 7,  materialName: 'Tôle Perforée 2mm',          userId: 3, userName: 'Fatimata Diallo',   type: 'IN',  quantity: 8,  stockAfter: 4,  reason: 'Livraison spéciale SOMETA',             createdAt: '2026-02-14T13:00:00' },
  { id: 12, materialId: 11, materialName: 'UPN 80',                     userId: 4, userName: 'Moussa Konaté',     type: 'OUT', quantity: 3,  stockAfter: 0,  reason: 'Structure bâtiment industriel',          createdAt: '2026-02-14T10:15:00' },
  { id: 13, materialId: 8,  materialName: 'Tôle Galvanisée 1.5mm',      userId: 2, userName: 'Ibrahim Ouédraogo', type: 'IN',  quantity: 15, stockAfter: 9,  reason: 'Commande couverture toiture',           createdAt: '2026-02-13T14:45:00' },
  { id: 14, materialId: 4,  materialName: 'Tube Rond Inox Ø25mm',       userId: 3, userName: 'Fatimata Diallo',   type: 'IN',  quantity: 10, stockAfter: 15, reason: 'Stock rampes escalier inox',            createdAt: '2026-02-13T11:30:00' },
  { id: 15, materialId: 15, materialName: 'Fil Fourré Inox Ø1.2mm',     userId: 4, userName: 'Moussa Konaté',     type: 'OUT', quantity: 2,  stockAfter: 0,  reason: 'Soudure inox cuve alimentaire',         createdAt: '2026-02-13T08:50:00' },
];
