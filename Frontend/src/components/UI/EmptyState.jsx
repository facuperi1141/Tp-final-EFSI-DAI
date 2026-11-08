// Estado vacío: ícono, título, texto y (opcional) un botón o link como children
export default function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="empty">
      {Icon && <Icon />}
      <b>{title}</b>
      {text && <span>{text}</span>}
      {children}
    </div>
  );
}
