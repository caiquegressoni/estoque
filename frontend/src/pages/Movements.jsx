import { useEffect, useState } from 'react';
import { request } from '../services/api';

export default function Movements() {
  const [movements, setMovements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL', 'ENTRADA', 'SAIDA'

  useEffect(() => {
    let isActive = true;
    request('/stock-movements')
      .then(async response => (response.ok ? response.json() : null))
      .then(data => {
        if (isActive && data) setMovements(data);
      })
      .catch(error => console.error('Erro ao buscar movimentações:', error));

    return () => {
      isActive = false;
    };
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.025em', color: '#fff' }}>
            Histórico de Auditoria
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '3px' }}>
            Trilha imutável de entradas, saídas, notas fiscais e responsáveis.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn-ghost"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exportar Auditoria (CSV)
        </button>
      </div>

      {/* Barra de Filtro e Pesquisa (Segmented Control Minimalista) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Filtro por Tipo */}
        <div style={{ 
          display: 'flex', 
          backgroundColor: 'rgba(255, 255, 255, 0.03)', 
          borderRadius: '8px', 
          padding: '3px', 
          border: '1px solid var(--border-hairline)' 
        }}>
          <button
            onClick={() => setTypeFilter('ALL')}
            style={{
              backgroundColor: typeFilter === 'ALL' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: typeFilter === 'ALL' ? '#fff' : 'var(--text-secondary)',
              border: typeFilter === 'ALL' ? '1px solid var(--border-hairline)' : '1px solid transparent', 
              padding: '5px 12px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '12px', 
              fontWeight: typeFilter === 'ALL' ? '600' : '500',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Todas <span className="tabular-nums" style={{ opacity: 0.6, fontSize: '11px' }}>{movements.length}</span>
          </button>
          <button
            onClick={() => setTypeFilter('ENTRADA')}
            style={{
              backgroundColor: typeFilter === 'ENTRADA' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              color: typeFilter === 'ENTRADA' ? '#34d399' : 'var(--text-secondary)',
              border: typeFilter === 'ENTRADA' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid transparent', 
              padding: '5px 12px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '12px', 
              fontWeight: typeFilter === 'ENTRADA' ? '600' : '500',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Entradas <span className="tabular-nums" style={{ opacity: 0.8, fontSize: '11px' }}>{movements.filter(m => m.type === 'ENTRADA').length}</span>
          </button>
          <button
            onClick={() => setTypeFilter('SAIDA')}
            style={{
              backgroundColor: typeFilter === 'SAIDA' ? 'rgba(244, 63, 94, 0.12)' : 'transparent',
              color: typeFilter === 'SAIDA' ? '#fb7185' : 'var(--text-secondary)',
              border: typeFilter === 'SAIDA' ? '1px solid rgba(244, 63, 94, 0.25)' : '1px solid transparent', 
              padding: '5px 12px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '12px', 
              fontWeight: typeFilter === 'SAIDA' ? '600' : '500',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Saídas <span className="tabular-nums" style={{ opacity: 0.8, fontSize: '11px' }}>{movements.filter(m => m.type === 'SAIDA').length}</span>
          </button>
        </div>

        {/* Busca */}
        <div style={{ position: 'relative', width: '340px' }}>
          <svg 
            width="14" 
            height="14" 
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
            placeholder="Buscar produto, NF, motivo ou usuário..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px 46px 8px 34px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-hairline)', 
              backgroundColor: 'rgba(255, 255, 255, 0.03)', 
              color: '#fff', 
              fontSize: '12.5px',
              outline: 'none',
              transition: 'border-color 0.15s ease' 
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-hairline)'}
          />
          <kbd style={{ 
            position: 'absolute', 
            right: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            fontSize: '10px', 
            padding: '2px 5px', 
            borderRadius: '4px', 
            backgroundColor: 'rgba(255, 255, 255, 0.06)', 
            color: 'var(--text-muted)', 
            border: '1px solid var(--border-hairline)',
            pointerEvents: 'none'
          }}>⌘K</kbd>
        </div>
      </div>

      {/* Tabela de Auditoria Minimalista */}
      <section className="glass-card" style={{ 
        borderRadius: '12px', 
        overflow: 'hidden', 
        border: '1px solid var(--border-hairline)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-hairline)' }}>
              <th style={{ padding: '12px 18px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600' }}>Data / Hora</th>
              <th style={{ padding: '12px 18px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600' }}>Item</th>
              <th style={{ padding: '12px 18px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600' }}>Tipo</th>
              <th style={{ padding: '12px 18px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600' }}>Quantidade</th>
              <th style={{ padding: '12px 18px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600' }}>NF-e Ref.</th>
              <th style={{ padding: '12px 18px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600' }}>Motivo / Justificativa</th>
              <th style={{ padding: '12px 18px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600' }}>Responsável</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Nenhum registro de movimentação encontrado.
                </td>
              </tr>
            ) : (
              filteredMovements.map((m) => {
                const isEntrada = m.type === 'ENTRADA';
                return (
                  <tr 
                    key={m.id} 
                    style={{ borderBottom: '1px solid var(--border-hairline)', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="tabular-nums" style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(m.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: '600', color: '#fff', fontSize: '13px' }}>
                      {m.productName}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ 
                        backgroundColor: isEntrada ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                        color: isEntrada ? '#34d399' : '#fb7185',
                        border: isEntrada ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(244, 63, 94, 0.25)',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontWeight: '600',
                        fontSize: '11px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isEntrada ? '#34d399' : '#fb7185' }} />
                        {isEntrada ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 18px', fontWeight: '600', fontSize: '12.5px', color: isEntrada ? '#34d399' : '#fb7185' }}>
                      {isEntrada ? `+${m.quantity}` : `-${m.quantity}`} un
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      {m.invoiceNumber ? (
                        <span style={{ 
                          backgroundColor: 'rgba(2, 132, 199, 0.12)', 
                          color: '#38bdf8', 
                          border: '1px solid rgba(2, 132, 199, 0.25)',
                          padding: '1px 6px', 
                          borderRadius: '4px', 
                          fontSize: '10.5px', 
                          fontWeight: '500' 
                        }}>
                          NF {m.invoiceNumber}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                      {m.reason || '-'}
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '500' }}>
                      <code style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-hairline)' }}>{m.username}</code>
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
