// Error con status HTTP. El errorHandler lo convierte en { error: { code, message, details } }
export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Datos inválidos', details, code = 'VALIDATION_ERROR') {
    return new HttpError(400, code, message, details);
  }

  static unauthorized(message = 'No autenticado', code = 'UNAUTHORIZED') {
    return new HttpError(401, code, message);
  }

  static notFound(message = 'No encontrado') {
    return new HttpError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'El recurso ya existe', code = 'CONFLICT') {
    return new HttpError(409, code, message);
  }

  static badGateway(message = 'El servicio externo no respondió') {
    return new HttpError(502, 'EXTERNAL_API_ERROR', message);
  }
}
