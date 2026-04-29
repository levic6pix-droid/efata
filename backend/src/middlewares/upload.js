const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { env } = require('../config/env');

const uploadsDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.uploadMaxSizeMb * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!env.uploadAllowedTypes.includes(file.mimetype)) {
      return cb(new Error('Tipo de arquivo não permitido'));
    }

    return cb(null, true);
  },
});

module.exports = {
  upload,
};