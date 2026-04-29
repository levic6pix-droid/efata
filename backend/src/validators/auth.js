const { z } = require('zod');

const authLoginSchema = z.object({
  username: z.string().min(1, 'Informe o usuário'),
  password: z.string().min(1, 'Informe a senha'),
});

module.exports = {
  authLoginSchema,
};