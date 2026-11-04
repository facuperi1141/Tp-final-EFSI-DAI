import { HttpError } from '../utils/HttpError.js';

// Errores de Postgres que en realidad son culpa del dato que mandó el cliente
const PG_ERRORS = {
  23505: { status: 409, code: 'CONFLICT', message: 'El recurso ya existe' },
  23503: { status: 400, code: 'INVALID_REFERENCE', message: 'Referencia inválida' },
  23514: { status: 400, code: 'VALIDATION_ERROR', message: 'Un valor no cumple las reglas' },
  '22P02': { status: 400, code: 'VALIDATION_ERROR', message: 'Formato de dato inválido' },
  22001: { status: 400, code: 'VALIDATION_ERROR', message: 'Un campo supera el largo permitido' },
};

// Express reconoce el manejador de errores por tener 4 parámetros
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Si la respuesta ya empezó a mandarse no se puede cambiar: lo resuelve Express
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'El cuerpo no es un JSON válido' },
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'El cuerpo es demasiado grande' },
    });
  }

  const pgError = PG_ERRORS[err.code];
  if (pgError) {
    return res.status(pgError.status).json({
      error: { code: pgError.code, message: pgError.message },
    });
  }

  // Error nuestro: se loguea completo pero al cliente no le llega el detalle interno
  console.error(err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
  });
}
