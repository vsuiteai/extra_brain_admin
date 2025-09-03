import fp from "fastify-plugin";
import { crisisManagementJSON, crisisManagementFiles } from "../controllers/crisisManagement.controllers.js";
export default fp(async (fastify) => {
  fastify.post("/api/crisis-management/json", crisisManagementJSON);
  fastify.post("/api/crisis-management/files", crisisManagementFiles);
});
