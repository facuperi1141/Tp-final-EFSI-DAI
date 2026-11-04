import { HttpError } from '../utils/HttpError.js';

export function notFound(req, res, next) {
  next(HttpError.notFound(`No existe la ruta ${req.method} ${req.path}`));
}
