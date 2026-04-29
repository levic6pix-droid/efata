const express = require('express');
const path = require('path');
const { authenticate, requireRole } = require('../middlewares/auth');
const { ADMIN_ROLE } = require('../constants');
const { upload } = require('../middlewares/upload');
const { env } = require('../config/env');

const router = express.Router();

router.post('/', authenticate, requireRole(ADMIN_ROLE.ADMIN), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const baseUrl = env.nodeEnv === 'production' ? '' : `http://localhost:${env.port}`;
  const fileUrl = `${baseUrl}/uploads/${path.basename(req.file.filename)}`;
  return res.json({ url: fileUrl });
});

module.exports = router;