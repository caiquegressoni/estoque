import { logout } from './auth';

const BASE_URL = 'http://localhost:8080/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('meuTokenJWT');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Se o token expirou ou for inválido (401), desloga e redireciona para a tela de login
  if (response.status === 401) {
    if (token) {
      logout();
      window.location.href = '/';
    }
  }

  return response;
}
