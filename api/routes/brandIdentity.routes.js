import fp from "fastify-plugin";
import { brandIdentityJSON, brandIdentityFiles } from "../controllers/brandIdentity.controllers.js";
export default fp(async (fastify) => {
  fastify.post("/api/brand-identity/json", brandIdentityJSON);
  fastify.post("/api/brand-identity/files", brandIdentityFiles);
});
