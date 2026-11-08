export default function PageHeader({ tag, title, subtitle, action }) {
  return (
    <div className="head">
      <div>
        <small className="eyebrow">{tag}</small>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
