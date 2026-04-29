import { useCallback, useMemo, useState } from 'react';
import { fetchAdminData } from '../services/admin';

export function useAdminData(enabled = true) {
  const [state, setState] = useState({
    products: [],
    categories: [],
    clientes: [],
    caixa: [],
    entregadores: [],
    pedidos: [],
  });
  const [loading, setLoading] = useState(enabled && !state.products.length);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!enabled) {
      return;
    }

    const isInitial = state.products.length === 0;
    if (isInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    setError('');

    try {
      const data = await fetchAdminData();
      setState(data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [enabled, state.products.length]);

  const stats = useMemo(() => {
    const validOrders = state.pedidos.filter(p => p.status !== 'cancelado');
    const totalReceita = validOrders.reduce((sum, p) => sum + Number(p.total || 0), 0);

    return {
      products: state.products.filter(p => p.ativo).length,
      total: totalReceita,
      orders: validOrders.length,
      averageTicket: validOrders.length
        ? totalReceita / validOrders.length
        : 0,
    };
  }, [state]);

  return {
    ...state,
    error,
    loading,
    refreshing,
    reload,
    stats,
  };
}