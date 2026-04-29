const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID },
  restaurantId: { type: DataTypes.UUID },
  total: { type: DataTypes.FLOAT, allowNull: false },
  status: { 
    type: DataTypes.ENUM('pending', 'accepted', 'preparing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentMethod: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  items: { type: DataTypes.JSON }
});

module.exports = Order;
