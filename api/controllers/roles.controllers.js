import { col } from '../firestore.js';

const getRoles = async (req, reply) => {
  const rolesSnapshot = await col('roles').get();
  const roles = rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return reply.send({ roles });
};

const createRole = async (req, reply) => {
  const { name, description, permissions } = req.body;
  const roleRef = await col('roles').add({ name, description, permissions });
  return reply.status(201).send({ id: roleRef.id });
};

const updateRole = async (req, reply) => {
  const { id } = req.params;
  const { name, description, permissions } = req.body;

  if (!name || !description || !permissions) {
    return reply.status(400).send({ error: 'Missing required fields' });
  }

  await col('roles').doc(id).set({ name, description, permissions }, { merge: true });

  return reply.send({ id });
};

const getEmployeePermissions = async (req, reply) => {
  const d = await col.employees().doc(req.params.id).get();
  if (!d.exists) return reply.code(404).send({ error:'Not found' });
  const roleId = d.data().roleId || null;
  let perms = [];
  if (roleId) {
    const rd = await col.roles().doc(roleId).get();
    perms = rd.exists ? (rd.data().permissions || []) : [];
  }
  return reply.send({ roleId, permissions: perms });
};

const setEmployeePermissions = async (req, reply) => {
  const { id } = req.params;
  const { roleId, permissions } = req.body || {};
  await col.employees().doc(id).set({ roleId, permissions: permissions || [] }, { merge:true });
  return reply.send({ ok:true });
};

export { getRoles, createRole, updateRole, getEmployeePermissions, setEmployeePermissions };
