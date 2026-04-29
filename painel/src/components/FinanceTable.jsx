import { TrendingUp, TrendingDown, Calendar, Lock, Unlock, Printer, DollarSign, CreditCard, BarChart2, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import http from '../services/http';

function fmt(v) { return `R$ ${Number(v || 0).toFixed(2)}`; }

function imprimirFechamento(totais, abertoEm) {
  const agora = new Date().toLocaleString('pt-BR');
  const abertura = abertoEm ? new Date(abertoEm).toLocaleString('pt-BR') : '—';
  const w = window.open('', '', 'width=340,height=600');
  w.document.write(`
    <html><head><style>
      body{font-family:monospace;font-size:13px;margin:20px}
      h2{text-align:center;font-size:16px}
      .linha{display:flex;justify-content:space-between;border-bottom:1px dashed #ccc;padding:6px 0}
      .total{font-size:16px;font-weight:bold}
    </style></head><body>
      <h2>EFATA DELIVERY</h2>
      <h2>FECHAMENTO DE CAIXA</h2>
      <div class="linha"><span>Abertura:</span><span>${abertura}</span></div>
      <div class="linha"><span>Fechamento:</span><span>${agora}</span></div>
      <div class="linha"><span>Qtd. Vendas:</span><span>${totais.qtdVendas}</span></div>
      <br/>
      <div class="linha"><span>Dinheiro:</span><span>${fmt(totais.dinheiro)}</span></div>
      <div class="linha"><span>PIX:</span><span>${fmt(totais.pix)}</span></div>
      <div class="linha"><span>Cartão:</span><span>${fmt(totais.cartao)}</span></div>
      <br/>
      <div class="linha total"><span>TOTAL:</span><span>${fmt(totais.total)}</span></div>
      <br/><p style="text-align:center">Obrigado!</p>
    </body></html>
  `);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

function FinanceTable() {
  const [caixaStatus, setCaixaStatus] = useState({ status: 'fechado', saldo_inicial: 0, aberto_em: null });
  const [fundoCaixa, setFundoCaixa] = useState('');
  const [showFechamento, setShowFechamento] = useState(false);
  const [relatorio, setRelatorio] = useState({ vendas: [], totais: { total: 0, dinheiro: 0, pix: 0, cartao: 0, qtdVendas: 0 } });
  const [loading, setLoading] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState(new Date().toISOString().slice(0, 10));
  const [showMovimentacao, setShowMovimentacao] = useState(null); // 'sangria' | 'suprimento'
  const [movValor, setMovValor] = useState('');
  const [movDesc, setMovDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Carrega status do caixa do servidor
  const loadCaixaStatus = useCallback(async () => {
    try {
      const res = await http.get('/caixa/status');
      setCaixaStatus(res.data);
    } catch (e) {
      console.error('Erro ao carregar status do caixa:', e);
    }
  }, []);

  const carregarRelatorio = useCallback(async (dia) => {
    setLoading(true);
    try {
      const res = await http.get(`/pdv/relatorio?dia=${dia || diaSelecionado}`);
      setRelatorio(res.data);
    } catch { setRelatorio({ vendas: [], totais: { total: 0, dinheiro: 0, pix: 0, cartao: 0, qtdVendas: 0 } }); }
    finally { setLoading(false); }
  }, [diaSelecionado]);

  useEffect(() => { 
    loadCaixaStatus();
    carregarRelatorio(); 
  }, [loadCaixaStatus, carregarRelatorio]);

  const abrirCaixa = async () => {
    if (fundoCaixa === '') return alert('Informe o fundo de troco (pode ser 0).');
    setSaving(true);
    try {
      const res = await http.post('/caixa/abrir', { saldo_inicial: Number(fundoCaixa) });
      setCaixaStatus(res.data);
      setFundoCaixa('');
      carregarRelatorio();
    } catch (e) {
      alert(e.response?.data?.error || 'Erro ao abrir caixa');
    } finally {
      setSaving(false);
    }
  };

  const fecharCaixa = async () => {
    setSaving(true);
    try {
      await http.post('/caixa/fechar');
      imprimirFechamento(relatorio.totais, caixaStatus.aberto_em);
      setCaixaStatus({ status: 'fechado', saldo_inicial: 0, aberto_em: null });
      setShowFechamento(false);
      carregarRelatorio();
    } catch (e) {
      alert(e.response?.data?.error || 'Erro ao fechar caixa');
    } finally {
      setSaving(false);
    }
  };

  const saldoAtual = Number(caixaStatus.saldo_inicial || 0) + relatorio.totais.total;
  const { totais, vendas } = relatorio;

  const realizarMovimentacao = async () => {
    if (!movValor || Number(movValor) <= 0) return alert('Informe um valor válido.');
    setSaving(true);
    try {
      await http.post('/pdv/movimentacao', { tipo: showMovimentacao, valor: Number(movValor), descricao: movDesc });
      setShowMovimentacao(null);
      setMovValor('');
      setMovDesc('');
      carregarRelatorio();
    } catch (e) {
      alert(e.response?.data?.error || 'Erro na movimentação');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ─── CARDS TOPO ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>

        {/* Status Caixa */}
        <div className="table-container" style={{ padding: 24, background: caixaStatus.status === 'aberto' ? '#f0fdf4' : '#f8fafc', border: `2px solid ${caixaStatus.status === 'aberto' ? '#bbf7d0' : 'var(--border)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: caixaStatus.status === 'aberto' ? '#22c55e' : '#94a3b8', color: 'white', padding: 14, borderRadius: 14 }}>
              {caixaStatus.status === 'aberto' ? <Unlock size={24}/> : <Lock size={24}/>}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{caixaStatus.status === 'aberto' ? 'Caixa Aberto' : 'Caixa Fechado'}</div>
              {caixaStatus.status === 'aberto' && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Desde {new Date(caixaStatus.aberto_em).toLocaleTimeString('pt-BR')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Saldo / Fundo */}
        {caixaStatus.status === 'aberto' ? (
          <div className="table-container" style={{ padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Saldo Estimado</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>{fmt(saldoAtual)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Fundo: {fmt(caixaStatus.saldo_inicial)} + Vendas: {fmt(totais.total)}</div>
          </div>
        ) : (
          <div className="table-container" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fundo de Troco Inicial (R$)</span>
            <input type="number" value={fundoCaixa} onChange={e => setFundoCaixa(e.target.value)} placeholder="0.00"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 18, fontWeight: 700 }}/>
            <button onClick={abrirCaixa} disabled={saving} className="btn-primary" style={{ width: '100%', height: 44, fontSize: 14 }}>
              <Unlock size={16}/> {saving ? 'ABRINDO...' : 'ABRIR CAIXA AGORA'}
            </button>
          </div>
        )}

        {/* Total Dia */}
        <div className="table-container" style={{ padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Total do Dia</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>{fmt(totais.total)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{totais.qtdVendas} venda(s)</div>
        </div>

        {/* Breakdown por pagamento */}
        <div className="table-container" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Por Forma de Pagamento</div>
          {[
            { label: 'Dinheiro', valor: totais.dinheiro, color: '#22c55e' },
            { label: 'PIX', valor: totais.pix, color: '#3b82f6' },
            { label: 'Cartão', valor: totais.cartao, color: '#8b5cf6' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</span>
              <strong style={{ color: item.color }}>{fmt(item.valor)}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* ─── AÇÕES ────────────────────────────────────────────── */}
      {caixaStatus.status === 'aberto' && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => { loadCaixaStatus(); carregarRelatorio(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}>
            <RefreshCw size={16}/> Atualizar
          </button>
          <button onClick={() => setShowMovimentacao('suprimento')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}>
            <TrendingUp size={16}/> Suprimento (+)
          </button>
          <button onClick={() => setShowMovimentacao('sangria')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}>
            <TrendingDown size={16}/> Sangria (-)
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={() => imprimirFechamento(totais, caixaStatus.aberto_em)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}>
            <Printer size={16}/> Imprimir Parcial
          </button>
          <button onClick={() => setShowFechamento(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}>
            <Lock size={16}/> Fechar Caixa
          </button>
        </div>
      )}

      {/* ─── FILTRO DE DATA + TABELA ──────────────────────────── */}
      <div className="table-container" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800 }}><BarChart2 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }}/>Vendas do Dia</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="date" value={diaSelecionado} onChange={e => { setDiaSelecionado(e.target.value); carregarRelatorio(e.target.value); }}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14 }}/>
          </div>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 400 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24 }}>Horário</th>
                  <th>Pagamento</th>
                  <th>Itens</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {vendas.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhuma venda nesta data.</td></tr>
                ) : vendas.map(v => (
                  <tr key={v.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <Calendar size={14} color="var(--text-muted)"/>
                        {new Date(v.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                        {v.pagamento}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {v.venda_itens?.map(i => `${i.nome} x${i.quantidade}`).join(', ') || '—'}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24, fontWeight: 800, color: 'var(--primary)' }}>
                      {fmt(v.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── Modal Fechamento ─────────────────────────────────── */}
      {showFechamento && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', width: 500, borderRadius: 24, overflow: 'hidden' }}>
            <div style={{ background: '#1e293b', padding: '28px 20px', textAlign: 'center', color: 'white' }}>
              <h2 style={{ margin: 0 }}>Fechamento de Caixa</h2>
              <p style={{ opacity: 0.7, margin: '6px 0 0', fontSize: 14 }}>Relatório final do turno — será impresso e salvo no banco</p>
            </div>
            <div style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14 }}>
              {[
                { label: 'Fundo Inicial:', val: fmt(caixaStatus.saldo_inicial), color: null },
                { label: 'Qtd. de Vendas:', val: totais.qtdVendas, color: null },
                { label: 'Dinheiro:', val: fmt(totais.dinheiro), color: '#22c55e' },
                { label: 'PIX:', val: fmt(totais.pix), color: '#3b82f6' },
                { label: 'Cartão:', val: fmt(totais.cartao), color: '#8b5cf6' },
                { label: 'TOTAL DE VENDAS:', val: fmt(totais.total), color: 'var(--primary)', bold: true },
                { label: 'SALDO FINAL ESTIMADO:', val: fmt(saldoAtual), color: 'var(--primary)', bold: true },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px dashed #e2e8f0' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: row.bold ? 800 : 400 }}>{row.label}</span>
                  <strong style={{ color: row.color || 'var(--text-main)', fontSize: row.bold ? 18 : 14 }}>{row.val}</strong>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 36px 32px', display: 'flex', gap: 12 }}>
              <button onClick={() => setShowFechamento(false)} disabled={saving} style={{ flex: 1, height: 48, borderRadius: 12, border: '1px solid var(--border)', background: 'white', fontWeight: 700, cursor: 'pointer' }}>CANCELAR</button>
              <button onClick={fecharCaixa} disabled={saving} style={{ flex: 1, height: 48, borderRadius: 12, background: '#ef4444', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Printer size={16}/> {saving ? 'FECHANDO...' : 'CONFIRMAR FECHAMENTO'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── Modal Movimentação ───────────────────────────────── */}
      {showMovimentacao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', width: 450, borderRadius: 24, overflow: 'hidden' }}>
            <div style={{ background: showMovimentacao === 'sangria' ? '#ef4444' : '#22c55e', padding: '24px', textAlign: 'center', color: 'white' }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{showMovimentacao.toUpperCase()}</h2>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>VALOR (R$)</label>
                <input type="number" value={movValor} onChange={e => setMovValor(e.target.value)} placeholder="0.00" autoFocus
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 20, fontWeight: 800 }}/>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>DESCRIÇÃO / MOTIVO</label>
                <input type="text" value={movDesc} onChange={e => setMovDesc(e.target.value)} placeholder="Ex: Retirada para pagamento de fornecedor"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}/>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button onClick={() => setShowMovimentacao(null)} disabled={saving} style={{ flex: 1, height: 48, borderRadius: 12, border: '1px solid var(--border)', background: 'white', fontWeight: 700, cursor: 'pointer' }}>CANCELAR</button>
                <button onClick={realizarMovimentacao} disabled={saving} style={{ flex: 1, height: 48, borderRadius: 12, background: showMovimentacao === 'sangria' ? '#ef4444' : '#22c55e', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
                  {saving ? 'PROCESSANDO...' : 'CONFIRMAR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinanceTable;