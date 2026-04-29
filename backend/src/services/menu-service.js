const supabase = require('../config/supabase');

let cacheMenu = null;

const getMenu = async (force = false) => {
  if (cacheMenu && !force) return cacheMenu;

  const { data, error } = await supabase
    .from('produtos')
    .select('id,nome,preco,estoque,descricao,categoria:categorias(nome)')
    .eq('ativo', true)
    .gt('estoque', 0)
    .order('nome');
    
  if (error) {
    console.error('Erro ao buscar cardapio para o cache:', error);
    return [];
  }

  cacheMenu = data;
  return data;
};

const invalidateCache = () => {
  cacheMenu = null;
};

module.exports = {
  getMenu,
  invalidateCache
};
