import fp from 'fastify-plugin';
import { col } from '../firestore.js';
import { okDept, okRole, requireFields } from '../libs/validators.js';
import { audit } from '../libs/utils.js';

export default fp(async (fastify) => {
  fastify.get('/api/employees', async (req) => {
    const { dept, status, q } = req.query || {};
    let ref = col.employees();
    if (dept && dept !== 'All') ref = ref.where('dept','==',dept);
    if (status && status !== 'All') ref = ref.where('active','==', status === 'Active');
    const snap = await ref.get();
    let rows = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    if (q) {
      const s = q.toLowerCase();
      rows = rows.filter(r => (r.name||'').toLowerCase().includes(s) || (r.email||'').toLowerCase().includes(s));
    }
    return rows;
  });

  fastify.get('/api/employees/:id', async (req, reply) => {
    const d = await col.employees().doc(req.params.id).get();
    if (!d.exists) return reply.code(404).send({ error:'Not found' });
    return { id:d.id, ...d.data() };
  });

  fastify.post('/api/employees', async (req, reply) => {
    const b = req.body || {};
    requireFields(b, ['name','email','dept','role']);
    if (!okDept(b.dept) || !okRole(b.role)) return reply.code(400).send({ error:'Invalid dept/role' });
    const now = new Date().toISOString();
    const doc = { ...b, active: b.active ?? true, dateJoined: now, lastLogin: null };
    const ref = await col.employees().add(doc);
    await audit({ action:'employee_create', target: ref.id, details:{ ...b, email: undefined } });
    return { id: ref.id, ...doc };
  });

  fastify.put('/api/employees/:id', async (req, reply) => {
    const b = req.body || {};
    if (b.dept && !okDept(b.dept)) return reply.code(400).send({ error:'Invalid dept' });
    if (b.role && !okRole(b.role)) return reply.code(400).send({ error:'Invalid role' });
    await col.employees().doc(req.params.id).set(b, { merge:true });
    await audit({ action:'employee_update', target:req.params.id, details:b });
    return { ok:true };
  });

  fastify.patch('/api/employees/:id/status', async (req) => {
    const { active } = req.body || {};
    await col.employees().doc(req.params.id).set({ active: !!active }, { merge:true });
    await audit({ action:'employee_status', target:req.params.id, details:{ active: !!active } });
    return { ok:true };
  });

  fastify.post('/api/employees/:id/invite', async (req) => {
    await audit({ action:'employee_invite', target:req.params.id });
    return { ok:true, message:'Invite sent' };
  });
});
