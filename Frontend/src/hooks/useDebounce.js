import { useEffect, useState } from 'react';

// Devuelve el valor recién cuando dejó de cambiar durante `delay` ms.
// Sirve para no pegarle al backend con cada tecla del buscador.
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
