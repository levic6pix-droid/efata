const express = require('express');
const authRoutes = require('./auth');
const catalogRoutes = require('./catalog');
const orderRoutes = require('./orders');
const chatRoutes = require('./chat');
const uploadRoutes = require('./upload');
const pdvRoutes = require('./pdv');
const settingsRoutes = require('./settings');
const appRoutes = require('./app');
const webhookRoutes = require('./webhooks');
const { ORDER_STATUS } = require('../constants');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    orderStatus: ORDER_STATUS,
  });
});

router.use('/auth', authRoutes);
router.use('/', catalogRoutes);
router.use('/', orderRoutes);
router.use('/', chatRoutes);
router.use('/', pdvRoutes);
router.use('/settings', settingsRoutes);
router.use('/upload', uploadRoutes);
router.use('/app', appRoutes);
router.use('/webhooks', webhookRoutes);

module.exports = router;