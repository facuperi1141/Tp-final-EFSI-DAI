// Ayudas para armar los datos de los formularios antes de mandarlos al backend

// Saca los filtros vacíos: el backend no quiere recibir ?status=&q=
export function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined && value !== false),
  );
}

// Recorta los textos y convierte los vacíos en null (null es lo que borra el campo en la base)
export function normalizeValues(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (typeof value !== 'string') return [key, value];
      const trimmed = value.trim();
      return [key, trimmed === '' ? null : trimmed];
    }),
  );
}

// Devuelve solo los campos que cambiaron respecto al original (para los PATCH)
export function getChangedFields(original, values) {
  return Object.fromEntries(Object.entries(values).filter(([key, value]) => (original[key] ?? null) !== value));
}

export function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
