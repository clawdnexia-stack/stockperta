import type { Movement } from '../types';

const DATE_LOCALE = 'fr-FR';

/** Formate une date ISO en "dd/mm/yyyy" */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(DATE_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Formate une date ISO en "dd/mm/yyyy hh:mm" */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(DATE_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Retourne les N mouvements les plus recents, tries par date decroissante */
export function getRecentMovements(movements: Movement[], count = 10): Movement[] {
  return [...movements]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, count);
}
