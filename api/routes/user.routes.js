import fp from 'fastify-plugin';
import {
  updateProfilePicture,
  updateProfile,
  getUser,
  searchUsers
} from '../controllers/user.controllers.js';

export default fp(async (fastify) => {
  fastify.post('/api/user/:userId/profile-picture', { preHandler: [fastify.authenticate] }, updateProfilePicture);
  fastify.put('/api/user/:userId/profile', { preHandler: [fastify.authenticate] }, updateProfile);
  fastify.get('/api/user/:userId', { preHandler: [fastify.authenticate] }, getUser);
  fastify.get('/api/user/search', { preHandler: [fastify.authenticate] }, searchUsers);
});