import fp from "fastify-plugin";
import { aiQuery, clientQuery } from "../controllers/ai.controllers.js";

export default fp(async (fastify) => {
  // Employees/Admins
  /**
   * POST /api/ai/query  (admins & employees)
   * body: { prompt: string, model?: "gemini" | "chatgpt", scope?: "platform"|"assigned", clientIds?: string[] }
   * headers: x-role, x-clients (csv list for employees)
   */
  fastify.post("/api/ai/query", aiQuery);

  /**
   * POST /api/client/ai/query (clients)
   * body: { prompt: string }
   * headers: x-client-id (from tenant middleware); x-role optional
   */
  fastify.post("/api/client/ai/query", clientQuery);
});