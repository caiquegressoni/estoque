import { Navigate } from 'react-router-dom';
import { getToken, isAdmin } from '../services/auth';

export default function ProtectedRoute({ children, roleRequired }) {
  const token = getToken();

  // Se não existir o token salvo no navegador, redireciona para a página de Login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Se a rota exige papel de ADMIN e o usuário é apenas um operador
  if (roleRequired === 'ADMIN' && !isAdmin()) {
    return <Navigate to="/produtos" replace />;
  }

  return children;
}
