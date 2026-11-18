import { useEffect, useState } from 'react';
import { request } from '../services/api';
import NumberStepper from '../components/NumberStepper';

function Products() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'LOW', 'OK'
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Estados do formulário de produto
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('5');
  const [invoices, setInvoices] = useState('');
  const [observations, setObservations] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Estados do Modal de Movimentação de Estoque
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState(null);
  const [movementType, setMovementType] = useState('ENTRADA');
  const [movementQty, setMovementQty] = useState('1');
  const [movementInvoice, setMovementInvoice] = useState('');
  const [movementReason, setMovementReason] = useState('');

  // Estados do Modal de Devolução / RMA por E-mail
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedProductForReturn, setSelectedProductForReturn] = useState(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnInvoice, setReturnInvoice] = useState('');
  const [returnDefect, setReturnDefect] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Estados do Modal de Cotação & Reposição de Compras
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [copiedQuoteSuccess, setCopiedQuoteSuccess] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await request('/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  useEffect(() => {
    let isActive = true;
    request('/products')
      .then(async response => (response.ok ? response.json() : null))
      .then(data => {
        if (isActive && data) setProducts(data);
      })
      .catch(error => console.error('Erro ao buscar produtos:', error));

    return () => {
      isActive = false;
    };
  }, []);

  // Fecha o pop-up com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        handleCloseDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEditing = editingId !== null;
    const endpoint = isEditing ? `/products/${editingId}` : '/products';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await request(endpoint, {
        method,
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          quantity: parseInt(quantity || '0', 10),
          minQuantity: minQuantity ? parseInt(minQuantity, 10) : 5,
          invoices,
          observations,
          category,
          location,
        }),
      });

      if (response.ok) {
        handleCloseDrawer();
        fetchProducts();
        window.dispatchEvent(new Event('stock-updated'));
      } else {
        alert('Erro ao salvar produto. Verifique os dados.');
      }
    } catch (error) {
      console.error('Erro de rede:', error);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const response = await request(`/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchProducts();
        window.dispatchEvent(new Event('stock-updated'));
      } else {
        alert('Erro ao deletar produto.');
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price);
    setQuantity(product.quantity);
    setMinQuantity(product.minQuantity ?? 5);
    setInvoices(product.invoices || '');
    setObservations(product.observations || '');
    setCategory(product.category || '');
    setLocation(product.location || '');
    setIsDrawerOpen(true);
  };

  const handleOpenCreateDrawer = () => {
    handleCancelEdit();
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setQuantity('0');
    setMinQuantity('5');
    setInvoices('');
    setObservations('');
    setCategory('');
    setLocation('');
  };

  // Abrir Modal de Movimentação
  const openMovementModal = (product) => {
    setSelectedProductForMovement(product);
    setMovementType('ENTRADA');
    setMovementQty('1');
    setMovementInvoice(product.invoices ? product.invoices.split(',')[0].trim() : '');
    setMovementReason('');
    setMovementModalOpen(true);
  };

  const closeMovementModal = () => {
    setMovementModalOpen(false);
    setSelectedProductForMovement(null);
  };

  // Enviar Movimentação
  const handleConfirmMovement = async (e) => {
    e.preventDefault();
    const qty = parseInt(movementQty, 10);
    if (!qty || qty <= 0) {
      alert('Informe uma quantidade válida!');
      return;
    }

    try {
      const response = await request('/stock-movements', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProductForMovement.id,
          type: movementType,
          quantity: qty,
          invoiceNumber: movementInvoice,
          reason: movementReason,
        }),
      });

      if (response.ok) {
        closeMovementModal();
        fetchProducts();
        window.dispatchEvent(new Event('stock-updated'));
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Erro ao registrar movimentação.');
      }
    } catch (error) {
      console.error('Erro ao movimentar:', error);
    }
  };

  // Abrir Modal de Devolução (RMA)
  const openReturnModal = (product) => {
    setSelectedProductForReturn(product);
    setReturnQty(1);
    setReturnInvoice(product.invoices ? product.invoices.split(',')[0].trim() : '');
    setReturnDefect(product.observations || 'Apresenta vício / defeito de funcionamento');
    setCopiedSuccess(false);
    setReturnModalOpen(true);
  };

  const closeReturnModal = () => {
    setReturnModalOpen(false);
    setSelectedProductForReturn(null);
  };

  // Copiar E-mail de Devolução Formatado
  const handleCopyEmailText = () => {
    if (!selectedProductForReturn) return;

    const emailBody = `Prezados,

Solicitamos a autorização de devolução e garantia para o seguinte item com defeito:

- Produto: ${selectedProductForReturn.name}
- NF-e de Origem: ${returnInvoice || 'Não informada'}
- Quantidade: ${returnQty} unidade(s)
- Localização/Depósito: ${selectedProductForReturn.location || 'Geral'}
- Descrição do Defeito / Motivo: ${returnDefect}

Favor fornecer as instruções para envio e a etiqueta de postagem de retorno.

Atenciosamente,
Almoxarifado & Controle de Estoque`;

    navigator.clipboard.writeText(emailBody);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  // Exportação de Relatório CSV (com Estoque Mínimo)
  const handleExportCSV = () => {
    if (products.length === 0) {
      alert('Nenhum produto cadastrado para exportar.');
      return;
    }

    const headers = 'ID;Produto;Categoria;Localizacao;Descricao;Preco_Unitario;Quantidade_Estoque;Estoque_Minimo;Status_Estoque;NFs_Origem;Observacoes\n';
    const rows = products.map((p) => {
      const min = p.minQuantity ?? 5;
      const status = p.quantity <= min ? 'REPOSICAO_NECESSARIA' : 'REGULAR';
      return `${p.id};"${p.name.replace(/"/g, '""')}";"${(p.category || '').replace(/"/g, '""')}";"${(p.location || '').replace(/"/g, '""')}";"${(p.description || '').replace(/"/g, '""')}";${p.price};${p.quantity};${min};${status};"${(p.invoices || '').replace(/"/g, '""')}";"${(p.observations || '').replace(/"/g, '""')}"`;
    }).join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_estoque_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CÁLCULO DE MÉTRICAS (KPIs) COM ESTOQUE MÍNIMO INTELIGENTE ---
  const totalProducts = products.length;
  const totalQuantity = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const lowStockProducts = products.filter(p => (p.quantity || 0) <= (p.minQuantity ?? 5));
  const lowStockCount = lowStockProducts.length;
  const totalStockValue = products.reduce((acc, p) => acc + ((p.price || 0) * (p.quantity || 0)), 0);

  // Lista de Categorias Únicas
  const uniqueCategories = ['ALL', ...new Set(products.map(p => p.category).filter(Boolean))];

  // --- FILTRO INTELIGENTE (Busca + Filtro de Status + Categoria) ---
  const filteredProducts = products.filter((p) => {
    const min = p.minQuantity ?? 5;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.invoices && p.invoices.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.observations && p.observations.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'LOW' && p.quantity > min) return false;
    if (statusFilter === 'OK' && p.quantity <= min) return false;
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;

    return true;
  });

  // Gerador de Texto para Cotação de Reposição
  const generateQuotationText = () => {
    if (lowStockProducts.length === 0) return '';

    const today = new Date().toLocaleDateString('pt-BR');
    const itemsList = lowStockProducts.map((p, idx) => {
      const min = p.minQuantity ?? 5;
      const suggest = Math.max(1, (min * 2) - p.quantity);
      return `${idx + 1}. ${p.name} - Qtd Solicitada: ${suggest} un (Saldo Atual: ${p.quantity} | Mín: ${min}) | Local: ${p.location || 'Geral'}${p.category ? ` | Categoria: ${p.category}` : ''}`;
    }).join('\n');

    return `📦 SOLICITAÇÃO DE COTAÇÃO & REPOSIÇÃO - ALMOXARIFADO\nData: ${today}\n\nPrezado fornecedor,\nSolicitamos cotação de preços, disponibilidade e prazo de entrega para os seguintes itens com estoque crítico:\n\n${itemsList}\n\nFavor nos enviar proposta comercial com condições de pagamento e previsão de entrega.\n\nAtenciosamente,\nEquipe de Almoxarifado & Estoque`;
  };

  const handleCopyQuotationText = () => {
    const text = generateQuotationText();
    navigator.clipboard.writeText(text);
    setCopiedQuoteSuccess(true);
    setTimeout(() => setCopiedQuoteSuccess(false), 3000);
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
      
      {/* Topo da Página com Botões de Ação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.025em', color: '#fff' }}>
            Inventário & Almoxarifado
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '3px' }}>
            Catálogo técnico, níveis de estoque e rastreabilidade por notas fiscais.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setQuotationModalOpen(true)}
            className="btn-ghost"
            title="Visualizar itens abaixo do estoque mínimo para reposição"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: lowStockCount > 0 ? '#f43f5e' : 'var(--text-muted)' }} />
            Cotação ({lowStockCount})
          </button>
          <button 
            onClick={handleExportCSV} 
            className="btn-ghost"
            title="Exportar inventário completo para planilha CSV"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar CSV
          </button>
          <button 
            onClick={handleOpenCreateDrawer}
            className="btn-primary"
            title="Cadastrar novo item no almoxarifado"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo Produto
          </button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS (KPIs) MINIMALISTAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <span className="kpi-title">
            Itens Cadastrados
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
            <h3 className="tabular-nums" style={{ fontSize: '24px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em' }}>{totalProducts}</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SKUs ativos</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <span className="kpi-title">
            Volume Físico Total
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
            <h3 className="tabular-nums" style={{ fontSize: '24px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em' }}>
              {totalQuantity} <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>un</span>
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: '600' }}>Saldo geral</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <span className="kpi-title">
            Valor do Patrimônio
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
            <h3 className="tabular-nums" style={{ fontSize: '24px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em' }}>
              R$ {totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: '600' }}>Custo total</span>
          </div>
        </div>

        <div className="glass-card" style={{ 
          padding: '18px 20px',
          borderColor: lowStockCount > 0 ? 'rgba(244, 63, 94, 0.28)' : 'var(--border-hairline)'
        }}>
          <span className="kpi-title" style={{ color: lowStockCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
            Itens Críticos (Reposição)
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
            <h3 className="tabular-nums" style={{ fontSize: '24px', fontWeight: '700', color: lowStockCount > 0 ? '#f43f5e' : '#fff', letterSpacing: '-0.03em' }}>
              {lowStockCount}
            </h3>
            <span style={{ 
              fontSize: '11px', 
              color: lowStockCount > 0 ? '#f43f5e' : 'var(--accent-emerald)', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {lowStockCount > 0 ? '● Reposição' : '● Em dia'}
            </span>
          </div>
        </div>

      </div>

      {/* BARRA DE PESQUISA & FILTROS (Estilo Segmented Control Minimalista) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Segmented Control de Status */}
          <div style={{ 
            display: 'flex', 
            backgroundColor: 'rgba(255, 255, 255, 0.03)', 
            borderRadius: '8px', 
            padding: '3px', 
            border: '1px solid var(--border-hairline)' 
          }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              style={{
                backgroundColor: statusFilter === 'ALL' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: statusFilter === 'ALL' ? '#fff' : 'var(--text-secondary)',
                border: statusFilter === 'ALL' ? '1px solid var(--border-hairline)' : '1px solid transparent', 
                padding: '5px 12px', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '12px', 
                fontWeight: statusFilter === 'ALL' ? '600' : '500',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Todos <span className="tabular-nums" style={{ opacity: 0.6, fontSize: '11px' }}>{products.length}</span>
            </button>
            <button
              onClick={() => setStatusFilter('LOW')}
              style={{
                backgroundColor: statusFilter === 'LOW' ? 'rgba(244, 63, 94, 0.12)' : 'transparent',
                color: statusFilter === 'LOW' ? '#fb7185' : 'var(--text-secondary)',
                border: statusFilter === 'LOW' ? '1px solid rgba(244, 63, 94, 0.25)' : '1px solid transparent', 
                padding: '5px 12px', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '12px', 
                fontWeight: statusFilter === 'LOW' ? '600' : '500',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Críticos <span className="tabular-nums" style={{ opacity: 0.8, fontSize: '11px' }}>{lowStockCount}</span>
            </button>
            <button
              onClick={() => setStatusFilter('OK')}
              style={{
                backgroundColor: statusFilter === 'OK' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                color: statusFilter === 'OK' ? '#34d399' : 'var(--text-secondary)',
                border: statusFilter === 'OK' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid transparent', 
                padding: '5px 12px', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '12px', 
                fontWeight: statusFilter === 'OK' ? '600' : '500',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Regular <span className="tabular-nums" style={{ opacity: 0.8, fontSize: '11px' }}>{products.length - lowStockCount}</span>
            </button>
          </div>

          {/* Filtro por Categoria */}
          {uniqueCategories.length > 1 && (
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ 
                padding: '6px 12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-hairline)', 
                backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                color: 'var(--text-secondary)', 
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="ALL">Todas as Categorias</option>
              {uniqueCategories.filter(c => c !== 'ALL').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>

        {/* Input de Busca Minimalista */}
        <div style={{ position: 'relative', width: '320px' }}>
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
            placeholder="Buscar por nome, prateleira, NF..."
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

      {/* TABELA DE PRODUTOS MINIMALISTA */}
      <section className="glass-card" style={{ 
        borderRadius: '12px', 
        overflow: 'hidden', 
        border: '1px solid var(--border-hairline)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-hairline)' }}>
              <th style={{ padding: '12px 18px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600' }}>Item / Categoria</th>
              <th style={{ padding: '12px 18px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600' }}>Localização</th>
              <th style={{ padding: '12px 18px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600' }}>NF-e Origem</th>
              <th style={{ padding: '12px 18px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600' }}>Preço Unit.</th>
              <th style={{ padding: '12px 18px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600' }}>Saldo / Mínimo</th>
              <th style={{ padding: '12px 18px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {searchTerm ? 'Nenhum item encontrado para esta busca.' : 'Nenhum item cadastrado no inventário.'}
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const min = p.minQuantity ?? 5;
                const isCritical = p.quantity <= min;

                return (
                  <tr 
                    key={p.id} 
                    style={{ borderBottom: '1px solid var(--border-hairline)', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ fontWeight: '600', color: '#fff', fontSize: '13px' }}>{p.name}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '3px', alignItems: 'center' }}>
                        {p.category && (
                          <span style={{ 
                            backgroundColor: 'rgba(56, 189, 248, 0.08)', 
                            color: 'var(--accent-cyan)', 
                            border: '1px solid rgba(56, 189, 248, 0.18)',
                            padding: '1px 6px', 
                            borderRadius: '4px', 
                            fontSize: '10.5px', 
                            fontWeight: '500' 
                          }}>
                            {p.category}
                          </span>
                        )}
                        {p.description && <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{p.description}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      {p.location ? (
                        <span style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                          color: '#e2e8f0', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '11.5px', 
                          fontWeight: '500',
                          border: '1px solid var(--border-hairline)'
                        }}>
                          {p.location}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      {p.invoices ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {p.invoices.split(',').map((nf, idx) => (
                            <span key={idx} style={{ 
                              backgroundColor: 'rgba(2, 132, 199, 0.12)', 
                              color: '#38bdf8', 
                              border: '1px solid rgba(2, 132, 199, 0.25)',
                              padding: '1px 6px', 
                              borderRadius: '4px', 
                              fontSize: '10.5px', 
                              fontWeight: '500' 
                            }}>
                              NF {nf.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 18px', color: 'var(--text-primary)', fontSize: '12.5px', fontWeight: '500' }}>
                      R$ {Number(p.price).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="tabular-nums" style={{ 
                          backgroundColor: isCritical ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                          color: isCritical ? '#fb7185' : '#34d399',
                          border: isCritical ? '1px solid rgba(244, 63, 94, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                          padding: '2px 8px', 
                          borderRadius: '999px', 
                          fontSize: '11px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isCritical ? '#fb7185' : '#34d399' }} />
                          {p.quantity} un
                        </span>
                        <span className="tabular-nums" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          (mín: {min})
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '5px' }}>
                        {/* MOVIMENTAR */}
                        <button 
                          onClick={() => openMovementModal(p)} 
                          style={{ 
                            backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                            color: '#34d399', 
                            border: '1px solid rgba(16, 185, 129, 0.2)', 
                            padding: '4px 8px', 
                            borderRadius: '5px', 
                            cursor: 'pointer', 
                            fontWeight: '500',
                            fontSize: '11.5px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.16)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)'}
                          title="Registrar Entrada ou Saída"
                        >
                          Movimentar
                        </button>

                        {/* DEVOLUÇÃO */}
                        <button 
                          onClick={() => openReturnModal(p)} 
                          style={{ 
                            backgroundColor: 'rgba(99, 102, 241, 0.08)', 
                            color: '#a5b4fc', 
                            border: '1px solid rgba(99, 102, 241, 0.2)', 
                            padding: '4px 8px', 
                            borderRadius: '5px', 
                            cursor: 'pointer', 
                            fontWeight: '500',
                            fontSize: '11.5px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.16)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)'}
                          title="Gerar e-mail de devolução/RMA"
                        >
                          RMA
                        </button>

                        {/* EDITAR */}
                        <button 
                          onClick={() => handleEditClick(p)} 
                          style={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                            color: 'var(--text-secondary)', 
                            border: '1px solid var(--border-hairline)', 
                            padding: '4px 8px', 
                            borderRadius: '5px', 
                            cursor: 'pointer', 
                            fontWeight: '500',
                            fontSize: '11.5px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                          title="Editar"
                        >
                          Editar
                        </button>

                        {/* EXCLUIR */}
                        <button 
                          onClick={() => handleDeleteProduct(p.id)} 
                          style={{ 
                            backgroundColor: 'rgba(244, 63, 94, 0.06)', 
                            color: '#fb7185', 
                            border: '1px solid rgba(244, 63, 94, 0.18)', 
                            padding: '4px 8px', 
                            borderRadius: '5px', 
                            cursor: 'pointer', 
                            fontWeight: '500',
                            fontSize: '11.5px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.15)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.06)'}
                          title="Excluir"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {/* MODAL DE MOVIMENTAÇÃO DE ESTOQUE COM STEPPER */}
      {movementModalOpen && selectedProductForMovement && (
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
            maxWidth: '480px', 
            padding: '28px', 
            borderRadius: '16px', 
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)' 
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Movimentar Estoque</h3>
              <button onClick={closeMovementModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Item: <strong style={{ color: '#fff' }}>{selectedProductForMovement.name}</strong> (Saldo Atual: <strong>{selectedProductForMovement.quantity} un</strong>)
            </p>

            <form onSubmit={handleConfirmMovement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-surface-subtle)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setMovementType('ENTRADA')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '12.5px',
                    backgroundColor: movementType === 'ENTRADA' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                    color: movementType === 'ENTRADA' ? '#10b981' : 'var(--text-secondary)'
                  }}
                >
                  + Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('SAIDA')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '12.5px',
                    backgroundColor: movementType === 'SAIDA' ? 'rgba(244, 63, 94, 0.18)' : 'transparent',
                    color: movementType === 'SAIDA' ? '#f43f5e' : 'var(--text-secondary)'
                  }}
                >
                  - Saída (Baixa)
                </button>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>Quantidade a Movimentar *</label>
                  {/* Atalhos de incremento rápido */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 5, 10, 50].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setMovementQty(prev => (Number(prev) || 0) + n)}
                        style={{
                          padding: '2px 7px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        +{n}
                      </button>
                    ))}
                  </div>
                </div>
                
                <NumberStepper 
                  value={movementQty} 
                  onChange={setMovementQty} 
                  min={1} 
                  placeholder="1" 
                  unit="un" 
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>NF-e de Referência (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ex: 555" 
                  value={movementInvoice} 
                  onChange={e => setMovementInvoice(e.target.value)} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Motivo / Justificativa *</label>
                <input 
                  type="text" 
                  placeholder={movementType === 'ENTRADA' ? 'Ex: Reposição de fornecedor, devolução' : 'Ex: Manutenção preventiva, consumo interno'} 
                  value={movementReason} 
                  onChange={e => setMovementReason(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={closeMovementModal}
                  style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ 
                    flex: 1, 
                    padding: '11px', 
                    backgroundColor: movementType === 'ENTRADA' ? 'var(--accent-emerald)' : 'var(--accent-rose)', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: '600',
                    fontSize: '13px' 
                  }}
                >
                  Confirmar {movementType === 'ENTRADA' ? 'Entrada' : 'Saída'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL DE DEVOLUÇÃO / RMA (GLASSMORPHISM) */}
      {returnModalOpen && selectedProductForReturn && (
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
            maxWidth: '520px', 
            padding: '28px', 
            borderRadius: '16px', 
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)' 
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Solicitação de Devolução (RMA)</h3>
              <button onClick={closeReturnModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
              Geração de e-mail padronizado de garantia/defeito para envio ao fornecedor.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>NF-e Origem</label>
                <input 
                  value={returnInvoice} 
                  onChange={e => setReturnInvoice(e.target.value)} 
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Qtd Devolvida</label>
                <NumberStepper 
                  value={returnQty} 
                  onChange={setReturnQty} 
                  min={1} 
                  max={selectedProductForReturn.quantity || undefined}
                  unit="un" 
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Descrição do Defeito / Motivo</label>
              <input 
                value={returnDefect} 
                onChange={e => setReturnDefect(e.target.value)} 
                placeholder="Ex: Não liga, falha intermitente, quebrado"
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            {/* Pré-visualização do E-mail */}
            <div style={{ 
              backgroundColor: 'var(--bg-surface-subtle)', 
              padding: '14px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-subtle)', 
              fontSize: '12.5px', 
              color: 'var(--text-secondary)', 
              whiteSpace: 'pre-line', 
              lineHeight: '1.5', 
              maxHeight: '160px', 
              overflowY: 'auto', 
              marginBottom: '20px' 
            }}>
              {`Prezados,\n\nSolicitamos a autorização de devolução e garantia para o seguinte item com defeito:\n\n• Produto: ${selectedProductForReturn.name}\n• NF-e de Origem: ${returnInvoice || 'Não informada'}\n• Quantidade: ${returnQty} unidade(s)\n• Localização/Depósito: ${selectedProductForReturn.location || 'Geral'}\n• Descrição do Defeito / Motivo: ${returnDefect}\n\nFavor fornecer as instruções para envio e a etiqueta de postagem de retorno.\n\nAtenciosamente,\nAlmoxarifado & Controle de Estoque`}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                onClick={closeReturnModal} 
                style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}
              >
                Fechar
              </button>
              <button 
                type="button" 
                onClick={handleCopyEmailText} 
                style={{ 
                  flex: 2, 
                  padding: '11px', 
                  backgroundColor: copiedSuccess ? 'var(--accent-emerald)' : '#6366f1', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: '600',
                  fontSize: '13px' 
                }}
              >
                {copiedSuccess ? '✓ Copiado com Sucesso!' : 'Copiar Texto do E-mail'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE COTAÇÃO & SOLICITAÇÃO DE REPOSIÇÃO */}
      {quotationModalOpen && (
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
            maxWidth: '680px', 
            padding: '28px', 
            borderRadius: '16px', 
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)', 
            maxHeight: '90vh', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>
                Central de Cotação & Reposição
              </h3>
              <button onClick={() => setQuotationModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
              Listagem consolidada de itens com saldo em nível crítico (saldo ≤ estoque mínimo).
            </p>

            {lowStockProducts.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--accent-emerald)', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '600' }}>Estoque em Perfeito Estado</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Todos os produtos estão com níveis acima da margem de segurança configurada.
                </p>
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1, marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '10px 12px', fontSize: '11px', textTransform: 'uppercase' }}>Produto</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', textTransform: 'uppercase' }}>Local</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase' }}>Saldo Atual</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase' }}>Mínimo</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>Sugestão Compra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map(p => {
                      const min = p.minQuantity ?? 5;
                      const suggest = Math.max(1, (min * 2) - p.quantity);
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: '600', color: '#fff' }}>{p.name}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{p.location || 'Geral'}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#f43f5e', fontWeight: '600' }}>{p.quantity} un</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{min} un</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                            +{suggest} un
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mensagem Formatada */}
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                  Mensagem Formatada para WhatsApp / Fornecedores:
                </label>
                <div style={{ 
                  backgroundColor: 'var(--bg-surface-subtle)', 
                  padding: '14px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-subtle)', 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)', 
                  whiteSpace: 'pre-line', 
                  lineHeight: '1.5', 
                  maxHeight: '140px', 
                  overflowY: 'auto' 
                }}>
                  {generateQuotationText()}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setQuotationModalOpen(false)} 
                style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}
              >
                Fechar
              </button>
              {lowStockProducts.length > 0 && (
                <button 
                  type="button" 
                  onClick={handleCopyQuotationText} 
                  style={{ 
                    flex: 2, 
                    padding: '11px', 
                    backgroundColor: copiedQuoteSuccess ? 'var(--accent-emerald)' : '#0284c7', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: '600',
                    fontSize: '13px' 
                  }}
                >
                  {copiedQuoteSuccess ? '✓ Pedido Copiado!' : 'Copiar Pedido Formatado'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* POP-UP / MODAL CENTRAL FLUIDO PARA CADASTRO / EDIÇÃO DE PRODUTO */}
      {isDrawerOpen && (
        <div className="modal-backdrop" onClick={handleCloseDrawer}>
          <div 
            className="modal-dialog" 
            onClick={e => e.stopPropagation()}
          >
            {/* Header do Pop-up */}
            <div style={{ 
              padding: '18px 24px', 
              borderBottom: '1px solid var(--border-hairline)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              backgroundColor: 'rgba(255, 255, 255, 0.015)'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', letterSpacing: '-0.015em' }}>
                  {editingId ? 'Editar Item do Estoque' : 'Cadastrar Novo Item'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {editingId ? 'Atualize as especificações, localização e saldos.' : 'Preencha os dados técnicos e saldo inicial do produto.'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <kbd style={{ 
                  fontSize: '10px', 
                  padding: '2px 5px', 
                  borderRadius: '4px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-hairline)',
                  pointerEvents: 'none'
                }}>Esc</kbd>
                <button 
                  type="button" 
                  onClick={handleCloseDrawer}
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
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title="Fechar (Esc)"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Corpo do Formulário */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
                
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Nome do Produto *
                  </label>
                  <input 
                    placeholder="Ex: Teclado Mecânico RGB" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    autoFocus
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-hairline)', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Categoria
                    </label>
                    <input 
                      placeholder="Ex: Informática, Cabos" 
                      value={category} 
                      onChange={e => setCategory(e.target.value)} 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-hairline)', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#fff', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Localização Física
                    </label>
                    <input 
                      placeholder="Ex: Prat. B2 - Gav. 04" 
                      value={location} 
                      onChange={e => setLocation(e.target.value)} 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-hairline)', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#fff', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Preço Unitário (R$) *
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={price} 
                      onChange={e => setPrice(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-hairline)', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#fff', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      NF-e Origem
                    </label>
                    <input 
                      placeholder="Ex: 555, 111" 
                      value={invoices} 
                      onChange={e => setInvoices(e.target.value)} 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-hairline)', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#fff', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Saldo Atual *
                    </label>
                    <NumberStepper 
                      value={quantity} 
                      onChange={setQuantity} 
                      min={0} 
                      placeholder="0" 
                      unit="un" 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Estoque Mínimo *
                    </label>
                    <NumberStepper 
                      value={minQuantity} 
                      onChange={setMinQuantity} 
                      min={0} 
                      placeholder="5" 
                      unit="un" 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Descrição Técnica
                  </label>
                  <input 
                    placeholder="Ex: Conector banhado a ouro, cabo reforçado" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-hairline)', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Observações Internas
                  </label>
                  <textarea 
                    rows="2"
                    placeholder="Ex: Fornecedor Betta, lote com 1 ano de garantia" 
                    value={observations} 
                    onChange={e => setObservations(e.target.value)} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-hairline)', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#fff', fontSize: '12.5px', resize: 'vertical' }}
                  />
                </div>

              </div>

              {/* Footer do Pop-up */}
              <div style={{ 
                padding: '16px 24px', 
                borderTop: '1px solid var(--border-hairline)', 
                display: 'flex', 
                gap: '10px', 
                justifyContent: 'flex-end',
                backgroundColor: 'rgba(255, 255, 255, 0.015)'
              }}>
                <button 
                  type="button" 
                  onClick={handleCloseDrawer}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Products;
