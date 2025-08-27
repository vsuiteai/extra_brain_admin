import fp from "fastify-plugin";
import { financialAnalysisJSON, financialAnalysisFiles } from "../controllers/financialAnalysis.controllers.js";

export default fp(async (fastify) => {
  fastify.post("/api/financial-analysis/json", financialAnalysisJSON);
  fastify.post("/api/financial-analysis/files", financialAnalysisFiles);
});
