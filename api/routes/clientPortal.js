import fp from 'fastify-plugin';
import { col } from '../firestore.js';

export default fp(async (fastify) => {
  // fastify.addHook('preHandler', async (req, reply) => {
  //   if (!req.tenant?.clientId) {
  //     return reply.code(400).send({ error: 'Missing clientId (header x-client-id or ?clientId=)' });
  //   }
  // });

  fastify.get('/api/client/overview', async (req) => {
    const clientId = req.tenant.clientId;
    const ticketsSnap = await col.tickets().where('clientId','==',clientId).get();
    const onboardingSnap = await col.onboarding().where('clientId','==',clientId).get();
    const openTickets = ticketsSnap.docs.filter(d => (d.data().status || 'open') !== 'closed').length;
    const activeOnboarding = onboardingSnap.size;
    return { openTickets, activeOnboarding };
  });

  fastify.get('/api/client/onboarding', async (req) => {
    const clientId = req.tenant.clientId;
    const snap = await col.onboarding().where('clientId','==',clientId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });

  fastify.get('/api/client/tickets', async (req) => {
    const clientId = req.tenant.clientId;
    const snap = await col.tickets().where('clientId','==',clientId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });

  fastify.get('/api/client/me', async (req, reply) => {
    const clientId = req.tenant.clientId;
    const email = req.query?.email;
    if (!email) return reply.code(400).send({ error:'Missing email' });
    const snap = await col.clientUsers().where('clientId','==',clientId).where('email','==',email).limit(1).get();
    if (snap.empty) return reply.code(404).send({ error:'Not found' });
    const d = snap.docs[0];
    return { id:d.id, ...d.data() };
  });
});
