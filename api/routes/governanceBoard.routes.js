import fp from "fastify-plugin";
import { governanceBoardJSON, governanceBoardFiles } from "../controllers/governanceBoard.controllers.js";
export default fp(async (fastify) => {
  fastify.post("/api/governance-board/json", governanceBoardJSON);
  fastify.post("/api/governance-board/files", governanceBoardFiles);
});
