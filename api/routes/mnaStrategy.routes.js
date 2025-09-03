import fp from "fastify-plugin";
import { mnaStrategyJSON, mnaStrategyFiles } from "../controllers/mnaStrategy.controllers.js";

export default fp(async (fastify) => {
  fastify.post("/api/mna-strategy/json", mnaStrategyJSON);
  fastify.post("/api/mna-strategy/files", mnaStrategyFiles);
});
