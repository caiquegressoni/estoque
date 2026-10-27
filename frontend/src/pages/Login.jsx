import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("meuTokenJWT", data.token);

        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          localStorage.setItem("userRole", payload.role);
        } catch (e) {
          console.error("Erro ao ler dados do token:", e);
        }

        navigate('/dashboard');
      } else {
        alert("Usuário ou senha incorretos!");
      }
    } catch (error) {
      console.error("Erro de requisição: ", error);
      alert("Não foi possível conectar ao servidor. O Spring Boot está ativo?");
    } finally {
      setIsLoading(false);
    }
  };

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

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Usuário de Acesso
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex: caique.gressoni"
              required
              style={{ 
                padding: '11px 14px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-subtle)', 
                backgroundColor: 'var(--bg-surface-subtle)', 
                color: '#fff', 
                fontSize: '13.5px' 
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Senha
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ 
                padding: '11px 14px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-subtle)', 
                backgroundColor: 'var(--bg-surface-subtle)', 
                color: '#fff', 
                fontSize: '13.5px' 
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              marginTop: '8px', 
              padding: '12px', 
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '14px', 
              fontWeight: '600', 
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
            }}
          >
            {isLoading ? 'Autenticando...' : 'Acessar Sistema'}
          </button>
          
        </form>
      </div>
    </div>
  );
}

export default Login;
