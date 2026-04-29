const { ZodError } = require('zod');

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Arquivo excede o tamanho máximo permitido' });
  }

  if (error.message === 'Tipo de arquivo não permitido' || error.message === 'Origin not allowed' || error.message === 'Socket origin not allowed') {
    return res.status(400).json({ error: error.message });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: 'Erro interno do servidor' });
};

module.exports = {
  errorHandler,
};