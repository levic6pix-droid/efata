const express = require('express');
const { getSettings, saveSettings } = require('../services/settings-service');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const settings = await saveSettings(req.body || {});
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
