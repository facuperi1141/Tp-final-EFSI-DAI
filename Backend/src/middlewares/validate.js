import { HttpError } from '../utils/HttpError.js';

// validate({ body, query, params }) valida cada parte con su schema de zod.
// En Express 5 req.query es de solo lectura, así que los datos ya validados
// quedan todos en req.valid (body, query y params).
export function validate(schemas) {
  return (req, res, next) => {
    req.valid = {};
    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: issue.path.join('.') || part,
          message: issue.message,
        }));
        return next(HttpError.badRequest('Hay datos inválidos', details));
      }
      req.valid[part] = result.data;
    }
    next();
  };
}
