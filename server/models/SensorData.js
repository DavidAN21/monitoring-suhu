const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SensorData = sequelize.define('SensorData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sensor_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  humidity: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  air_quality: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(20),
    allowNull: false
  }
}, {
  tableName: 'sensor_data',
  timestamps: true,
  indexes: [
    {
      fields: ['createdAt']
    },
    {
      fields: ['sensor_id', 'createdAt']
    }
  ]
});

module.exports = SensorData;