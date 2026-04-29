import { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import api from '../services/api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [carrinho, setCarrinho] = useState(() => {
    const saved = localStorage.getItem('efata_carrinho');
    return saved ? JSON.parse(saved) : [];
  });
  const socket = useSocket();

  useEffect(() => {
    localStorage.setItem('efata_carrinho', JSON.stringify(carrinho));
  }, [carrinho]);

  useEffect(() => {
    if (!socket) return;
    
    const validateCart = async () => {
      try {
        const res = await api.get('/catalog/cardapio');
        const cardapioAtivo = res.data.filter(p => p.ativo && p.estoque > 0);
        
        setCarrinho(prev => {
          return prev.filter(item => {
            const produtoValido = cardapioAtivo.find(p => p.id === item.id);
            if (!produtoValido) {
              alert(`O item "${item.nome}" não está mais disponível e foi removido do seu carrinho.`);
              return false;
            }
            if (item.quantidade > produtoValido.estoque) {
               alert(`O item "${item.nome}" não tem mais a quantidade solicitada em estoque.`);
               // Poderíamos reduzir a quantidade aqui, mas remover é mais seguro para não causar surpresa.
               return false;
            }
            return true;
          });
        });
      } catch (e) {
        console.error('Erro ao validar carrinho em tempo real:', e);
      }
    };

    socket.on('dados_atualizados', validateCart);
    return () => {
      socket.off('dados_atualizados', validateCart);
    };
  }, [socket]);

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
