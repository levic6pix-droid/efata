const express = require('express');
const { authLoginSchema } = require('../validators/auth');
const { authenticate } = require('../middlewares/auth');
const { getAuthPayload, login } = require('../services/auth-service');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const data = authLoginSchema.parse(req.body);
    const result = await login(data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: getAuthPayload(req.user) });
});

module.exports = router;