import { col } from '../api/firestore.js';

async function seed() {
  // Roles
  const roles = [
    { name:'Admin', description:'Full access', permissions:['admin.console','users.view','users.edit','roles.manage','onboarding.edit','tickets.edit','exports.run'] },
    { name:'Manager', description:'Team management', permissions:['users.view','onboarding.edit','tickets.edit'] },
    { name:'Agent', description:'Day-to-day Ops', permissions:['users.view','tickets.edit'] },
    { name:'Client', description:'Client portal access', permissions:['client.portal','client.tickets','client.onboarding'] }
  ];
  for (const r of roles) await col.roles().add(r);

  // Employees
  const emps = [
    { name:'Alex Chen', email:'alex@vsuite.ai', dept:'Onboarding', role:'Manager', active:true, dateJoined:new Date().toISOString(), lastLogin:null },
    { name:'Jamie Rivera', email:'jamie@vsuite.ai', dept:'Support', role:'Agent', active:true, dateJoined:new Date().toISOString(), lastLogin:null },
    { name:'Morgan Lee', email:'morgan@vsuite.ai', dept:'Admin', role:'Admin', active:true, dateJoined:new Date().toISOString(), lastLogin:null }
  ];
  for (const e of emps) await col.employees().add(e);

  // Clients
  const c1 = await col.clients().add({ name:'Acme Co', plan:'paid', active:true, created:new Date().toISOString() });
  const c2 = await col.clients().add({ name:'Globex', plan:'paid', active:true, created:new Date().toISOString() });

  // Client users
  const cu = [
    { clientId:c1.id, name:'Pat Taylor', email:'pat@acme.com', role:'Client', active:true },
    { clientId:c2.id, name:'Sam Kim',  email:'sam@globex.com', role:'Client', active:true }
  ];
  for (const u of cu) await col.clientUsers().add({ ...u, created:new Date().toISOString() });

  // Onboarding (with clientId)
  const ob = [
    { clientId:c1.id, customer:'Acme Co',  owner:'Alex Chen',   stage:'Kickoff',        risk:'Low',    eta:'2025-09-01' },
    { clientId:c2.id, customer:'Globex',   owner:'Alex Chen',   stage:'Configuration',  risk:'Medium', eta:'2025-09-10' }
  ];
  for (const o of ob) await col.onboarding().add(o);

  // Tickets (with clientId)
  const tickets = [
    { clientId:c1.id, subject:'Data import question', status:'open',  created:new Date().toISOString() },
    { clientId:c2.id, subject:'SLA inquiry',          status:'closed', created:new Date().toISOString() }
  ];
  for (const t of tickets) await col.tickets().add(t);

  // Metrics (admin overview)
  const today = new Date().toISOString().slice(0,10);
  await col.metricsDaily().doc(today).set({ newCustomers:8, openTickets:23, atRiskOnboarding:3, slaBreaches:1 });

  console.log('✅ Demo data seeded (admins, employees, clients, client users, onboarding, tickets)');
  process.exit(0);
}
seed().catch(err => { console.error(err); process.exit(1); });
