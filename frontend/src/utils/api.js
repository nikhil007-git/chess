// API Base URL config
// In development, empty string uses Vite proxy to localhost:5001
// On Vercel, VITE_API_URL should be set to your Render backend URL (e.g. https://chess-backend.onrender.com)
export const API_BASE = import.meta.env.VITE_API_URL || '';

export const apiUrl = (endpoint) => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${path}`;
};

