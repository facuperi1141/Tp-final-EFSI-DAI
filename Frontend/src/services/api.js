import axios from 'axios';

// Cliente HTTP único de la aplicación. withCredentials permite trabajar con
// la cookie HttpOnly que crea el backend sin guardar el JWT en localStorage.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
