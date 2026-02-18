import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  if (!('code' in error)) return null;

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

export function notFoundHandler(_req: Request, res: Response) {
  return res.status(404).json({ message: 'Route introuvable' });
}

export function errorHandler(error: unknown, _req: Request, res: Response, next: NextFunction) {
  void next;

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Données invalides',
      errors: error.flatten(),
    });
  }

  const code = getErrorCode(error);
  if (code === 'P2002') {
    return res.status(409).json({ message: 'Conflit: valeur déjà utilisée' });
  }

  if (code === 'P2025') {
    return res.status(404).json({ message: 'Ressource introuvable' });
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ message: 'JSON invalide' });
  }

  console.error('Unhandled API error:', error);

  return res.status(500).json({
    message: 'Erreur serveur interne',
    ...(env.NODE_ENV !== 'production' ? { details: String(error) } : {}),
  });
}
