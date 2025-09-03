
import fp from "fastify-plugin";
import { capitalStackJSON, capitalStackFiles } from "../controllers/capitalStack.controllers.js";

export default fp(async (fastify) => {
	fastify.post("/api/capital-stack/json", capitalStackJSON);
	fastify.post("/api/capital-stack/files", capitalStackFiles);
});
