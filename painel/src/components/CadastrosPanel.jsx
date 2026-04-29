import { useMemo, useState } from 'react';
import { deleteEntity, saveEntity, uploadImage } from '../services/admin';
import { Package, Tag, Users, Truck, ArrowLeft, Plus, Edit2, Trash, Phone, MapPin, Search, CheckCircle, AlertCircle } from 'lucide-react';

const productInitial = { nome:'', descricao:'', categoriaId:'', preco:'', estoque:0, estoqueMinimo:0, unidade:'UN', categoriaEstoque:'', ativo:true, disponivel:true, imagem:'' };
const categoryInitial = { nome:'', ativa:true };
const customerInitial = { nome:'', telefone:'', cep:'', rua:'', numero:'', bairro:'', cidade:'', complemento:'' };
const deliveryInitial = { nome:'', telefone:'', documento:'', tipoVeiculo:'Moto', placa:'', modelo:'', areaAtuacao:'', disponibilidade:'Disponível', turno:'Livre' };

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{ position:'fixed', top:24, right:24, zIndex:9999, background: type==='ok' ? '#22c55e' : '#ef4444', color:'white', padding:'14px 20px', borderRadius:14, fontWeight:700, display:'flex', alignItems:'center', gap:10, boxShadow:'0 8px 24px rgba(0,0,0,0.2)' }}>
      {type==='ok' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>} {msg}
    </div>
  );
}

