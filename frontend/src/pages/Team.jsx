import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../services/api';
import { isAdmin, getUserData } from '../services/auth';

export default function Team() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentUser = getUserData();

  const fetchUsers = async () => {
    try {
      const response = await request('/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/produtos');
      return;
    }
    fetchUsers();
  }, []);

  if (!isAdmin()) {
    return null;
  }

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await request('/users', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          password,
          role,
        }),
      });

      if (response.ok) {
        alert('Colaborador cadastrado com sucesso!');
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('USER');
        setModalOpen(false);
        fetchUsers();
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.message || 'Erro ao cadastrar colaborador. Verifique se o e-mail já existe.');
      }
    } catch (error) {
      console.error('Erro de rede:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.username === currentUser?.username) {
      alert('Você não pode excluir a sua própria conta de administrador.');
      return;
    }

    const confirmDelete = window.confirm(
      `Tem certeza que deseja desvincular o colaborador "${userToDelete.fullName}" (${userToDelete.username})?\nO acesso ao almoxarifado será revogado imediatamente.`
    );

    if (!confirmDelete) return;

    try {
      const response = await request(`/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert(`Colaborador ${userToDelete.fullName} removido com sucesso!`);
        fetchUsers();
      } else {
        const errorText = await response.text();
        let message = 'Não foi possível remover o colaborador.';
        try {
          const parsed = JSON.parse(errorText);
          message = parsed.message || message;
        } catch (_) {
          if (errorText) message = errorText;
        }
        alert(message);
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro de rede ao tentar remover o colaborador.');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>
            Gestão de Equipe & Acessos
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Controle de colaboradores e credenciais vinculadas a este almoxarifado.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            backgroundColor: 'var(--accent-emerald)',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar Colaborador
        </button>
      </div>

      {/* Tabela de Membros da Equipe */}
      <section style={{ 
        backgroundColor: 'var(--bg-surface)', 
        borderRadius: '12px', 
        overflow: 'hidden', 
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>Colaborador</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>Usuário de Login</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>E-mail</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>Nível de Permissão</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                  Carregando colaboradores da empresa...
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = u.username === currentUser?.username;
                const isAdminRole = u.role === 'ADMIN';

                return (
                  <tr 
                    key={u.id} 
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: isAdminRole ? 'rgba(56, 189, 248, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                          color: isAdminRole ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                          border: isAdminRole ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11.5px',
                          fontWeight: '700'
                        }}>
                          {getInitials(u.fullName)}
                        </div>
                        <span style={{ fontWeight: '600', color: '#fff', fontSize: '13.5px' }}>
                          {u.fullName}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <code style={{ 
                        color: 'var(--accent-cyan)', 
                        backgroundColor: 'rgba(56, 189, 248, 0.08)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {u.username}
                      </code>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        backgroundColor: isAdminRole ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: isAdminRole ? 'var(--accent-cyan)' : 'var(--accent-emerald)',
                        border: isAdminRole ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '11.5px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isAdminRole ? 'var(--accent-cyan)' : 'var(--accent-emerald)' }} />
                        {isAdminRole ? 'Administrador' : 'Operador'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      {isSelf ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          (Sua Conta)
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          style={{
                            backgroundColor: 'rgba(244, 63, 94, 0.08)',
                            color: '#f43f5e',
                            border: '1px solid rgba(244, 63, 94, 0.2)',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          title={`Remover ${u.fullName}`}
                        >
                          Excluir
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {/* MODAL DE CADASTRO DE COLABORADOR (GLASSMORPHISM) */}
      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{ 
            backgroundColor: 'var(--bg-surface)', 
            width: '100%', 
            maxWidth: '460px', 
            padding: '28px', 
            borderRadius: '16px', 
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)' 
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Novo Colaborador</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              O nome de usuário para login será gerado como <code>primeiro.ultimo</code> nome.
            </p>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Ex: Ana Paula Silva"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>E-mail *</label>
                <input
                  type="email"
                  placeholder="ana@empresa.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Senha Provisória *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Papel / Permissão</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', boxSizing: 'border-box', cursor: 'pointer' }}
                >
                  <option value="USER">Operador de Almoxarifado</option>
                  <option value="ADMIN">Administrador Geral</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 1, padding: '11px', backgroundColor: 'var(--accent-emerald)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  {loading ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
