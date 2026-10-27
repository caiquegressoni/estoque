import { useEffect, useState } from 'react';
import { request } from '../services/api';

export default function Movements() {
  const [movements, setMovements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL', 'ENTRADA', 'SAIDA'

  const fetchMovements = async () => {
    try {
      const response = await request('/stock-movements');
      if (response.ok) {
        const data = await response.json();
        setMovements(data);
      }
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  // Exportar Auditoria para CSV
  const handleExportCSV = () => {
    if (movements.length === 0) {
      alert('Nenhuma movimentação para exportar.');
      return;
    }

    const headers = 'ID;Data_Hora;Produto;Tipo;Quantidade;NF_Referencia;Motivo;Responsavel\n';
    const rows = movements.map(m => 
      `${m.id};"${new Date(m.createdAt).toLocaleString('pt-BR')}";"${m.productName}";${m.type};${m.quantity};"${m.invoiceNumber || ''}";"${m.reason || ''}";"${m.username}"`
    ).join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_movimentacoes_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMovements = movements.filter((m) => {
    const matchesSearch = 
      m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.invoiceNumber && m.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.reason && m.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.username && m.username.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (typeFilter !== 'ALL' && m.type !== typeFilter) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
      
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>
            Histórico de Auditoria
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Trilha imutável de entradas, saídas, notas fiscais e responsáveis.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            color: 'var(--accent-cyan)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            padding: '9px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exportar Auditoria (CSV)
        </button>
      </div>

      {/* Barra de Filtro e Pesquisa (Segmented Control) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Filtro por Tipo */}
        <div style={{ 
          display: 'flex', 
          backgroundColor: 'var(--bg-surface-subtle)', 
          borderRadius: '8px', 
          padding: '3px', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <button
            onClick={() => setTypeFilter('ALL')}
            style={{
              backgroundColor: typeFilter === 'ALL' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: typeFilter === 'ALL' ? '#fff' : 'var(--text-secondary)',
              border: 'none', 
              padding: '6px 14px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '12.5px', 
              fontWeight: typeFilter === 'ALL' ? '600' : '500'
            }}
          >
            Todas ({movements.length})
          </button>
          <button
            onClick={() => setTypeFilter('ENTRADA')}
            style={{
              backgroundColor: typeFilter === 'ENTRADA' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: typeFilter === 'ENTRADA' ? '#10b981' : 'var(--text-secondary)',
              border: 'none', 
              padding: '6px 14px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '12.5px', 
              fontWeight: typeFilter === 'ENTRADA' ? '600' : '500'
            }}
          >
            Entradas ({movements.filter(m => m.type === 'ENTRADA').length})
          </button>
          <button
            onClick={() => setTypeFilter('SAIDA')}
            style={{
              backgroundColor: typeFilter === 'SAIDA' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
              color: typeFilter === 'SAIDA' ? '#f43f5e' : 'var(--text-secondary)',
              border: 'none', 
              padding: '6px 14px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '12.5px', 
              fontWeight: typeFilter === 'SAIDA' ? '600' : '500'
            }}
          >
            Saídas ({movements.filter(m => m.type === 'SAIDA').length})
          </button>
        </div>

        {/* Busca */}
        <div style={{ position: 'relative', width: '360px' }}>
          <svg 
            width="15" 
            height="15" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="var(--text-muted)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por produto, NF, motivo ou usuário..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '9px 14px 9px 36px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-subtle)', 
              backgroundColor: 'var(--bg-surface-subtle)', 
              color: '#fff', 
              fontSize: '13px' 
            }}
          />
        </div>
      </div>

      {/* Tabela de Auditoria Minimalista */}
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
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>Data / Hora</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>Item</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>Tipo</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>Quantidade</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>NF-e Ref.</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>Motivo / Justificativa</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>Responsável</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                  Nenhum registro de movimentação encontrado.
                </td>
              </tr>
            ) : (
              filteredMovements.map((m) => {
                const isEntrada = m.type === 'ENTRADA';
                return (
                  <tr 
                    key={m.id} 
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                      {new Date(m.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: '600', color: '#fff', fontSize: '13.5px' }}>
                      {m.productName}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ 
                        backgroundColor: isEntrada ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                        color: isEntrada ? '#10b981' : '#f43f5e',
                        border: isEntrada ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(244, 63, 94, 0.25)',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontWeight: '600',
                        fontSize: '11px',
                        letterSpacing: '0.02em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isEntrada ? '#10b981' : '#f43f5e' }} />
                        {isEntrada ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: '600', fontSize: '13px', color: isEntrada ? '#10b981' : '#f43f5e' }}>
                      {isEntrada ? `+${m.quantity}` : `-${m.quantity}`} un
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {m.invoiceNumber ? (
                        <span style={{ 
                          backgroundColor: 'rgba(2, 132, 199, 0.12)', 
                          color: '#38bdf8', 
                          padding: '2px 7px', 
                          borderRadius: '4px', 
                          fontSize: '11.5px', 
                          fontWeight: '600' 
                        }}>
                          NF {m.invoiceNumber}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {m.reason || '-'}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontSize: '12.5px', fontWeight: '500' }}>
                      <code>{m.username}</code>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

    </div>
  );
}
