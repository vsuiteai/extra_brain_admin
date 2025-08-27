import fp from "fastify-plugin";
import { financialAnalysis } from "../controllers/financialAnalysis.controllers.js";

export default fp(async (fastify) => {
  fastify.post("/api/financial-analysis", financialAnalysis);
});
