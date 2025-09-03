import { runGemini } from "../services/aiProviders.js";
import { generatePDF, generateDOCX } from "../services/documentService.js";

async function processLeadershipPeople(fields, reply) {
  if (!fields.employee_headcount || !fields.engagement_scores || !fields.attrition_data) {
    return reply.code(400).send({ error: "Missing required leadership & people data" });
  }
  const prompt = `Leadership & People: Culture heatmap, Leadership trust index report, Succession readiness plan.\nEmployee Headcount: ${JSON.stringify(fields.employee_headcount)}\nEngagement Scores: ${JSON.stringify(fields.engagement_scores)}\nAttrition Data: ${JSON.stringify(fields.attrition_data)}\n${fields.compensation_data ? `Compensation Data: ${JSON.stringify(fields.compensation_data)}\n` : ""}${fields.succession_plans ? `Succession Plans: ${JSON.stringify(fields.succession_plans)}\n` : ""}${fields.leadership_360_feedback ? `Leadership 360 Feedback: ${JSON.stringify(fields.leadership_360_feedback)}\n` : ""}`;
  const aiResponse = await runGemini({ model: "gemini-1.5-flash", prompt, context: {} });
  let result = {};
  try { result = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse; } catch { result = { text: aiResponse }; }
  const pdfPath = await generatePDF(result);
  const docxPath = await generateDOCX(result);
  return reply.send({ result, deliverables: [pdfPath, docxPath] });
}
const leadershipPeopleJSON = async (req, reply) => {
  let fields = { employee_headcount: undefined, engagement_scores: undefined, attrition_data: undefined, compensation_data: undefined, succession_plans: undefined, leadership_360_feedback: undefined, ...(req.body || {}) };
  return processLeadershipPeople(fields, reply);
};
const leadershipPeopleFiles = async (req, reply) => {
  let fields = { employee_headcount: undefined, engagement_scores: undefined, attrition_data: undefined, compensation_data: undefined, succession_plans: undefined, leadership_360_feedback: undefined };
  const parts = req.parts();
  for await (const part of parts) {
    if (part.file) {
      let content = "";
      for await (const chunk of part.file) { content += chunk.toString(); }
      try { fields[part.fieldname] = JSON.parse(content); } catch { fields[part.fieldname] = content; }
    } else {
      try { fields[part.fieldname] = JSON.parse(part.value); } catch { fields[part.fieldname] = part.value; }
    }
  }
  return processLeadershipPeople(fields, reply);
};
export { leadershipPeopleJSON, leadershipPeopleFiles };
