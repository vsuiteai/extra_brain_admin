import fp from "fastify-plugin";
import { strategicSimulationJSON, strategicSimulationFiles } from "../controllers/strategicSimulation.controllers.js";
export default fp(async (fastify) => {
  fastify.post("/api/strategic-simulation/json", strategicSimulationJSON);
  fastify.post("/api/strategic-simulation/files", strategicSimulationFiles);
});
