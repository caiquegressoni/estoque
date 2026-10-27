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
    fetchProducts();
  }, []);

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
        handleCancelEdit();
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>
            Estoque & Almoxarifado
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Controle de inventário, posições de prateleiras e ponto de reposição.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setQuotationModalOpen(true)}
            style={{
              backgroundColor: lowStockCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              color: lowStockCount > 0 ? '#f43f5e' : 'var(--text-secondary)',
              border: lowStockCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)',
              padding: '9px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.18s ease'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: lowStockCount > 0 ? '#f43f5e' : 'var(--text-muted)' }} />
            Cotação de Reposição ({lowStockCount})
          </button>
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
              gap: '6px' 
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS (KPIs) MINIMALISTAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        
        <div style={{ 
          backgroundColor: 'var(--bg-surface)', 
          padding: '20px 22px', 
          borderRadius: '12px', 
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>
            Itens Cadastrados
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
            <h3 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>{totalProducts}</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SKUs ativos</span>
          </div>
        </div>

        <div style={{ 
          backgroundColor: 'var(--bg-surface)', 
          padding: '20px 22px', 
          borderRadius: '12px', 
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>
            Volume Físico Total
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
            <h3 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>
              {totalQuantity} <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-muted)' }}>un</span>
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: '500' }}>Saldo geral</span>
          </div>
        </div>

        <div style={{ 
          backgroundColor: 'var(--bg-surface)', 
          padding: '20px 22px', 
          borderRadius: '12px', 
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>
            Valor do Patrimônio
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
            <h3 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>
              R$ {totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: '500' }}>Custo total</span>
          </div>
        </div>

        <div style={{ 
          backgroundColor: 'var(--bg-surface)', 
          padding: '20px 22px', 
          borderRadius: '12px', 
          border: lowStockCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          <span style={{ fontSize: '11px', color: lowStockCount > 0 ? '#f43f5e' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>
            Itens Críticos (Reposição)
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
            <h3 style={{ fontSize: '26px', fontWeight: '700', color: lowStockCount > 0 ? '#f43f5e' : '#fff', letterSpacing: '-0.02em' }}>
              {lowStockCount}
            </h3>
            <span style={{ 
              fontSize: '12px', 
              color: lowStockCount > 0 ? '#f43f5e' : 'var(--accent-emerald)', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {lowStockCount > 0 ? '● Atenção' : '● Em dia'}
            </span>
          </div>
        </div>

      </div>

      {/* Formulário de Produto Minimalista */}
      <section style={{ 
        backgroundColor: 'var(--bg-surface)', 
        padding: '24px', 
        borderRadius: '12px', 
        marginBottom: '32px', 
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', letterSpacing: '-0.01em' }}>
            {editingId ? 'Editar Item do Estoque' : 'Cadastrar Novo Item'}
          </h2>
          {editingId && (
            <span style={{ fontSize: '12px', color: 'var(--accent-amber)', fontWeight: '500' }}>
              Modo de Edição Ativo
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Nome do Produto *
            </label>
            <input 
              placeholder="Ex: Teclado Mecânico" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Categoria
            </label>
            <input 
              placeholder="Ex: Informática, Cabos" 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Localização Física
            </label>
            <input 
              placeholder="Ex: Prat. B2 - Gav. 04" 
              value={location} 
              onChange={e => setLocation(e.target.value)} 
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Preço Unitário (R$) *
            </label>
            <input 
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              required 
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              NF-e Origem
            </label>
            <input 
              placeholder="Ex: 555, 111" 
              value={invoices} 
              onChange={e => setInvoices(e.target.value)} 
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Descrição Breve
            </label>
            <input 
              placeholder="Ex: Conector banhado a ouro" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Observações
            </label>
            <input 
              placeholder="Ex: Fornecedor Betta, 1 ano garantia" 
              value={observations} 
              onChange={e => setObservations(e.target.value)} 
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)', color: '#fff', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', gridColumn: '1 / -1', marginTop: '6px' }}>
            <button 
              type="submit" 
              style={{ 
                flex: 1, 
                backgroundColor: editingId ? '#0284c7' : 'var(--accent-emerald)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: '600', 
                fontSize: '13px',
                padding: '11px 18px',
                boxShadow: editingId ? '0 4px 12px rgba(2, 132, 199, 0.25)' : '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              {editingId ? 'Salvar Alterações' : 'Adicionar ao Estoque'}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={handleCancelEdit} 
                style={{ 
                  backgroundColor: 'transparent', 
                  color: 'var(--text-secondary)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  padding: '11px 18px',
                  fontSize: '13px' 
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      {/* BARRA DE PESQUISA & FILTROS (Estilo Segmented Control) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Segmented Control de Status */}
          <div style={{ 
            display: 'flex', 
            backgroundColor: 'var(--bg-surface-subtle)', 
            borderRadius: '8px', 
            padding: '3px', 
            border: '1px solid var(--border-subtle)' 
          }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              style={{
                backgroundColor: statusFilter === 'ALL' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: statusFilter === 'ALL' ? '#fff' : 'var(--text-secondary)',
                border: 'none', 
                padding: '6px 14px', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '12.5px', 
                fontWeight: statusFilter === 'ALL' ? '600' : '500'
              }}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setStatusFilter('LOW')}
              style={{
                backgroundColor: statusFilter === 'LOW' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
                color: statusFilter === 'LOW' ? '#f43f5e' : 'var(--text-secondary)',
                border: 'none', 
                padding: '6px 14px', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '12.5px', 
                fontWeight: statusFilter === 'LOW' ? '600' : '500'
              }}
            >
              Críticos ({lowStockCount})
            </button>
            <button
              onClick={() => setStatusFilter('OK')}
              style={{
                backgroundColor: statusFilter === 'OK' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: statusFilter === 'OK' ? '#10b981' : 'var(--text-secondary)',
                border: 'none', 
                padding: '6px 14px', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '12.5px', 
                fontWeight: statusFilter === 'OK' ? '600' : '500'
              }}
            >
              Regular ({products.length - lowStockCount})
            </button>
          </div>

          {/* Filtro por Categoria */}
          {uniqueCategories.length > 1 && (
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ 
                padding: '7px 12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-subtle)', 
                backgroundColor: 'var(--bg-surface-subtle)', 
                color: '#fff', 
                fontSize: '12.5px',
                cursor: 'pointer'
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
            placeholder="Buscar por nome, prateleira, NF..."
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

      {/* TABELA DE PRODUTOS MINIMALISTA */}
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
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>Item / Categoria</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>Localização</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>NF-e Origem</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>Preço Unit.</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600' }}>Saldo / Mínimo</th>
              <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
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
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '600', color: '#fff', fontSize: '13.5px' }}>{p.name}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                        {p.category && (
                          <span style={{ 
                            backgroundColor: 'rgba(56, 189, 248, 0.1)', 
                            color: 'var(--accent-cyan)', 
                            padding: '2px 7px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: '600' 
                          }}>
                            {p.category}
                          </span>
                        )}
                        {p.description && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.description}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {p.location ? (
                        <span style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                          color: '#e2e8f0', 
                          padding: '3px 9px', 
                          borderRadius: '6px', 
                          fontSize: '12px', 
                          fontWeight: '500',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          {p.location}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {p.invoices ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {p.invoices.split(',').map((nf, idx) => (
                            <span key={idx} style={{ 
                              backgroundColor: 'rgba(2, 132, 199, 0.15)', 
                              color: '#38bdf8', 
                              padding: '2px 7px', 
                              borderRadius: '4px', 
                              fontSize: '11px', 
                              fontWeight: '600' 
                            }}>
                              NF {nf.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '500' }}>
                      R$ {Number(p.price).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          backgroundColor: isCritical ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)', 
                          color: isCritical ? '#f43f5e' : '#10b981',
                          border: isCritical ? '1px solid rgba(244, 63, 94, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                          padding: '3px 9px', 
                          borderRadius: '999px', 
                          fontSize: '11.5px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isCritical ? '#f43f5e' : '#10b981' }} />
                          {p.quantity} un
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          (mín: {min})
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {/* MOVIMENTAR */}
                        <button 
                          onClick={() => openMovementModal(p)} 
                          style={{ 
                            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                            color: '#34d399', 
                            border: '1px solid rgba(16, 185, 129, 0.25)', 
                            padding: '6px 10px', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            fontWeight: '600',
                            fontSize: '12px'
                          }}
                          title="Registrar Entrada ou Saída"
                        >
                          Movimentar
                        </button>

                        {/* DEVOLUÇÃO */}
                        <button 
                          onClick={() => openReturnModal(p)} 
                          style={{ 
                            backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                            color: '#a5b4fc', 
                            border: '1px solid rgba(99, 102, 241, 0.25)', 
                            padding: '6px 10px', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            fontWeight: '500',
                            fontSize: '12px'
                          }}
                          title="Gerar e-mail de devolução/RMA"
                        >
                          RMA
                        </button>

                        {/* EDITAR */}
                        <button 
                          onClick={() => handleEditClick(p)} 
                          style={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                            color: 'var(--text-secondary)', 
                            border: '1px solid var(--border-subtle)', 
                            padding: '6px 10px', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            fontWeight: '500',
                            fontSize: '12px'
                          }}
                          title="Editar"
                        >
                          Editar
                        </button>

                        {/* EXCLUIR */}
                        <button 
                          onClick={() => handleDeleteProduct(p.id)} 
                          style={{ 
                            backgroundColor: 'rgba(244, 63, 94, 0.08)', 
                            color: '#f43f5e', 
                            border: '1px solid rgba(244, 63, 94, 0.2)', 
                            padding: '6px 10px', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            fontWeight: '500',
                            fontSize: '12px'
                          }}
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

    </div>
  );
}

export default Products;
