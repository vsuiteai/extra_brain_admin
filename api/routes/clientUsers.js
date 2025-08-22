import fp from 'fastify-plugin';
import { col } from '../firestore.js';
import { audit } from '../libs/utils.js';

export default fp(async (fastify) => {
  fastify.get('/api/client-users', async (req) => {
    const { clientId, q } = req.query || {};
    let ref = col.clientUsers();
    if (clientId) ref = ref.where('clientId', '==', clientId);
    const snap = await ref.get();
    let rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (q) {
      const s = q.toLowerCase();
      rows = rows.filter(r => (r.name||'').toLowerCase().includes(s) || (r.email||'').toLowerCase().includes(s));
    }
    return rows;
  });

  fastify.post('/api/client-users', async (req) => {
    const b = req.body || {};
    if (!b.clientId || !b.email || !b.name) return { error: 'Missing clientId, name, email' };
    const now = new Date().toISOString();
    const doc = { ...b, role: b.role || 'Client', active: b.active ?? true, created: now };
    const ref = await col.clientUsers().add(doc);
    await audit({ action:'client_user_create', target: ref.id, details:{ clientId: b.clientId } });
    return { id: ref.id, ...doc };
  });

  fastify.put('/api/client-users/:id', async (req) => {
    await col.clientUsers().doc(req.params.id).set(req.body || {}, { merge: true });
    await audit({ action:'client_user_update', target:req.params.id });
    return { ok: true };
  });

  fastify.patch('/api/client-users/:id/status', async (req) => {
    const { active } = req.body || {};
    await col.clientUsers().doc(req.params.id).set({ active: !!active }, { merge: true });
    await audit({ action:'client_user_status', target:req.params.id, details:{ active: !!active } });
    return { ok: true };
  });
});
