const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
const isLocalApiUrl = (value) => {
  try {
    return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(value).hostname);
  } catch {
    return false;
  }
};
const API_URL = import.meta.env.DEV
  ? configuredApiUrl || 'http://localhost:5000/api'
  : configuredApiUrl && !isLocalApiUrl(configuredApiUrl)
    ? configuredApiUrl
    : null;

const request = async (endpoint, options = {}) => {
  if (!API_URL) {
    throw new Error('Backend API URL is not configured. Set VITE_API_URL to the deployed API URL.');
  }

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  const token = localStorage.getItem('eventease_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({ success: false, message: 'Unexpected response.' }));

  if (!response.ok || data.success === false) {
    const error = new Error(data.message || 'Request failed.');
    error.status = response.status;
    throw error;
  }

  return data;
};

const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
  delete: (endpoint, body) => request(endpoint, { method: 'DELETE', body }),
};

export default api;
