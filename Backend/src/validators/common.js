import { z } from 'zod';

// Mensajes de zod en castellano para todos los schemas
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case 'invalid_type':
      if (issue.received === 'undefined') return { message: 'Campo obligatorio' };
      return { message: `Se esperaba ${issue.expected}` };
    case 'too_small':
      if (issue.type === 'string') return { message: `Tiene que tener al menos ${issue.minimum} caracteres` };
      if (issue.type === 'array') return { message: `Tiene que tener al menos ${issue.minimum} elementos` };
      return { message: `Tiene que ser mayor o igual a ${issue.minimum}` };
    case 'too_big':
      if (issue.type === 'string') return { message: `No puede superar los ${issue.maximum} caracteres` };
      if (issue.type === 'array') return { message: `No puede tener más de ${issue.maximum} elementos` };
      return { message: `Tiene que ser menor o igual a ${issue.maximum}` };
    case 'invalid_string':
      if (issue.validation === 'email') return { message: 'Email inválido' };
      if (issue.validation === 'url') return { message: 'URL inválida' };
      return { message: 'Formato inválido' };
    case 'invalid_enum_value':
      return { message: `Valor inválido. Opciones: ${issue.options.join(', ')}` };
    case 'unrecognized_keys':
      return { message: `Campos no permitidos: ${issue.keys.join(', ')}` };
    default:
      return { message: ctx.defaultError };
  }
});

export const LIBRARY_STATUSES = ['quiero_escuchar', 'escuchando', 'escuchado', 'favorito'];
export const CONTENT_SOURCES = ['deezer', 'spotify'];
export const CONTENT_TYPES = ['track', 'album', 'artist'];

// Id numérico de la URL: "abc", "1.5" o "-3" dan 400 en vez de un 500 de Postgres
export const idSchema = z.coerce.number().int().positive().max(2147483647);

export const idParams = z.object({ id: idSchema });

export const httpUrl = z
  .string()
  .trim()
  .max(500)
  .url()
  .refine((value) => /^https?:\/\//i.test(value), 'La URL tiene que empezar con http o https');

// Texto opcional: "" se guarda como null
export const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value === '' ? null : value));

// Lo que manda el front sobre un contenido de la API externa.
// Se guarda en contents (caché) y se identifica por source + external_id.
export const contentInput = z.object({
  source: z.enum(CONTENT_SOURCES),
  // Deezer manda los ids como número: se aceptan número o texto y se guardan como texto.
  // (z.coerce.string() no sirve: convierte un campo faltante en el texto "undefined")
  external_id: z.preprocess(
    (value) => (typeof value === 'number' ? String(value) : value),
    z.string().trim().min(1).max(64),
  ),
  type: z.enum(CONTENT_TYPES),
  title: z.string().trim().min(1).max(300),
  artist_name: optionalText(300),
  album_name: optionalText(300),
  cover_url: httpUrl.nullable().optional(),
  duration_ms: z.number().int().min(0).max(2147483647).nullable().optional(),
  release_year: z.number().int().min(1800).max(2100).nullable().optional(),
  genres: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

// Endpoints que aceptan un contenido nuevo (content) o uno ya guardado (content_id)
export const contentRef = {
  content: contentInput.optional(),
  content_id: idSchema.optional(),
};

export const requireContentRef = (data, ctx) => {
  if (!data.content && !data.content_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['content'], message: 'Mandá content o content_id' });
  }
};

export const paginationQuery = {
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
};
