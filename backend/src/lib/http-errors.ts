import { Response } from 'express';

export type ErrorDetails = unknown;

function sendError(res: Response, status: number, message: string, errors?: ErrorDetails) {
  if (errors === undefined) {
    return res.status(status).json({ message });
  }

  return res.status(status).json({ message, errors });
}

export function badRequest(res: Response, message: string, errors?: ErrorDetails) {
  return sendError(res, 400, message, errors);
}

export function unauthorized(res: Response, message: string) {
  return sendError(res, 401, message);
}

export function forbidden(res: Response, message: string) {
  return sendError(res, 403, message);
}

export function notFound(res: Response, message: string) {
  return sendError(res, 404, message);
}

export function conflict(res: Response, message: string) {
  return sendError(res, 409, message);
}
