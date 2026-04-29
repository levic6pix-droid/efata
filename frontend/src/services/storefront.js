import http from './http';

export const fetchCatalog = async () => {
  const response = await http.get('/cardapio');
  return response.data;
};

export const createOrder = async (payload) => {
  const response = await http.post('/pedidos', payload);
  return response.data;
};