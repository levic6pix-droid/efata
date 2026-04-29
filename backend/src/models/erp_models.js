const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 1. CLIENTES (Gestão de CRM)
const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, unique: true },
  address: { type: DataTypes.STRING },
  lastOrderAt: { type: DataTypes.DATE }
});

// 2. PRODUTOS (Com Controle de Estoque)
const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  category: { type: DataTypes.STRING },
  restaurantId: { type: DataTypes.UUID },
  image: { type: DataTypes.STRING },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// 3. PEDIDOS
const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customerId: { type: DataTypes.UUID },
  restaurantId: { type: DataTypes.UUID },
  total: { type: DataTypes.FLOAT, allowNull: false },
  status: { 
    type: DataTypes.ENUM('pending', 'preparing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentMethod: { type: DataTypes.STRING }, // 'pix', 'cartao', 'dinheiro'
  items: { type: DataTypes.JSON } // Detalhes dos produtos no pedido
});

// 4. FLUXO DE CAIXA
const CashFlow = sequelize.define('CashFlow', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  type: { type: DataTypes.ENUM('input', 'output'), allowNull: false },
  value: { type: DataTypes.FLOAT, allowNull: false },
  description: { type: DataTypes.STRING },
  category: { type: DataTypes.STRING } // 'venda', 'compra', 'manutencao'
});

module.exports = { Customer, Product, Order, CashFlow };
