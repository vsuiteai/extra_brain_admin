import { col } from '../firestore.js';

const getRoles = async (req, reply) => {
  const rolesSnapshot = await col.roles().get();
  const roles = rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  if (Array.isArray(roles) && roles.length > 0) {
    await Promise.all(roles.map(async (role) => {
      const totalSnapshot = await col.users().where('role.name', '==', role.name).get();
      const total = totalSnapshot.size;
      role.totalUsers = total;
    }));
  }

  return reply.send({ roles });
};

const createRole = async (req, reply) => {
  const { name, description, permissions } = req.body;
  if (!name || !description || !permissions) {
    return reply.status(400).send({ error: 'Missing required fields' });
  }

  if (!Array.isArray(permissions)) {
    return reply.status(400).send({ error: 'Permissions must be an array' });
  }

  const roleRef = await col.roles().add({ name, description, permissions });
  return reply.status(201).send({ id: roleRef.id });
};

const updateRole = async (req, reply) => {
  const { id } = req.params;
  const { name, description, permissions } = req.body;

  if (!name || !description || !permissions) {
    return reply.status(400).send({ error: 'Missing required fields' });
  }

  if (!Array.isArray(permissions)) {
    return reply.status(400).send({ error: 'Permissions must be an array' });
  }

  await col.roles().doc(id).set({ name, description, permissions }, { merge: true });

  return reply.send({ id });
};

const getEmployeePermissions = async (req, reply) => {
  const d = await col.employees().doc(req.params.id).get();
  let rd;
  if (!d.exists) return reply.code(404).send({ error:'Not found' });
  const roleName = d.data().role || null;
  let perms = [];
  if (roleName) {
    rd = await col.roles().where('name', '==', roleName).limit(1).get();
    if (rd.empty) return reply.code(404).send({ error: 'Role not found' });
    perms = rd.docs[0].data().permissions || [];
  }
  return reply.send({ roleId: rd.docs[0].id, roleName, permissions: perms });
};

const setEmployeePermissions = async (req, reply) => {
  const { id } = req.params;
  const { roleId, permissions } = req.body || {};

  const roleDoc = await col.roles().doc(roleId).get();
  await col.employees().doc(id).set({ roleId, role: roleDoc.data().name, permissions: permissions || [] }, { merge:true });
  return reply.send({ ok:true });
};

const getUsersWithRole = async (req, reply) => {
  const { roleId } = req.params;
  const { limit = 10, lastUserName } = req.query;
  const role = await col.roles().doc(roleId).get();
  if (!role.exists) return reply.code(404).send({ error: 'Role not found' });

  const pageSize = parseInt(limit);

  // Get total count first
  const totalSnapshot = await col.users().where('role.name', '==', role.data().name).get();
  const total = totalSnapshot.size;

  // Build the query
  let query = col.users()
    .where('roleName', '==', role.data().name)
    .orderBy('fullName')
    .limit(pageSize);

  // If we have a cursor, start after it
  if (lastUserName) {
    query = query.startAfter(lastUserName);
  }

  const usersSnapshot = await query.get();
  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Get the last document for next cursor
  const lastVisible = usersSnapshot.docs[usersSnapshot.docs.length - 1];
  
  return reply.send({
    data: users,
    pagination: {
      total,
      limit: pageSize,
      hasMore: users.length === pageSize,
      lastUserName: lastVisible ? lastVisible.data().name : null
    }
  });
};

export { getRoles, createRole, updateRole, getEmployeePermissions, setEmployeePermissions, getUsersWithRole };
