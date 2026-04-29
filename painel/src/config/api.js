const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_URL =
  import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:3001/api' : `${window.location.origin}/_/backend/api`);

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || (isLocalhost ? 'http://localhost:3001' : window.location.origin);