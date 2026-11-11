import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthSession } from '../auth/AuthSessionProvider';

function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, currentUser, login, logout, refreshProfile, profileError } = useAuthSession();

  useEffect(() => {
    if (isAuthenticated && currentUser) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, currentUser, navigate]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px',
      backgroundColor: 'var(--bg-canvas)',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(56, 189, 248, 0.08) 0%, transparent 60%)'
    }}>
      <div style={{ 
        backgroundColor: 'rgba(16, 23, 38, 0.85)', 
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        width: '100%', 
        maxWidth: '400px', 
        padding: '40px 36px', 
        borderRadius: '16px', 
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04)' 
      }}>
        
        {/* Topo / Marca */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(56, 189, 248, 0.3)',
            marginBottom: '16px'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>
            Betta Almoxarifado
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
            Acesso ao sistema de gestão de estoque
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {profileError && <p role="alert" style={{ color: '#fca5a5', fontSize: '13px' }}>{profileError}</p>}
          <button 
            type="button" 
            onClick={isAuthenticated ? refreshProfile : login}
            disabled={loading}
            style={{ 
              marginTop: '8px', 
              padding: '12px', 
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '14px', 
              fontWeight: '600', 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
            }}
          >
            {loading ? 'Carregando...' : isAuthenticated ? 'Tentar novamente' : 'Entrar com Auth0'}
          </button>
          {isAuthenticated && (
            <button type="button" onClick={logout} style={{ padding: 10, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
              Sair da conta Auth0
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
