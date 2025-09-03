import fp from 'fastify-plugin';
import {
  acceptInvite,
  getEmployees,
  inviteEmployee,
  updateEmployee,
  getSingleEmployee
} from '../controllers/employees.controllers.js';

export default fp(async (fastify) => {
  fastify.get('/api/employees', { preHandler: [fastify.authenticate] }, getEmployees);

  fastify.post('/api/employees/:id/invite', { preHandler: [fastify.authenticate] }, inviteEmployee);

  fastify.get('/api/employees/:id/accept-invite', { preHandler: [fastify.authenticate] }, acceptInvite);

  fastify.put('/api/employees/:id', { preHandler: [fastify.authenticate] }, updateEmployee);

  fastify.get('/api/employees/:id', { preHandler: [fastify.authenticate] }, getSingleEmployee);
});
