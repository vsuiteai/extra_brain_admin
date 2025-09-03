import fp from 'fastify-plugin';
import { updateProfilePicture, updateProfile } from '../controllers/user.controllers';

export default fp(async (fastify) => {
  fastify.post('/api/user/:userId/profile-picture', { preHandler: [fastify.authenticate] }, updateProfilePicture);
  fastify.put('/api/user/:userId/profile', { preHandler: [fastify.authenticate] }, updateProfile);
});