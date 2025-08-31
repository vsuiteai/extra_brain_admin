import fp from 'fastify-plugin';
import {
  login,
  refreshTokens,
  signup,
  twoFASetup,
  twoFAVerify,
  verifyTwoFAToken
} from '../controllers/auth.controllers.js';

export default fp(async (fastify) => {
  fastify.post('/api/auth/login', login);

  fastify.post('/api/auth/2fa-token-verify', verifyTwoFAToken);

  fastify.post('/api/auth/register', signup);

  fastify.post('/api/auth/refresh-token', refreshTokens(fastify));

  fastify.post('/api/auth/2fa/setup', twoFASetup);

  fastify.post('/api/auth/2fa/verify', twoFAVerify)
});
