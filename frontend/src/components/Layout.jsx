import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthSession } from '../auth/AuthSessionProvider';
import { request } from '../services/api';

export default function Layout({ children }) {
  const location = useLocation();
  const { currentUser, logout } = useAuthSession();
  const userIsAdmin = currentUser?.role === 'ADMIN';

  // Estados da Central de Alertas
  const [alertsData, setAlertsData] = useState(null);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isRefreshingAlerts, setIsRefreshingAlerts] = useState(false);
  const alertsDropdownRef = useRef(null);

  // Estado do Menu Lateral Recolhível
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getAlerts = async () => {
    const response = await request('/alerts');
    return response.ok ? response.json() : null;
  };

  const refreshAlerts = async () => {
    setIsRefreshingAlerts(true);
    try {
      const data = await getAlerts();
      if (data) setAlertsData(data);
    } catch (err) {
      console.error('Erro ao buscar alertas:', err);
    } finally {
      setIsRefreshingAlerts(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    const loadAlerts = () => {
      getAlerts()
        .then(data => {
          if (isActive && data) setAlertsData(data);
        })
        .catch(err => console.error('Erro ao buscar alertas:', err));
    };

    loadAlerts();

    // Atualiza automaticamente quando produtos ou movimentações mudam
    const handleStockUpdate = loadAlerts;
    window.addEventListener('stock-updated', handleStockUpdate);
    const interval = setInterval(loadAlerts, 45000); // Polling a cada 45s

    // Fecha dropdown ao clicar fora
    const handleClickOutside = (e) => {
      if (alertsDropdownRef.current && !alertsDropdownRef.current.contains(e.target)) {
        setIsAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      isActive = false;
      window.removeEventListener('stock-updated', handleStockUpdate);
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
  };

  // Título e Categoria do Módulo Atual para o Top Header
  const getPageInfo = (pathname) => {
    if (pathname.startsWith('/dashboard')) {
      return { title: 'Visão Geral & Inteligência', category: 'Analytics Executivo' };
    }
    if (pathname.startsWith('/produtos')) {
      return { title: 'Estoque & Produtos', category: 'Gestão de Almoxarifado' };
    }
    if (pathname.startsWith('/movimentacoes')) {
      return { title: 'Histórico & Auditoria', category: 'Rastreabilidade Fiscal' };
    }
    if (pathname.startsWith('/equipe')) {
      return { title: 'Equipe & Acessos', category: 'Segurança & Permissões' };
    }
    return { title: 'Almoxarifado', category: 'Betta SaaS' };
  };

  const pageInfo = getPageInfo(location.pathname);

  const navItems = [
    { 
      label: 'Visão Geral (Dash)', 
      path: '/dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    },
    { 
      label: 'Estoque & Produtos', 
      path: '/produtos',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      )
    },
    { 
      label: 'Histórico & Auditoria', 
      path: '/movimentacoes',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    ...(userIsAdmin ? [{ 
      label: 'Equipe & Acessos', 
      path: '/equipe',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    }] : []),
  ];

  // Gera iniciais para o avatar
  const getInitials = (name) => {
    if (!name) return 'US';
    const parts = name.split(/[._\s]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const userInitials = getInitials(currentUser?.fullName || currentUser?.username);
  const totalAlerts = alertsData?.totalAlerts || 0;
  const criticalCount = alertsData?.criticalCount || 0;
  const warningCount = alertsData?.warningCount || 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-canvas)', color: 'var(--text-primary)' }}>
      
      {/* SIDEBAR FIXA MODERNA & RECOLHÍVEL */}
      <aside style={{ 
        width: isCollapsed ? '64px' : '240px', 
        backgroundColor: 'var(--bg-surface)', 
        borderRight: '1px solid var(--border-subtle)', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxSizing: 'border-box',
        zIndex: 50,
        flexShrink: 0,
        transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}>
        
        {/* Topo / Marca & Botão de Recolher */}
        <div style={{ 
          padding: isCollapsed ? '16px 12px' : '16px 16px', 
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          minHeight: '64px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(56, 189, 248, 0.25)',
              flexShrink: 0,
              cursor: isCollapsed ? 'pointer' : 'default'
            }}
            onClick={isCollapsed ? toggleSidebar : undefined}
            title={isCollapsed ? 'Expandir menu (Ctrl+B)' : undefined}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            {!isCollapsed && (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <h2 style={{ fontSize: '14.5px', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.1 }}>
                  Betta
                </h2>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>
                  Almoxarifado
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              title="Recolher menu (Ctrl+B)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <polyline points="15 10 13 12 15 14" />
              </svg>
            </button>
          )}
        </div>

        {/* Card do Usuário Logado */}
        {!isCollapsed ? (
          <div style={{ 
            margin: '12px 14px', 
            padding: '8px 10px', 
            backgroundColor: 'var(--bg-surface-subtle)', 
            borderRadius: '9px', 
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '9px'
          }}>
            <div style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '50%', 
              backgroundColor: userIsAdmin ? 'rgba(56, 189, 248, 0.12)' : 'rgba(148, 163, 184, 0.12)',
              border: userIsAdmin ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)',
              color: userIsAdmin ? '#38bdf8' : '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '11px',
              flexShrink: 0
            }}>
              {userInitials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: 'var(--text-primary)', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}>
                {currentUser?.fullName || currentUser?.username || 'Usuário'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: userIsAdmin ? '#38bdf8' : '#10b981'
                }} />
                <span style={{ 
                  fontSize: '10px', 
                  color: 'var(--text-muted)',
                  fontWeight: '500'
                }}>
                  {userIsAdmin ? 'Administrador' : 'Operador'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center' }}>
            <div 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                backgroundColor: userIsAdmin ? 'rgba(56, 189, 248, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                border: userIsAdmin ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)',
                color: userIsAdmin ? '#38bdf8' : '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '11px'
              }}
              title={`${currentUser?.fullName || currentUser?.username} (${userIsAdmin ? 'Admin' : 'Operador'})`}
            >
              {userInitials}
            </div>
          </div>
        )}

        {/* Links de Navegação */}
        <nav style={{ flex: 1, padding: isCollapsed ? '10px 8px' : '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {!isCollapsed && (
            <div style={{ padding: '0 8px 6px 8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>
              Menu
            </div>
          )}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? '0px' : '9px',
                  padding: isCollapsed ? '10px 0' : '9px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span style={{ color: isActive ? '#38bdf8' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar com Botão de Logout */}
        <div style={{ padding: isCollapsed ? '12px 8px' : '14px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Encerrar Sessão' : undefined}
            style={{
              width: '100%',
              padding: isCollapsed ? '8px 0' : '8px',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '7px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isCollapsed ? '0px' : '7px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.2)';
              e.currentTarget.style.color = '#f43f5e';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!isCollapsed && <span>Encerrar Sessão</span>}
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL COM TOP HEADER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* TOP BAR / HEADER CORPORATIVO */}
        <header style={{
          height: '56px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(15, 19, 28, 0.72)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          zIndex: 40,
          flexShrink: 0
        }}>
          {/* Breadcrumb Contextual */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isCollapsed && (
              <button
                onClick={toggleSidebar}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginRight: '6px',
                  fontSize: '11px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'var(--border-medium)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-hairline)';
                }}
                title="Expandir menu lateral (Ctrl+B)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <polyline points="13 10 15 12 13 14" />
                </svg>
                <span>Menu</span>
              </button>
            )}
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
              {pageInfo.category}
            </span>
            <span style={{ color: 'var(--border-medium)', fontSize: '12px' }}>/</span>
            <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#fff', letterSpacing: '-0.01em' }}>
              {pageInfo.title}
            </span>
          </div>

          {/* Seção Direita: Status da Operação + Sininho de Alertas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }} ref={alertsDropdownRef}>
            
            {/* Badge de Status do Sistema */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.18)',
              fontSize: '11px',
              color: 'var(--accent-emerald)',
              fontWeight: '500'
            }}>
              <span style={{ 
                width: '5px', 
                height: '5px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--accent-emerald)', 
                boxShadow: '0 0 8px var(--accent-emerald)' 
              }} />
              <span>Operação Ativa</span>
            </div>

            {/* BOTÃO DO SINO DE NOTIFICAÇÕES */}
            <button
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              title="Central de Alertas e Reposição"
              style={{
                position: 'relative',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: isAlertsOpen ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: isAlertsOpen ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid var(--border-subtle)',
                color: isAlertsOpen ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                if (!isAlertsOpen) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {/* Ícone de Sino */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>

              {/* Badge Pulsante se houver alertas */}
              {totalAlerts > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 4px',
                  borderRadius: '999px',
                  backgroundColor: criticalCount > 0 ? '#f43f5e' : 'var(--accent-amber)',
                  color: '#fff',
                  fontSize: '9.5px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: criticalCount > 0 
                    ? '0 0 8px rgba(244, 63, 94, 0.6)' 
                    : '0 0 6px rgba(245, 158, 11, 0.4)',
                  animation: criticalCount > 0 ? 'bellPulse 1.8s infinite' : 'none'
                }}>
                  {totalAlerts}
                </span>
              )}
            </button>

            {/* DROPDOWN FLUTUANTE DE ALERTAS (Glassmorphism) */}
            {isAlertsOpen && (
              <div style={{
                position: 'absolute',
                top: '48px',
                right: '0px',
                width: '390px',
                backgroundColor: 'rgba(16, 23, 38, 0.96)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'dropdownFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                
                {/* Topo do Dropdown */}
                <div style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#fff' }}>
                      Alertas de Estoque
                    </span>
                    {totalAlerts > 0 && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '1px 7px',
                        borderRadius: '999px',
                        backgroundColor: criticalCount > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: criticalCount > 0 ? '#f43f5e' : 'var(--accent-amber)',
                        border: criticalCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                      }}>
                        {totalAlerts} pendente{totalAlerts > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={refreshAlerts}
                    disabled={isRefreshingAlerts}
                    title="Atualizar alertas"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <svg 
                      width="13" 
                      height="13" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      style={{ animation: isRefreshingAlerts ? 'spin 0.8s linear infinite' : 'none' }}
                    >
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  </button>
                </div>

                {/* Sub-cabeçalho de Resumo de Severidade */}
                {totalAlerts > 0 && (
                  <div style={{
                    padding: '8px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '11.5px',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}>
                    {criticalCount > 0 && (
                      <span style={{ color: '#f43f5e', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
                        {criticalCount} Esgotado{criticalCount > 1 ? 's' : ''} (Ruptura)
                      </span>
                    )}
                    {warningCount > 0 && (
                      <span style={{ color: 'var(--accent-amber)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-amber)' }} />
                        {warningCount} Abaixo do Mínimo
                      </span>
                    )}
                  </div>
                )}

                {/* Lista de Alertas com Scroll */}
                <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px' }}>
                  {totalAlerts === 0 ? (
                    <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ 
                        width: '38px', 
                        height: '38px', 
                        borderRadius: '50%', 
                        backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        color: 'var(--accent-emerald)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 12px auto' 
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>Estoque 100% Regularizado</div>
                      <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                        Nenhum item está abaixo da margem mínima de segurança.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(alertsData?.items || []).map((item) => {
                        const isCrit = item.severity === 'CRITICAL';
                        return (
                          <div
                            key={item.productId}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              backgroundColor: isCrit ? 'rgba(244, 63, 94, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                              border: isCrit ? '1px solid rgba(244, 63, 94, 0.25)' : '1px solid rgba(245, 158, 11, 0.2)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                              <div>
                                <span style={{
                                  fontSize: '10px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  fontWeight: '700',
                                  color: isCrit ? '#f43f5e' : 'var(--accent-amber)',
                                  display: 'inline-block',
                                  marginBottom: '2px'
                                }}>
                                  {isCrit ? '● RUPTURA TOTAL' : '● ESTOQUE BAIXO'}
                                </span>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', lineHeight: 1.2 }}>
                                  {item.productName}
                                </div>
                              </div>

                              <span style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                backgroundColor: isCrit ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: isCrit ? '#f43f5e' : 'var(--accent-amber)',
                                whiteSpace: 'nowrap'
                              }}>
                                {item.currentQuantity} un / mín {item.minQuantity}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                              <span>📍 {item.location} • {item.category}</span>
                              <button
                                onClick={() => {
                                  setIsAlertsOpen(false);
                                  navigate('/produtos');
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--accent-cyan)',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  padding: 0,
                                  fontSize: '11px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px'
                                }}
                                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                              >
                                Repor no Estoque →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Rodapé do Dropdown */}
                <div style={{
                  padding: '10px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderTop: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <Link
                    to="/produtos"
                    onClick={() => setIsAlertsOpen(false)}
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    Abrir Catálogo de Produtos →
                  </Link>
                </div>

              </div>
            )}

          </div>
        </header>

        {/* ÁREA DE CONTEÚDO ROLÁVEL */}
        <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
          {children}
        </main>

      </div>

      {/* ESTILOS DE ANIMAÇÃO GLOBAIS PARA O SINO E DROPDOWN */}
      <style>{`
        @keyframes bellPulse {
          0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(244, 63, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
        }
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

    </div>
  );
}
