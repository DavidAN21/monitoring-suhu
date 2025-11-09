const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const SensorData = require('../models/SensorData');
const { Op } = require('sequelize');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        console.log('Fetching profile for user:', req.user.id);
        
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        res.json({
            success: true,
            profile: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                bio: user.bio,
                memberSince: user.createdAt
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching profile', 
            error: error.message 
        });
    }
});

// Update user profile
router.post('/profile', auth, async (req, res) => {
    try {
        const { firstName, lastName, phone, bio } = req.body;
        
        console.log('Updating profile for user:', req.user.id, { firstName, lastName, phone, bio });
        
        // Validasi input
        if (!firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'First name and last name are required'
            });
        }

        const updateData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            updatedAt: new Date()
        };

        if (phone) updateData.phone = phone.trim();
        if (bio) updateData.bio = bio.trim();

        const [affectedCount] = await User.update(updateData, {
            where: { id: req.user.id }
        });

        if (affectedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found or no changes made'
            });
        }

        // Get updated user data
        const updatedUser = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        
        res.json({ 
            success: true,
            message: 'Profile updated successfully',
            profile: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error updating profile', 
            error: error.message 
        });
    }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        console.log('Changing password for user:', req.user.id);
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false,
                message: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'New password must be at least 6 characters long' 
            });
        }
        
        // Verify current password
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isMatch = await user.correctPassword(currentPassword);
        
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                message: 'Current password is incorrect' 
            });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        res.json({ 
            success: true,
            message: 'Password updated successfully' 
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error changing password', 
            error: error.message 
        });
    }
});

// Save user settings
router.post('/settings', auth, async (req, res) => {
    try {
        const settings = req.body;
        
        console.log('Saving settings for user:', req.user.id, settings);
        
        await User.update({
            settings: settings,
            updatedAt: new Date()
        }, {
            where: { id: req.user.id }
        });
        
        res.json({ 
            success: true,
            message: 'Settings saved successfully', 
            settings 
        });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error saving settings', 
            error: error.message 
        });
    }
});

// Get user settings
router.get('/settings', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const settings = user.settings || {};
        
        res.json({ 
            success: true,
            settings 
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching settings', 
            error: error.message 
        });
    }
});

// Clear old data
router.delete('/clear-old-data', auth, async (req, res) => {
    try {
        const { days = 90 } = req.body;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        console.log(`Clearing data older than ${days} days (before ${cutoffDate})`);
        
        const result = await SensorData.destroy({
            where: {
                createdAt: {
                    [Op.lt]: cutoffDate
                }
            }
        });
        
        res.json({ 
            success: true,
            message: `Successfully cleared ${result} records older than ${days} days` 
        });
    } catch (error) {
        console.error('Error clearing old data:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error clearing old data', 
            error: error.message 
        });
    }
});

// Export user data
router.get('/export-data', auth, async (req, res) => {
    try {
        const { limit = 1000 } = req.query;
        
        const sensorData = await SensorData.findAll({
            where: { sensor_id: 'sensor_001' },
            limit: parseInt(limit),
            order: [['createdAt', 'DESC']]
        });
        
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const exportData = {
            user: user,
            sensorData: sensorData,
            exportedAt: new Date().toISOString(),
            totalRecords: sensorData.length
        };
        
        res.json({ 
            success: true,
            data: exportData 
        });
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error exporting data', 
            error: error.message 
        });
    }
});

module.exports = router;