import { Navigate } from 'react-router-dom';
import { useAuthSession } from '../auth/AuthSessionProvider';

export default function ProtectedRoute({ children, roleRequired }) {
  const { isAuthenticated, loading, currentUser, profileError, refreshProfile, logout } = useAuthSession();

  if (loading) {
    return <div style={{ padding: 32, color: '#fff' }}>Carregando sessão...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (profileError || !currentUser) {
    return (
      <div style={{ padding: 32, color: '#fff' }}>
        <p>{profileError || 'Esta conta Auth0 não está vinculada a um usuário do Estoque.'}</p>
        <button onClick={refreshProfile}>Tentar novamente</button>
        <button onClick={logout} style={{ marginLeft: 8 }}>Sair</button>
      </div>
    );
  }

  if (roleRequired === 'ADMIN' && currentUser.role !== 'ADMIN') {
    return <Navigate to="/produtos" replace />;
  }

  return children;
}
