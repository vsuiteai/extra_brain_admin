import fp from 'fastify-plugin';
import { col } from '../firestore.js';

export default fp(async (fastify) => {
  fastify.get('/api/audit', async (req) => {
    const { actor, action, from, to, q } = req.query || {};
    let ref = col.audit();
    if (actor) ref = ref.where('who','==', actor);
    if (action) ref = ref.where('action','==', action);
    const snap = await ref.orderBy('when','desc').limit(500).get();
    let rows = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    if (from) rows = rows.filter(r => r.when >= from);
    if (to) rows = rows.filter(r => r.when <= to);
    if (q) {
      const s = q.toLowerCase();
      rows = rows.filter(r => JSON.stringify(r.details||{}).toLowerCase().includes(s));
    }
    return rows;
  });
});
