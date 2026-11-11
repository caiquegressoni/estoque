const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
let accessTokenProvider = null;

export function setAccessTokenProvider(provider) {
  accessTokenProvider = provider;
}

export async function request(endpoint, options = {}) {
  const token = accessTokenProvider ? await accessTokenProvider() : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}
