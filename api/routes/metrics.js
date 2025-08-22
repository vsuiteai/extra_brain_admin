import fp from 'fastify-plugin';
import { col } from '../firestore.js';

export default fp(async (fastify) => {
  fastify.get('/api/admin/overview', async () => {
    const today = new Date().toISOString().slice(0,10);
    const d = await col.metricsDaily().doc(today).get();
    const base = d.exists ? d.data() : {};
    return {
      newCustomers: base.newCustomers ?? 8,
      openTickets: base.openTickets ?? 23,
      atRiskOnboarding: base.atRiskOnboarding ?? 3,
      slaBreaches: base.slaBreaches ?? 1
    };
  });

  fastify.get('/api/metrics/support/volume', async () => ({ series:[{ date:'D-6', v:18 },{ date:'D-5', v:22 },{ date:'D-4', v:17 },{ date:'D-3', v:25 },{ date:'D-2', v:20 },{ date:'D-1', v:19 },{ date:'D', v:23 }] }));
  fastify.get('/api/metrics/support/sla', async () => ({ series:[{ date:'D-6', pct:92 },{ date:'D', pct:95 }] }));
  fastify.get('/api/metrics/support/csat', async () => ({ buckets:[{ label:'Positive', pct:78 },{ label:'Neutral', pct:15 },{ label:'Negative', pct:7 }] }));
});
