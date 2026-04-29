const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Restaurant = sequelize.define('Restaurant', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, unique: true },
  category: { type: DataTypes.STRING },
  rating: { type: DataTypes.FLOAT, defaultValue: 5.0 },
  image: { type: DataTypes.STRING },
  deliveryTime: { type: DataTypes.STRING },
  deliveryFee: { type: DataTypes.FLOAT, defaultValue: 0 },
  isOpen: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { paranoid: true });

module.exports = Restaurant;
