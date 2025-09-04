import fp from 'fastify-plugin';
import {
  createRole,
  getEmployeePermissions,
  getRoles,
  getUsersWithRole,
  setEmployeePermissions,
  updateRole,
  getPermissions,
  createPermission,
  updatePermission
} from '../controllers/roles.controllers.js';

export default fp(async (fastify) => {
  fastify.get('/api/roles', { preHandler: [fastify.authenticate] }, getRoles);

  fastify.post('/api/roles', { preHandler: [fastify.authenticate] }, createRole);

  fastify.put('/api/roles/:id', { preHandler: [fastify.authenticate] }, updateRole);

  fastify.get('/api/permissions', { preHandler: [fastify.authenticate] }, getPermissions);

  fastify.post('/api/permissions/:permissionName', { preHandler: [fastify.authenticate] }, createPermission);

  fastify.put('/api/permissions/:permissionName', { preHandler: [fastify.authenticate] }, updatePermission);

  fastify.get('/api/employees/:id/perms', { preHandler: [fastify.authenticate] }, getEmployeePermissions);

  fastify.put('/api/employees/:id/perms', { preHandler: [fastify.authenticate] }, setEmployeePermissions);

  fastify.get('/api/roles/:roleId/users', { preHandler: [fastify.authenticate] }, getUsersWithRole);
});
