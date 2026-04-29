import http from './http';

export async function fetchAdminData() {
  const [products, categories, clientes, caixa, entregadores, pedidos] =
    await Promise.all([
      http.get('/cardapio'),
      http.get('/categorias'),
      http.get('/clientes'),
      http.get('/caixa'),
      http.get('/entregadores'),
      http.get('/pedidos'),
    ]);

  return {
    products: products.data,
    categories: categories.data,
    clientes: clientes.data,
    caixa: caixa.data,
    entregadores: entregadores.data,
    pedidos: pedidos.data,
  };
}

export async function createPedido(payload) {
  const response = await http.post('/pedidos', payload);
  return response.data;
}

export async function updatePedidoStatus(id, status) {
  const response = await http.put(`/pedidos/${id}/status`, { status });
  return response.data;
}

export async function assignEntregador(id, entregadorId) {
  const response = await http.put(`/pedidos/${id}/entregador`, {
    entregadorId,
  });
  return response.data;
}

export async function uploadImage(formData) {
  const response = await http.post('/upload', formData);
  return response.data;
}

export async function saveEntity(entity, payload, id) {
  if (id) {
    const response = await http.put(`/${entity}/${id}`, payload);
    return response.data;
  }

  const response = await http.post(`/${entity}`, payload);
  return response.data;
}

export async function deleteEntity(entity, id) {
  const response = await http.delete(`/${entity}/${id}`);
  return response.data;
}

export async function updateProduct(productId, payload) {
  const response = await http.put(`/produtos/${productId}`, payload);
  return response.data;
}

export async function sendChat(messages) {
  const response = await http.post('/chat', { messages });
  return response.data;
}