function CadastrosPanel({ categories, clientes, entregadores, products, onRefresh }) {
  const [view, setView] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [productForm, setProductForm] = useState(productInitial);
  const [categoryForm, setCategoryForm] = useState(categoryInitial);
  const [customerForm, setCustomerForm] = useState(customerInitial);
  const [deliveryForm, setDeliveryForm] = useState(deliveryInitial);
  const [toast, setToast] = useState(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [saving, setSaving] = useState(false);

  const showToast = (msg, type='ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const reset = () => {
    setView(null); setEditingId(null);
    setProductForm(productInitial); setCategoryForm(categoryInitial);
    setCustomerForm(customerInitial); setDeliveryForm(deliveryInitial);
  };

  const buscarCep = async (cep) => {
    const clean = cep.replace(/\D/g,'');
    if (clean.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setCustomerForm(c => ({ ...c, rua: data.logradouro||'', bairro: data.bairro||'', cidade: data.localidade||'' }));
      } else {
        showToast('CEP não encontrado.', 'err');
      }
    } catch { showToast('Erro ao buscar CEP.', 'err'); }
    finally { setLoadingCep(false); }
  };

  const saveProduct = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await saveEntity('produtos', { 
        ...productForm, 
        categoriaId: String(productForm.categoriaId), 
        preco: Number(productForm.preco), 
        estoque: Number(productForm.estoque), 
        estoqueMinimo: Number(productForm.estoqueMinimo) 
      }, editingId);
      showToast('Produto salvo com sucesso!'); 
      setEditingId(null); setProductForm(productInitial); onRefresh();
    } catch (err) { 
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.response?.data?.[0]?.message || 'Erro ao salvar produto.';
      showToast(msg,'err'); 
    }
    finally { setSaving(false); }
  };

  const saveCategoryHandler = async (e) => {
    e.preventDefault(); setSaving(true);
    try { 
      await saveEntity('categorias', categoryForm, editingId); 
      showToast('Categoria salva!'); 
      setEditingId(null); setCategoryForm(categoryInitial); onRefresh(); 
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.response?.data?.[0]?.message || 'Erro ao salvar categoria.';
      showToast(msg,'err'); 
    }
    finally { setSaving(false); }
  };

  const saveCustomerHandler = async (e) => {
    e.preventDefault();
    if (!customerForm.nome || !customerForm.telefone) { showToast('Nome e telefone são obrigatórios.','err'); return; }
    setSaving(true);
    try {
      const enderecoFormatado = [customerForm.rua, customerForm.numero, customerForm.bairro, customerForm.cidade].filter(Boolean).join(', ');
      await saveEntity('clientes', { ...customerForm, endereco: enderecoFormatado || null }, editingId);
      showToast('Cliente salvo com sucesso! ✅'); 
      setEditingId(null); setCustomerForm(customerInitial); onRefresh();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.response?.data?.[0]?.message || 'Erro ao salvar cliente.';
      showToast(msg, 'err');
    }
    finally { setSaving(false); }
  };

  const saveDeliveryHandler = async (e) => {
    e.preventDefault(); setSaving(true);
    try { 
      await saveEntity('entregadores', deliveryForm, editingId); 
      showToast('Entregador salvo!'); 
      setEditingId(null); setDeliveryForm(deliveryInitial); onRefresh(); 
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.response?.data?.[0]?.message || 'Erro ao salvar entregador.';
      showToast(msg,'err'); 
    }
    finally { setSaving(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const data = new FormData(); data.append('image', file);
    const response = await uploadImage(data);
    setProductForm(c => ({ ...c, imagem: response.url }));
  };

  const actions = useMemo(() => [
    { id:'produto', label:'Produtos', icon:<Package size={32}/>, color:'#4fd1c5', desc:'Gerencie o cardápio e estoque.' },
    { id:'categoria', label:'Categorias', icon:<Tag size={32}/>, color:'#ed8936', desc:'Organize itens por grupos.' },
    { id:'cliente', label:'Clientes', icon:<Users size={32}/>, color:'#4299e1', desc:'Base de dados de consumidores.' },
    { id:'entregador', label:'Entregadores', icon:<Truck size={32}/>, color:'#9f7aea', desc:'Gestão da equipe de logística.' },
  ], []);

  if (!view) return (
    <>
      <Toast msg={toast?.msg} type={toast?.type}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:24 }}>
        {actions.map(a => (
          <button key={a.id} className="stat-card" onClick={() => setView(a.id)}
            style={{ textAlign:'left', cursor:'pointer', display:'flex', flexDirection:'column', gap:20, padding:32 }}>
            <div style={{ width:64, height:64, borderRadius:20, background:`${a.color}15`, color:a.color, display:'flex', alignItems:'center', justifyContent:'center' }}>{a.icon}</div>
            <div><strong style={{ fontSize:20, color:'var(--secondary)' }}>{a.label}</strong>
              <p style={{ color:'var(--text-muted)', marginTop:8, fontSize:14, lineHeight:1.6 }}>{a.desc}</p></div>
          </button>
        ))}
      </div>
    </>
  );

  if (view === 'produto') return (
    <div style={{ display:'grid', gap:32 }}>
      <Toast msg={toast?.msg} type={toast?.type}/>
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={reset} style={backBtn}><ArrowLeft size={18}/> Voltar</button>
        <h2 style={{ fontSize:24, fontWeight:800 }}>Gestão de Produtos</h2>
      </header>
      <form onSubmit={saveProduct} className="table-container" style={{ display:'grid', gap:24, padding:32 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          <Field label="Nome do Produto" value={productForm.nome} onChange={v => setProductForm(c=>({...c,nome:v}))} placeholder="Ex: X-Salada Especial"/>
          <div style={{ display:'grid', gap:8 }}>
            <label style={lbl}>Categoria</label>
            <select value={productForm.categoriaId} onChange={e => setProductForm(c=>({...c,categoriaId:e.target.value}))} style={inp}>
              <option value="">Selecione...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:16 }}>
          <Field label="Preço (R$)" type="number" value={productForm.preco} onChange={v => setProductForm(c=>({...c,preco:v}))}/>
          <Field label="Estoque" type="number" value={productForm.estoque} onChange={v => setProductForm(c=>({...c,estoque:v}))}/>
          <Field label="Mínimo" type="number" value={productForm.estoqueMinimo} onChange={v => setProductForm(c=>({...c,estoqueMinimo:v}))}/>
          <div style={{ display:'grid', gap:8 }}>
            <label style={lbl}>Unidade</label>
            <select value={productForm.unidade} onChange={e => setProductForm(c=>({...c,unidade:e.target.value}))} style={inp}>
              {['UN','KG','LT','BD','CX','PCT'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:24 }}>
          <div style={{ display:'grid', gap:8 }}>
            <label style={lbl}>Descrição</label>
            <textarea value={productForm.descricao} onChange={e => setProductForm(c=>({...c,descricao:e.target.value}))} style={{...inp, minHeight:120}} placeholder="Detalhes do item..."/>
          </div>
          <div style={{ display:'grid', gap:8 }}>
            <label style={lbl}>Imagem</label>
            <div style={{ border:'2px dashed var(--border)', borderRadius:16, height:120, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
              {productForm.imagem ? <img src={productForm.imagem} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <span style={{ color:'var(--text-muted)' }}>Upload</span>}
              <input type="file" onChange={handleUpload} style={{ opacity:0, position:'absolute', inset:0, cursor:'pointer' }}/>
            </div>
          </div>
        </div>
        <button className="btn-primary" type="submit" disabled={saving} style={{ height:56 }}>{saving ? 'Salvando...' : editingId ? 'Atualizar Produto' : 'Salvar Produto'}</button>
      </form>
      <div className="table-container" style={{ padding:0 }}>
        <table style={{ width:'100%' }}>
          <thead><tr><th style={{ paddingLeft:30 }}>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th style={{ textAlign:'right', paddingRight:30 }}>Ações</th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ paddingLeft:30 }}><strong>{p.nome}</strong></td>
                <td><span style={{ background:'#f1f5f9', padding:'4px 8px', borderRadius:6, fontSize:12 }}>{p.categoria?.nome}</span></td>
                <td>R$ {Number(p.preco).toFixed(2)}</td>
                <td style={{ color: p.estoque <= (p.estoqueMinimo||0) ? '#ef4444' : 'inherit', fontWeight: p.estoque <= (p.estoqueMinimo||0) ? 700 : 400 }}>
                  {p.estoque} {p.unidade} {p.estoque <= 0 ? '⚠️ Esgotado' : p.estoque <= (p.estoqueMinimo||0) ? '⚠️ Baixo' : ''}
                </td>
                <td style={{ textAlign:'right', paddingRight:30 }}>
                  <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <button onClick={() => { 
                      setEditingId(p.id); 
                      setProductForm({
                        ...p, 
                        preco: String(p.preco),
                        categoriaId: String(p.categoria_id || p.categoriaId)
                      }) 
                    }} disabled={saving} style={actBtn}><Edit2 size={14}/></button>
                    <button onClick={() => { 
                      if(window.confirm('Tem certeza que deseja excluir este produto?')) { 
                        setSaving(true);
                        deleteEntity('produtos', p.id)
                          .then(() => { showToast('Produto excluído!', 'ok'); onRefresh(); })
                          .catch(err => showToast('Erro ao excluir produto.', 'err'))
                          .finally(() => setSaving(false));
                      } 
                    }} disabled={saving} style={{...actBtn, color:'#f87171'}}><Trash size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (view === 'categoria') return (
    <div style={{ display:'grid', gap:32 }}>
      <Toast msg={toast?.msg} type={toast?.type}/>
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={reset} style={backBtn}><ArrowLeft size={18}/> Voltar</button>
        <h2 style={{ fontSize:24, fontWeight:800 }}>Gestão de Categorias</h2>
      </header>
      
      <div className="table-container" style={{ padding:32 }}>
        <h3 style={{ marginTop:0, marginBottom:20, fontSize:16 }}>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h3>
        <form onSubmit={saveCategoryHandler} style={{ display:'flex', gap:16, alignItems:'flex-end' }}>
          <div style={{ flex:1 }}><Field label="Nome da Categoria" value={categoryForm.nome} onChange={v => setCategoryForm(c=>({...c,nome:v}))} placeholder="Ex: Bebidas, Pizzas, Sobremesas..."/></div>
          <button className="btn-primary" type="submit" disabled={saving} style={{ height:48, padding:'0 32px' }}>
            {saving ? '...' : editingId ? 'Atualizar' : 'Salvar Categoria'}
          </button>
          {editingId && <button type="button" onClick={reset} style={{...backBtn, height:48}}>Cancelar</button>}
        </form>
      </div>

      <div className="table-container" style={{ padding:0 }}>
        <table style={{ width:'100%' }}>
          <thead>
            <tr>
              <th style={{ paddingLeft:30 }}>Nome da Categoria</th>
              <th>Status</th>
              <th style={{ textAlign:'right', paddingRight:30 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td style={{ paddingLeft:30 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--primary)' }}/>
                    <strong style={{ fontSize:15 }}>{c.nome}</strong>
                  </div>
                </td>
                <td>
                  <span style={{ background: c.ativa?'#f0fdf4':'#fff1f2', color: c.ativa?'#16a34a':'#e11d48', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:800 }}>
                    {c.ativa ? 'ATIVA' : 'INATIVA'}
                  </span>
                </td>
                <td style={{ textAlign:'right', paddingRight:30 }}>
                  <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <button onClick={() => { setEditingId(c.id); setCategoryForm({nome:c.nome, ativa:c.ativa}) }} disabled={saving} style={actBtn}><Edit2 size={14}/> Editar</button>
                    <button onClick={() => { 
                      if(window.confirm('Excluir esta categoria? Todos os produtos vinculados também podem ser afetados!')) { 
                        setSaving(true);
                        deleteEntity('categorias', c.id)
                          .then(() => { showToast('Categoria excluída!', 'ok'); onRefresh(); })
                          .catch(err => showToast(err?.response?.data?.error || 'Erro ao excluir categoria.', 'err'))
                          .finally(() => setSaving(false));
                      } 
                    }} disabled={saving} style={{...actBtn, color:'#f87171'}}><Trash size={14}/> Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Nenhuma categoria cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (view === 'cliente') return (
    <div style={{ display:'grid', gap:32 }}>
      <Toast msg={toast?.msg} type={toast?.type}/>
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={reset} style={backBtn}><ArrowLeft size={18}/> Voltar</button>
        <h2 style={{ fontSize:24, fontWeight:800 }}>Diretório de Clientes</h2>
      </header>

      <form onSubmit={saveCustomerHandler} className="table-container" style={{ display:'grid', gap:20, padding:32 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:20 }}>
          <Field label="Nome Completo *" value={customerForm.nome} onChange={v => setCustomerForm(c=>({...c,nome:v}))} placeholder="Ex: João Silva"/>
          <Field label="Telefone / WhatsApp *" value={customerForm.telefone} onChange={v => setCustomerForm(c=>({...c,telefone:v}))} placeholder="(00) 00000-0000"/>
        </div>

        {/* CEP com busca automática */}
        <div style={{ display:'grid', gridTemplateColumns:'180px 1fr 1fr', gap:16, alignItems:'end' }}>
          <div style={{ display:'grid', gap:8 }}>
            <label style={lbl}>CEP {loadingCep && <span style={{ color:'var(--primary)' }}>🔍</span>}</label>
            <input
              type="text" value={customerForm.cep} placeholder="00000-000"
              onChange={e => setCustomerForm(c=>({...c,cep:e.target.value}))}
              onBlur={e => buscarCep(e.target.value)}
              style={inp} maxLength={9}
            />
          </div>
          <Field label="Rua" value={customerForm.rua} onChange={v => setCustomerForm(c=>({...c,rua:v}))} placeholder="Preenchida pelo CEP"/>
          <Field label="Bairro" value={customerForm.bairro} onChange={v => setCustomerForm(c=>({...c,bairro:v}))} placeholder="Preenchido pelo CEP"/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 1fr', gap:16 }}>
          <Field label="Nº" value={customerForm.numero} onChange={v => setCustomerForm(c=>({...c,numero:v}))}/>
          <Field label="Cidade" value={customerForm.cidade} onChange={v => setCustomerForm(c=>({...c,cidade:v}))} placeholder="Preenchida pelo CEP"/>
          <Field label="Complemento" value={customerForm.complemento} onChange={v => setCustomerForm(c=>({...c,complemento:v}))} placeholder="Apto, Bloco..."/>
        </div>

        <button className="btn-primary" type="submit" disabled={saving} style={{ height:52 }}>
          {saving ? 'Salvando...' : editingId ? 'Atualizar Cliente' : 'Salvar Cliente'}
        </button>
      </form>

      <div className="table-container" style={{ padding:0 }}>
        <table style={{ width:'100%' }}>
          <thead><tr><th style={{ paddingLeft:30 }}>Cliente</th><th>Localização</th><th>Contato</th><th style={{ textAlign:'right', paddingRight:30 }}>Ações</th></tr></thead>
          <tbody>
            {clientes.map(c => (
              <tr key={c.id}>
                <td style={{ paddingLeft:30 }}>
                  <div style={{ fontWeight:700 }}>{c.nome}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>ID #{c.id}</div>
                </td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
                    <MapPin size={14} color="var(--primary)"/>
                    {c.rua ? `${c.rua}, ${c.numero||''} - ${c.bairro||''}` : c.endereco || '—'}
                  </div>
                </td>
                <td>
                  <a href={`https://wa.me/55${(c.telefone||'').replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:6, color:'#25D366', fontWeight:700, fontSize:13, textDecoration:'none' }}>
                    <Phone size={14}/> {c.telefone}
                  </a>
                </td>
                <td style={{ textAlign:'right', paddingRight:30 }}>
                  <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <button onClick={() => { setEditingId(c.id); setCustomerForm({...customerInitial,...c}) }} disabled={saving} style={actBtn}><Edit2 size={14}/></button>
                    <button onClick={() => {
                      if(window.confirm('Excluir permanentemente este cliente?')) {
                        setSaving(true);
                        deleteEntity('clientes', c.id)
                          .then(() => { showToast('Cliente excluído!', 'ok'); onRefresh(); })
                          .catch(err => showToast(err?.response?.data?.error || 'Erro ao excluir cliente.', 'err'))
                          .finally(() => setSaving(false));
                      }
                    }} disabled={saving} style={{...actBtn, color:'#f87171'}}><Trash size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ENTREGADORES
  return (
    <div style={{ display:'grid', gap:32 }}>
      <Toast msg={toast?.msg} type={toast?.type}/>
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={reset} style={backBtn}><ArrowLeft size={18}/> Voltar</button>
        <h2 style={{ fontSize:24, fontWeight:800 }}>Equipe de Entregadores</h2>
      </header>
      <form onSubmit={saveDeliveryHandler} className="table-container" style={{ display:'grid', gap:20, padding:32 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <Field label="Nome do Entregador" value={deliveryForm.nome} onChange={v => setDeliveryForm(c=>({...c,nome:v}))}/>
          <Field label="Telefone" value={deliveryForm.telefone} onChange={v => setDeliveryForm(c=>({...c,telefone:v}))}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
          <div style={{ display:'grid', gap:8 }}>
            <label style={lbl}>Veículo</label>
            <select value={deliveryForm.tipoVeiculo} onChange={e => setDeliveryForm(c=>({...c,tipoVeiculo:e.target.value}))} style={inp}>
              {['Moto','Carro','Bicicleta','Van'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <Field label="Modelo" value={deliveryForm.modelo} onChange={v => setDeliveryForm(c=>({...c,modelo:v}))}/>
          <Field label="Placa" value={deliveryForm.placa} onChange={v => setDeliveryForm(c=>({...c,placa:v}))}/>
        </div>
        <button className="btn-primary" type="submit" disabled={saving} style={{ height:52 }}>{saving ? 'Salvando...' : 'Salvar Entregador'}</button>
      </form>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20 }}>
        {entregadores.map(e => (
          <div key={e.id} className="stat-card" style={{ display:'grid', gap:16, padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <strong style={{ fontSize:18 }}>{e.nome}</strong>
                <div style={{ color:'var(--text-muted)', fontSize:13, marginTop:4 }}>{e.tipoVeiculo} • {e.placa||'Sem Placa'}</div>
              </div>
              <span style={{ padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:800, background: e.disponibilidade==='Disponível'?'#f0fff4':'#fff5f5', color: e.disponibilidade==='Disponível'?'#2f855a':'#c53030' }}>{e.disponibilidade}</span>
            </div>
            <div style={{ display:'flex', gap:8, borderTop:'1px solid #f1f5f9', paddingTop:16 }}>
              <button onClick={() => { setEditingId(e.id); setDeliveryForm(e) }} disabled={saving} style={{...actBtn, flex:1, justifyContent:'center'}}><Edit2 size={14}/> Editar</button>
              <button onClick={() => {
                if(window.confirm('Excluir este entregador do sistema?')) {
                  setSaving(true);
                  deleteEntity('entregadores', e.id)
                    .then(() => { showToast('Entregador excluído!', 'ok'); onRefresh(); })
                    .catch(err => showToast(err?.response?.data?.error || 'Erro ao excluir entregador.', 'err'))
                    .finally(() => setSaving(false));
                }
              }} disabled={saving} style={{...actBtn, flex:1, justifyContent:'center', color:'#f87171'}}><Trash size={14}/> Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type='text', placeholder }) {
  return (
    <div style={{ display:'grid', gap:8 }}>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inp}/>
    </div>
  );
}

const inp = { width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid var(--border)', fontSize:'14px', background:'#f8fafc', outline:'none' };
const lbl = { fontSize:'12px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginLeft:4 };
const backBtn = { display:'flex', alignItems:'center', gap:8, background:'white', border:'1px solid var(--border)', padding:'10px 16px', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', color:'var(--text-main)' };
const actBtn = { display:'flex', alignItems:'center', gap:8, background:'#f8fafc', border:'1px solid var(--border)', padding:8, borderRadius:10, cursor:'pointer', color:'var(--text-muted)', transition:'0.2s' };

export default CadastrosPanel;