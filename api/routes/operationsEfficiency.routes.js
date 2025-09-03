import fp from "fastify-plugin";
import { operationsEfficiencyJSON, operationsEfficiencyFiles } from "../controllers/operationsEfficiency.controllers.js";
export default fp(async (fastify) => {
  fastify.post("/api/operations-efficiency/json", operationsEfficiencyJSON);
  fastify.post("/api/operations-efficiency/files", operationsEfficiencyFiles);
});
