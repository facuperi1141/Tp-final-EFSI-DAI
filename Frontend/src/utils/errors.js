// Convierte un error de Axios en un mensaje para mostrar.
// El backend responde los errores como { error: { code, message, details } }.
export function getErrorMessage(error, fallback = 'Algo salió mal. Probá de nuevo.') {
  if (!error.response) return 'No se pudo conectar con el servidor. Revisá tu conexión.';

  const apiError = error.response.data?.error;
  if (apiError?.details?.length) {
    return apiError.details.map((detail) => `${detail.field}: ${detail.message}`).join(' · ');
  }
  return apiError?.message || fallback;
}

export function getErrorCode(error) {
  return error.response?.data?.error?.code;
}
