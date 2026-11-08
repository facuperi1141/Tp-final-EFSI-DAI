import { LoaderCircle } from 'lucide-react';

export default function Loader({ text = 'Cargando…' }) {
  return (
    <div className="center">
      <LoaderCircle className="spin" /> {text}
    </div>
  );
}
