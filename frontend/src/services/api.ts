import axios from 'axios';

/** Vercel: set VITE_API_URL to your Render service URL (origin only). Local dev: omit — Vite proxies /api. */
const apiOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const baseURL = apiOrigin ? `${apiOrigin}/api` : '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('csa_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('csa_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
