import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [carrinho, setCarrinho] = useState(() => {
    const saved = localStorage.getItem('efata_carrinho');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('efata_carrinho', JSON.stringify(carrinho));
  }, [carrinho]);

  const addAoCarrinho = (produto, quantidade = 1, observacao = '') => {
    setCarrinho(prev => {
      const exist = prev.find(i => i.id === produto.id && i.observacao === observacao);
      if (exist) {
        return prev.map(i => i.id === produto.id && i.observacao === observacao ? { ...i, quantidade: i.quantidade + quantidade } : i);
      }
      return [...prev, { ...produto, quantidade, observacao }];
    });
  };

  const updateQuantidade = (produtoId, quantidade, observacao = '') => {
    if (quantidade <= 0) {
      return removerDoCarrinho(produtoId, observacao);
    }
    setCarrinho(prev => prev.map(i => i.id === produtoId && i.observacao === observacao ? { ...i, quantidade } : i));
  };

  const removerDoCarrinho = (produtoId, observacao = '') => {
    setCarrinho(prev => prev.filter(i => !(i.id === produtoId && i.observacao === observacao)));
  };

  const limparCarrinho = () => setCarrinho([]);

  const total = carrinho.reduce((sum, item) => sum + (Number(item.preco) * item.quantidade), 0);
  const quantidadeTotal = carrinho.reduce((sum, item) => sum + item.quantidade, 0);

  return (
    <CartContext.Provider value={{ carrinho, addAoCarrinho, updateQuantidade, removerDoCarrinho, limparCarrinho, total, quantidadeTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
