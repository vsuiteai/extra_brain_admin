import fp from 'fastify-plugin';

import { getClients, getClientProfile } from '../controllers/client.controllers.js';

export default fp(async (fastify) => {
  fastify.get('/api/clients', { preHandler: [fastify.authenticate] }, getClients);
  fastify.get('/api/clients/:id/profile', { preHandler: [fastify.authenticate] }, getClientProfile);
});
