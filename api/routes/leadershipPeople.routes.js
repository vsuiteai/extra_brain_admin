import fp from "fastify-plugin";
import { leadershipPeopleJSON, leadershipPeopleFiles } from "../controllers/leadershipPeople.controllers.js";
export default fp(async (fastify) => {
  fastify.post("/api/leadership-people/json", leadershipPeopleJSON);
  fastify.post("/api/leadership-people/files", leadershipPeopleFiles);
});
