import { useCallback, useMemo, useState } from 'react';
import { fetchCatalog } from '../services/storefront';

export function useStorefrontData() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchCatalog();
      setProducts(data.filter((product) => product.ativo && product.disponivel));
    } catch {
      setError('Não foi possível carregar o cardápio.');
    } finally {
      setLoading(false);
    }
  }, []);

  const categories = useMemo(() => {
    const map = new Map();

    products.forEach((product) => {
      if (product.categoria?.id && !map.has(product.categoria.id)) {
        map.set(product.categoria.id, {
          id: product.categoria.id,
          nome: product.categoria.nome,
        });
      }
    });

    return [{ id: 'all', nome: 'Todos' }, ...map.values()];
  }, [products]);

  return {
    categories,
    error,
    loading,
    products,
    reload: loadCatalog,
  };
}