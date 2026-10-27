import { useEffect, useState } from 'react';
import { request } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [days, setDays] = useState(14);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const fetchStats = async (targetDays = days) => {
    try {
      setIsRefreshing(true);
      const response = await request(`/dashboard/stats?days=${targetDays}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats(days);
  }, [days]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid var(--border-subtle)', 
          borderTopColor: 'var(--accent-cyan)', 
          borderRadius: '50%', 
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px auto'
        }} />
        <p style={{ fontSize: '14px' }}>Carregando inteligência de estoque...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Não foi possível carregar os dados analíticos no momento.
      </div>
    );
  }

  // Cálculos para o Gráfico SVG de Fluxo Temporal
  const timeline = stats.timeline || [];
  const maxBarValue = Math.max(
    1,
    ...timeline.map(t => Math.max(t.entradas, t.saidas))
  );

  const chartHeight = 160;
  const chartWidth = 540;
  const barGroupWidth = chartWidth / (timeline.length || 1);
  const barWidth = Math.max(2, Math.min(10, barGroupWidth * 0.32));
  const labelStep = timeline.length > 30 ? Math.ceil(timeline.length / 8) : (timeline.length > 15 ? 2 : 1);

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
      
      {/* Topo da Página */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>
            Visão Geral & Inteligência
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Monitoramento executivo de estoque, fluxo de movimentações e giro patrimonial.
          </p>
        </div>

        {/* Controles de Topo: Filtro Temporal + Atualização */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Seletor Temporal Segmented Control */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '3px',
            gap: '2px'
          }}>
            {[
              { label: '7D', value: 7, desc: 'Últimos 7 dias' },
              { label: '14D', value: 14, desc: 'Últimos 14 dias' },
              { label: '30D', value: 30, desc: 'Últimos 30 dias' },
              { label: '90D', value: 90, desc: 'Últimos 90 dias' }
            ].map(option => {
              const isActive = days === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setDays(option.value)}
                  title={option.desc}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: isActive ? '700' : '500',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.15s ease',
                    backgroundColor: isActive ? 'var(--accent-cyan)' : 'transparent',
                    color: isActive ? '#090d16' : 'var(--text-secondary)'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Botão de Atualizar com feedback visual */}
          <button
            onClick={() => fetchStats(days)}
            disabled={isRefreshing}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              padding: '7px 14px',
              borderRadius: '8px',
              cursor: isRefreshing ? 'wait' : 'pointer',
              fontWeight: '500',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* LINHA 1: CARDS DE RESUMO EXECUTIVO (KPIs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        
        {/* Card 1: Patrimônio Imobilizado */}
        <div style={{ 
          backgroundColor: 'var(--bg-surface)', 
          padding: '20px 22px', 
          borderRadius: '12px', 
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)' 
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>
            Patrimônio Imobilizado
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>
              R$ {Number(stats.totalStockValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: '500' }}>Custo Total</span>
          </div>
        </div>

        {/* Card 2: Volume Físico */}
        <div style={{ 
          backgroundColor: 'var(--bg-surface)', 
          padding: '20px 22px', 
          borderRadius: '12px', 
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)' 
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>
            Volume Físico em Prateleiras
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>
              {stats.totalStockVolume} <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-muted)' }}>un</span>
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: '500' }}>{stats.totalProducts} SKUs</span>
          </div>
        </div>

        {/* Card 3: Itens Críticos */}
        <div style={{ 
          backgroundColor: 'var(--bg-surface)', 
          padding: '20px 22px', 
          borderRadius: '12px', 
          border: stats.lowStockCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)' 
        }}>
          <span style={{ fontSize: '11px', color: stats.lowStockCount > 0 ? '#f43f5e' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>
            Abaixo do Estoque Mínimo
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: stats.lowStockCount > 0 ? '#f43f5e' : '#fff', letterSpacing: '-0.02em' }}>
              {stats.lowStockCount}
            </h3>
            <span style={{ 
              fontSize: '12px', 
              color: stats.lowStockCount > 0 ? '#f43f5e' : 'var(--accent-emerald)', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {stats.lowStockCount > 0 ? '● Reposição' : '● Em dia'}
            </span>
          </div>
        </div>

        {/* Card 4: Total de Movimentações no Período */}
        <div style={{ 
          backgroundColor: 'var(--bg-surface)', 
          padding: '20px 22px', 
          borderRadius: '12px', 
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)' 
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>
            Movimentações ({days}D)
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>
              {stats.totalMovements}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No período</span>
          </div>
        </div>

      </div>

      {/* LINHA 2: GRÁFICOS ANALÍTICOS (Fluxo de Movimentações + Distribuição de Categorias) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        
        {/* Painel do Gráfico de Fluxo Temporal */}
        <div style={{ 
          backgroundColor: 'var(--bg-surface)', 
          padding: '24px', 
          borderRadius: '16px', 
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', letterSpacing: '-0.01em' }}>
                Fluxo de Movimentações ({days} dias)
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Comparativo diário de Entradas vs Saídas no período selecionado
              </span>
            </div>

            {/* Legenda */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', fontWeight: '600' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--accent-emerald)' }} />
                Entradas
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--accent-rose)' }} />
                Saídas
              </div>
            </div>
          </div>

          {/* Área do Gráfico SVG Dinâmico */}
          <div style={{ position: 'relative', width: '100%', overflowX: 'auto', paddingBottom: '6px' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} style={{ width: '100%', height: 'auto', minWidth: '460px' }}>
              
              {/* Linhas de Grade Horizontais */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = chartHeight - (pct * chartHeight) + 10;
                return (
                  <g key={idx}>
                    <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  </g>
                );
              })}

              {/* Barras do Gráfico */}
              {timeline.map((point, idx) => {
                const groupX = idx * barGroupWidth + (barGroupWidth / 2);
                
                const entradaH = Math.max(3, (point.entradas / maxBarValue) * chartHeight);
                const saidaH = Math.max(3, (point.saidas / maxBarValue) * chartHeight);

                const entradaY = chartHeight - entradaH + 10;
                const saidaY = chartHeight - saidaH + 10;

                const isHovered = hoveredIndex === idx;

                return (
                  <g 
                    key={idx} 
                    onMouseEnter={() => setHoveredIndex(idx)} 
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Área de Hover de fundo */}
                    {isHovered && (
                      <rect 
                        x={idx * barGroupWidth} 
                        y="5" 
                        width={barGroupWidth} 
                        height={chartHeight + 25} 
                        fill="rgba(255,255,255,0.03)" 
                        rx="4"
                      />
                    )}

                    {/* Barra de Entrada (Verde Esmeralda) */}
                    <rect 
                      x={groupX - barWidth - 1} 
                      y={point.entradas > 0 ? entradaY : chartHeight + 8} 
                      width={barWidth} 
                      height={point.entradas > 0 ? entradaH : 2} 
                      rx="2"
                      fill={point.entradas > 0 ? 'var(--accent-emerald)' : 'rgba(16, 185, 129, 0.2)'}
                      opacity={isHovered ? 1 : 0.85}
                    />

                    {/* Barra de Saída (Rosa Coral) */}
                    <rect 
                      x={groupX + 1} 
                      y={point.saidas > 0 ? saidaY : chartHeight + 8} 
                      width={barWidth} 
                      height={point.saidas > 0 ? saidaH : 2} 
                      rx="2"
                      fill={point.saidas > 0 ? 'var(--accent-rose)' : 'rgba(244, 63, 94, 0.2)'}
                      opacity={isHovered ? 1 : 0.85}
                    />

                    {/* Rótulo de Data no Eixo X (espaçamento inteligente para evitar sobreposição) */}
                    {(idx % labelStep === 0 || idx === timeline.length - 1 || isHovered) && (
                      <text 
                        x={groupX} 
                        y={chartHeight + 26} 
                        textAnchor="middle" 
                        fill={isHovered ? '#fff' : 'var(--text-muted)'} 
                        fontSize="9.5"
                        fontWeight={isHovered ? '600' : '500'}
                      >
                        {point.date}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Tooltip Dinâmico do Ponto em Foco */}
            {hoveredIndex !== null && timeline[hoveredIndex] && (
              <div style={{
                position: 'absolute',
                top: '0px',
                right: '10px',
                backgroundColor: 'rgba(16, 23, 38, 0.95)',
                border: '1px solid var(--border-subtle)',
                backdropFilter: 'blur(12px)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                display: 'flex',
                gap: '12px'
              }}>
                <span style={{ color: '#fff', fontWeight: '600' }}>Dia {timeline[hoveredIndex].date}:</span>
                <span style={{ color: 'var(--accent-emerald)' }}>+{timeline[hoveredIndex].entradas} un</span>
                <span style={{ color: 'var(--accent-rose)' }}>-{timeline[hoveredIndex].saidas} un</span>
              </div>
            )}
          </div>
        </div>

        {/* Painel de Distribuição por Categoria */}
        <div style={{ 
          backgroundColor: 'var(--bg-surface)', 
          padding: '24px', 
          borderRadius: '16px', 
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', letterSpacing: '-0.01em' }}>
              Capital Imobilizado por Categoria
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Divisão proporcional do valor total em estoque
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center' }}>
            {(stats.categoryDistribution || []).length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '30px' }}>
                Nenhuma categoria cadastrada no momento.
              </div>
            ) : (
              (stats.categoryDistribution || []).map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {cat.category} <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '11px' }}>({cat.productCount} SKUs)</span>
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      R$ {Number(cat.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <strong style={{ color: 'var(--accent-cyan)', marginLeft: '8px' }}>{cat.percentage}%</strong>
                    </span>
                  </div>

                  {/* Barra de Progresso */}
                  <div style={{ width: '100%', height: '7px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(4, cat.percentage))}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                      borderRadius: '999px',
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* LINHA 3: TOP 5 PRODUTOS DE MAIOR GIRO & FEED DE AUDITORIA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
        
        {/* Painel Top 5 Itens de Maior Giro */}
        <div style={{ 
          backgroundColor: 'var(--bg-surface)', 
          padding: '24px', 
          borderRadius: '16px', 
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)' 
        }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', letterSpacing: '-0.01em' }}>
              Top 5 Itens de Maior Giro ({days} dias)
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Materiais com maior volume de consumo no período selecionado
            </span>
          </div>

          {(stats.topProducts || []).length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '36px' }}>
              Nenhuma baixa/saída registrada para gerar o ranking de giro.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(stats.topProducts || []).map((item, idx) => (
                <div 
                  key={item.productId || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: idx === 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: idx === 0 ? 'var(--accent-amber)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#fff' }}>{item.productName}</div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Saldo atual: {item.currentStock} un</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      backgroundColor: 'rgba(244, 63, 94, 0.12)', 
                      color: '#f43f5e', 
                      padding: '3px 9px', 
                      borderRadius: '999px', 
                      fontSize: '11.5px', 
                      fontWeight: '700' 
                    }}>
                      -{item.totalMoved} un
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Painel Feed de Atividades Recentes */}
        <div style={{ 
          backgroundColor: 'var(--bg-surface)', 
          padding: '24px', 
          borderRadius: '16px', 
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)' 
        }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', letterSpacing: '-0.01em' }}>
              Atividades Recentes no Almoxarifado
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Últimas entradas e saídas registradas pela equipe
            </span>
          </div>

          {(stats.recentActivities || []).length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '36px' }}>
              Nenhuma movimentação registrada no sistema ainda.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(stats.recentActivities || []).map((act) => {
                const isEntrada = act.type === 'ENTRADA';
                return (
                  <div 
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: isEntrada ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                      }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                          {act.productName}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          por <code>{act.username}</code> • {new Date(act.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <span style={{
                      color: isEntrada ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}>
                      {isEntrada ? `+${act.quantity}` : `-${act.quantity}`} un
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
