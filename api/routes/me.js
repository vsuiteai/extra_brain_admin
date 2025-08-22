import fp from 'fastify-plugin';
import { col } from '../firestore.js';
import { audit } from '../libs/utils.js';

export default fp(async (fastify) => {
  fastify.get('/api/me', async (req, reply) => {
    const id = req.query?.id;
    if (!id) return reply.code(400).send({ error:'Missing id' });
    const d = await col.employees().doc(id).get();
    if (!d.exists) return reply.code(404).send({ error:'Not found' });
    return { id:d.id, ...d.data() };
  });

  fastify.put('/api/me', async (req) => {
    const id = req.query?.id;
    await col.employees().doc(id).set(req.body || {}, { merge:true });
    await audit({ action:'me_update', target:id });
    return { ok:true };
  });

  fastify.post('/api/me/password', async () => ({ ok:true }));
  fastify.post('/api/me/2fa/setup', async () => ({ ok:true }));
  fastify.post('/api/me/2fa/reset', async () => ({ ok:true }));
  fastify.post('/api/me/sessions/revoke-all', async () => ({ ok:true }));
});
