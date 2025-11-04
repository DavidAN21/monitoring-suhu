const express = require('express');
const { Sequelize, Op } = require('sequelize');
const SensorData = require('../models/SensorData');
const { auth, apiKeyAuth } = require('../middleware/auth');
const { sequelize } = require('../config/database');

const router = express.Router(); // <-- TAMBAHKAN INI

// Receive data from ESP8266 (protected with API key)
router.post('/sensor-data', apiKeyAuth, async (req, res) => {
  try {
    const { sensor_id, temperature, humidity, air_quality, category } = req.body;

    const sensorData = await SensorData.create({
      sensor_id,
      temperature,
      humidity,
      air_quality,
      category
    });

    res.status(201).json({ 
      message: 'Data received successfully',
      data: sensorData
    });
  } catch (error) {
    res.status(500).json({ message: 'Error saving sensor data', error: error.message });
  }
});

// Get latest sensor data (protected with JWT)
router.get('/sensor-data/latest', auth, async (req, res) => {
  try {
    const data = await SensorData.findOne({
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});

// Get sensor data history (protected with JWT)
router.get('/sensor-data/history', auth, async (req, res) => {
  try {
    const { limit = 50, hours = 24 } = req.query;
    
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const data = await SensorData.findAll({
      where: {
        createdAt: {
          [Op.gte]: startTime
        }
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
});

// Get statistics
router.get('/sensor-data/stats', auth, async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const stats = await SensorData.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('temperature')), 'avgTemperature'],
        [sequelize.fn('AVG', sequelize.col('humidity')), 'avgHumidity'],
        [sequelize.fn('AVG', sequelize.col('air_quality')), 'avgAirQuality'],
        [sequelize.fn('MAX', sequelize.col('air_quality')), 'maxAirQuality'],
        [sequelize.fn('MAX', sequelize.col('temperature')), 'maxTemperature'],
        [sequelize.fn('MIN', sequelize.col('temperature')), 'minTemperature'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: twentyFourHoursAgo
        }
      }
    });

    res.json({ stats: stats || {} });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

module.exports = router;