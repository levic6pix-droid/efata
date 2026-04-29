function CheckoutForm({
  checkoutData,
  onChange,
  onSubmit,
  submitting,
  total,
  onBack,
}) {
  const fieldStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    border: '1px solid var(--border)',
    outline: 'none',
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>Entrega</h3>
        <button type="button" onClick={onBack} style={{ background: 'none' }}>
          Voltar
        </button>
      </div>

      <input
        required
        placeholder="Nome completo"
        style={fieldStyle}
        value={checkoutData.nome}
        onChange={(event) => onChange('nome', event.target.value)}
      />
      <input
        required
        placeholder="Telefone"
        style={fieldStyle}
        value={checkoutData.telefone}
        onChange={(event) => onChange('telefone', event.target.value)}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <input
          required
          placeholder="Rua"
          style={fieldStyle}
          value={checkoutData.rua}
          onChange={(event) => onChange('rua', event.target.value)}
        />
        <input
          required
          placeholder="Número"
          style={fieldStyle}
          value={checkoutData.numero}
          onChange={(event) => onChange('numero', event.target.value)}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <input
          required
          placeholder="Bairro"
          style={fieldStyle}
          value={checkoutData.bairro}
          onChange={(event) => onChange('bairro', event.target.value)}
        />
        <input
          placeholder="Cidade"
          style={fieldStyle}
          value={checkoutData.cidade}
          onChange={(event) => onChange('cidade', event.target.value)}
        />
      </div>
      <input
        placeholder="Complemento"
        style={fieldStyle}
        value={checkoutData.complemento}
        onChange={(event) => onChange('complemento', event.target.value)}
      />
      <select
        style={fieldStyle}
        value={checkoutData.formaPagamento}
        onChange={(event) => onChange('formaPagamento', event.target.value)}
      >
        <option value="pix">Pix</option>
        <option value="cartao_credito">Cartão de crédito</option>
        <option value="cartao_debito">Cartão de débito</option>
        <option value="dinheiro">Dinheiro</option>
      </select>

      <button
        type="submit"
        disabled={submitting}
        style={{
          marginTop: 8,
          background: 'var(--primary)',
          color: 'white',
          padding: '18px',
          borderRadius: 18,
          fontWeight: 800,
        }}
      >
        {submitting
          ? 'Enviando pedido...'
          : `Confirmar pedido • R$ ${total.toFixed(2)}`}
      </button>
    </form>
  );
}

export default CheckoutForm;