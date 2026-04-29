import { ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import CartDrawer from '../components/CartDrawer';
import CategoryTabs from '../components/CategoryTabs';
import ProductCard from '../components/ProductCard';
import SupportChat from '../components/SupportChat';
import { useStorefrontData } from '../hooks/useStorefrontData';
import useCartStore from '../store/useCartStore';
import { createOrder } from '../services/storefront';

const initialCheckout = {
  nome: '',
  telefone: '',
  rua: '',
  numero: '',
  bairro: '',
  cidade: '',
  complemento: '',
  formaPagamento: 'pix',
};

function StorefrontPage() {
  const { categories, error, loading, products, reload } = useStorefrontData();
  const {
    cart,
    isCartOpen,
    addToCart,
    clearCart,
    removeFromCart,
    setCartOpen,
    updateQuantity,
    getCartTotal,
  } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [drawerMode, setDrawerMode] = useState('cart');
  const [checkoutData, setCheckoutData] = useState(initialCheckout);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    reload();
  }, [reload]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch =
        selectedCategory === 'all' || product.categoria?.id === selectedCategory;
      const searchMatch = `${product.nome} ${product.descricao || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());

      return categoryMatch && searchMatch;
    });
  }, [products, search, selectedCategory]);

  const subtotal = getCartTotal();
  const total = subtotal;

  const handleCheckoutDataChange = (field, value) => {
    setCheckoutData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmitOrder = async (event) => {
    event.preventDefault();

    if (cart.length === 0) {
      return;
    }

    setSubmitting(true);
    setFeedback('');

    try {
      await createOrder({
        cliente: {
          nome: checkoutData.nome,
          telefone: checkoutData.telefone,
          rua: checkoutData.rua,
          numero: checkoutData.numero,
          bairro: checkoutData.bairro,
          cidade: checkoutData.cidade,
          complemento: checkoutData.complemento,
        },
        forma_pagamento: checkoutData.formaPagamento,
        itens: cart.map((item) => ({
          produto_id: item.id,
          quantidade: item.quantity,
          observacao: item.observacao || '',
        })),
      });

      setFeedback('Pedido enviado com sucesso!');
      clearCart();
      setCheckoutData(initialCheckout);
      setDrawerMode('cart');
      setCartOpen(false);
      reload();
    } catch (submitError) {
      setFeedback(
        submitError.response?.data?.error || 'Não foi possível finalizar o pedido.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <header
        style={{
          padding: '32px 24px',
          maxWidth: 1220,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 14 }}>
            DELIVERY UNIFICADO
          </div>
          <h1 style={{ fontSize: 36, marginTop: 10 }}>Peça no cardápio oficial</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            Frontend conectado ao backend Prisma único.
          </p>
        </div>

        <button
          onClick={() => setCartOpen(true)}
          style={{
            background: 'white',
            borderRadius: 20,
            padding: '16px 18px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontWeight: 800,
          }}
        >
          <ShoppingBag size={20} />
          Carrinho ({cart.length})
        </button>
      </header>

      <main style={{ maxWidth: 1220, margin: '0 auto', padding: '0 24px 48px' }}>
        <section
          style={{
            background: 'linear-gradient(135deg, #2d3748, #111827)',
            color: 'white',
            borderRadius: 30,
            padding: 32,
            display: 'grid',
            gap: 18,
            marginBottom: 28,
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>
            Hambúrgueres, pizzas, bebidas e muito mais
          </span>
          <h2 style={{ fontSize: 34, lineHeight: 1.2, maxWidth: 540 }}>
            Checkout corrigido, estoque em tempo real e pedidos chegando no painel.
          </h2>
          <input
            placeholder="Buscar pratos ou categorias"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width: '100%',
              maxWidth: 420,
              padding: '16px 18px',
              borderRadius: 16,
              border: 'none',
              outline: 'none',
            }}
          />
        </section>

        <section style={{ marginBottom: 24 }}>
          <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </section>

        {feedback && (
          <div
            style={{
              marginBottom: 20,
              padding: '14px 16px',
              borderRadius: 16,
              background: feedback.includes('sucesso') ? '#e8fff1' : '#fff5f5',
              color: feedback.includes('sucesso') ? '#1f7a45' : '#b63b3b',
            }}
          >
            {feedback}
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: '14px 16px',
              borderRadius: 16,
              background: '#fff5f5',
              color: '#b63b3b',
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Carregando cardápio...</div>
        ) : (
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 22,
            }}
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={(item) => {
                  addToCart({
                    id: item.id,
                    name: item.nome,
                    price: Number(item.preco),
                    image: item.imagem,
                    estoque: item.estoque,
                  });
                }}
              />
            ))}
          </section>
        )}
      </main>

      <CartDrawer
        cart={cart}
        checkoutData={checkoutData}
        isOpen={isCartOpen}
        mode={drawerMode}
        onCheckout={handleSubmitOrder}
        onCheckoutDataChange={handleCheckoutDataChange}
        onClose={() => {
          setCartOpen(false);
          setDrawerMode('cart');
        }}
        onModeChange={setDrawerMode}
        onQuantityChange={updateQuantity}
        onRemove={removeFromCart}
        subtotal={subtotal}
        submitting={submitting}
        total={total}
      />

      <SupportChat />
    </div>
  );
}

export default StorefrontPage;