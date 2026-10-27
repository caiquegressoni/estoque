export function getToken() {
  return localStorage.getItem('meuTokenJWT');
}

export function getUserData() {
  const token = getToken();
  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    return {
      username: decodedPayload.sub,
      role: decodedPayload.role || localStorage.getItem('userRole') || 'USER',
    };
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error);
    return {
      username: '',
      role: localStorage.getItem('userRole') || 'USER',
    };
  }
}

export function isAdmin() {
  const userData = getUserData();
  return userData?.role === 'ADMIN';
}

export function logout() {
  localStorage.removeItem('meuTokenJWT');
  localStorage.removeItem('userRole');
}
