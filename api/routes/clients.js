import fp from 'fastify-plugin';
import { col } from '../firestore.js';
import { audit } from '../libs/utils.js';

export default fp(async (fastify) => {
  fastify.get('/api/clients', async () => {
    const snap = await col.clients().get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });

  fastify.post('/api/clients', async (req) => {
    const { name, plan = 'paid', active = true } = req.body || {};
    const now = new Date().toISOString();
    const ref = await col.clients().add({ name, plan, active, created: now });
    await audit({ action: 'client_create', target: ref.id, details: { name, plan } });
    return { id: ref.id, name, plan, active, created: now };
  });

  fastify.put('/api/clients/:id', async (req) => {
    await col.clients().doc(req.params.id).set(req.body || {}, { merge: true });
    await audit({ action: 'client_update', target: req.params.id });
    return { ok: true };
  });
});
