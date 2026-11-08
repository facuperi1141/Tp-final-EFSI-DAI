import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

// Rutas donde un 401 es una respuesta esperada y no significa "sesión vencida"
const AUTH_URLS = ['/auth/login', '/auth/register', '/auth/me'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al arrancar se pregunta al backend si la cookie de sesión sigue siendo válida
  useEffect(() => {
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Si cualquier pedido responde 401 (token vencido), se cierra la sesión y se va al login
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = error.config?.url ?? '';
        const isAuthUrl = AUTH_URLS.some((authUrl) => url.includes(authUrl));
        if (error.response?.status === 401 && !isAuthUrl) {
          setUser(null);
          const onAuthPage = ['/login', '/register'].some((path) => window.location.pathname.startsWith(path));
          if (!onAuthPage) window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  async function login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    setUser(data.user);
  }

  async function register(fields) {
    const { data } = await api.post('/auth/register', fields);
    setUser(data.user);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }

  // Después de editar el perfil: actualiza nombre y avatar en toda la app sin volver a pedir /auth/me
  function updateUser(changes) {
    setUser((current) => ({ ...current, ...changes }));
  }

  const value = { user, loading, login, register, logout, updateUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
