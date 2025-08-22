import fp from 'fastify-plugin';
import { col } from '../firestore.js';
import { audit } from '../libs/utils.js';

export default fp(async (fastify) => {
  fastify.get('/api/onboarding', async (req) => {
    const { owner, stage, q } = req.query || {};
    let ref = col.onboarding();
    if (owner && owner !== 'All') ref = ref.where('owner','==',owner);
    if (stage && stage !== 'All') ref = ref.where('stage','==',stage);
    const snap = await ref.get();
    let rows = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    if (q) {
      const s = q.toLowerCase();
      rows = rows.filter(r => (r.customer||'').toLowerCase().includes(s));
    }
    return rows;
  });

  fastify.patch('/api/onboarding/:id/reassign', async (req) => {
    const { ownerId } = req.body || {};
    await col.onboarding().doc(req.params.id).set({ owner: ownerId }, { merge:true });
    await audit({ action:'onboarding_reassign', target:req.params.id, details:{ ownerId } });
    return { ok:true };
  });
});
