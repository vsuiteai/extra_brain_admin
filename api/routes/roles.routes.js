import fp from 'fastify-plugin';
import {
  createRole,
  getEmployeePermissions,
  getRoles,
  getUsersWithRole,
  setEmployeePermissions,
  updateRole
} from '../controllers/roles.controllers.js';

export default fp(async (fastify) => {
  fastify.get('/api/roles', { preHandler: [fastify.authenticate] }, getRoles);

  fastify.post('/api/roles', { preHandler: [fastify.authenticate] }, createRole);

  fastify.put('/api/roles/:id', { preHandler: [fastify.authenticate] }, updateRole);

  fastify.get('/api/permissions/matrix', async () => {
    return {
      codes: [
        'users.view','users.edit','roles.manage','onboarding.edit','tickets.edit','exports.run','admin.console',
        'client.portal','client.tickets','client.onboarding'
      ]
    };
  });

  fastify.get('/api/employees/:id/perms', getEmployeePermissions);

  fastify.put('/api/employees/:id/perms', setEmployeePermissions);

  fastify.get('/api/roles/:roleId/users', { preHandler: [fastify.authenticate] }, getUsersWithRole);
});
