import fp from 'fastify-plugin';
export default fp(async (fastify) => {
  fastify.addHook('preHandler', async (req, reply) => {
    const cid = req.headers['x-client-id'] || req.query?.clientId || null;
    req.tenant = { clientId: cid };
  });
});
