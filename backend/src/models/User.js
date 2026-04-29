const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('user', 'admin', 'restaurant_owner'), defaultValue: 'user' },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
}, {
  paranoid: true // Soft delete
});

module.exports = User;
