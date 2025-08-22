import fp from 'fastify-plugin';
import { col } from '../firestore.js';
import { audit } from '../libs/utils.js';

export default fp(async (fastify) => {
  fastify.get('/api/roles', async () => {
    const snap = await col.roles().get();
    return snap.docs.map(d => ({ id:d.id, ...d.data() }));
  });

  fastify.post('/api/roles', async (req) => {
    const b = req.body || {};
    const ref = await col.roles().add({ name:b.name, description:b.description||'', permissions:b.permissions||[] });
    await audit({ action:'role_create', target: ref.id });
    return { id: ref.id };
  });

  fastify.put('/api/roles/:id', async (req) => {
    await col.roles().doc(req.params.id).set(req.body || {}, { merge:true });
    await audit({ action:'role_update', target:req.params.id });
    return { ok:true };
  });

  fastify.get('/api/permissions/matrix', async () => {
    return {
      codes: [
        'users.view','users.edit','roles.manage','onboarding.edit','tickets.edit','exports.run','admin.console',
        'client.portal','client.tickets','client.onboarding'
      ]
    };
  });

  fastify.get('/api/employees/:id/perms', async (req, reply) => {
    const d = await col.employees().doc(req.params.id).get();
    if (!d.exists) return reply.code(404).send({ error:'Not found' });
    const roleId = d.data().roleId || null;
    let perms = [];
    if (roleId) {
      const rd = await col.roles().doc(roleId).get();
      perms = rd.exists ? (rd.data().permissions || []) : [];
    }
    return { roleId, permissions: perms };
  });

  fastify.put('/api/employees/:id/perms', async (req) => {
    const { roleId, permissions } = req.body || {};
    await col.employees().doc(req.params.id).set({ roleId, customPermissions: permissions || [] }, { merge:true });
    await audit({ action:'employee_perms_update', target:req.params.id, details:{ roleId } });
    return { ok:true };
  });
});
