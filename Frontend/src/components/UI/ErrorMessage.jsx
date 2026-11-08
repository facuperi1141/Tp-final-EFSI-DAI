// Mensaje de error con botón opcional para reintentar
export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="error error-box" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="text-link" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
