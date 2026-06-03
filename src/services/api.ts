export const API_BASE = import.meta.env.VITE_API_BASE || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') 
    ? `http://${window.location.hostname}:5000` 
    : ''
);

export const getAuthHeaders = (token?: string | null) => {
  const activeToken = token || localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}),
  };
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}, token?: string | null) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token || localStorage.getItem('token') ? { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};
