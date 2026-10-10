// API Base URL config
// If VITE_API_URL is set in env, use it.
// If on vercel.app and no env is set, automatically fallback to the live Render backend.
// In local development, empty string uses the Vite proxy to localhost:5001.
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://chess-ysxc.onrender.com';
  }
  return '';
};

export const API_BASE = getApiBase();

export const apiUrl = (endpoint) => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${path}`;
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('chess_admin_token') : null;
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(apiUrl(endpoint), {
    ...options,
    credentials: 'include',
    headers,
  });
};
