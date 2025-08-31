import { runGemini } from "../services/aiProviders.js";
import { generatePDF, generateDOCX } from "../services/documentService.js";

async function processCrisisManagement(fields, reply) {
  if (!fields.crisis_type || !fields.financial_exposure || !fields.regulatory_notifications) {
    return reply.code(400).send({ error: "Missing required crisis management data" });
  }
  const prompt = `Crisis Management: 30-60-90 day containment playbook, Crisis heatmap & severity scoring, Board communication script.\nCrisis Type: ${JSON.stringify(fields.crisis_type)}\nFinancial Exposure: ${JSON.stringify(fields.financial_exposure)}\nRegulatory Notifications: ${JSON.stringify(fields.regulatory_notifications)}\n${fields.legal_counsel_notes ? `Legal Counsel Notes: ${JSON.stringify(fields.legal_counsel_notes)}\n` : ""}${fields.pr_monitoring ? `PR Monitoring: ${JSON.stringify(fields.pr_monitoring)}\n` : ""}`;
  const aiResponse = await runGemini({ model: "gemini-1.5-flash", prompt, context: {} });
  let result = {};
  try { result = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse; } catch { result = { text: aiResponse }; }
  const pdfPath = await generatePDF(result);
  const docxPath = await generateDOCX(result);
  return reply.send({ result, deliverables: [pdfPath, docxPath] });
}
const crisisManagementJSON = async (req, reply) => {
  let fields = { crisis_type: undefined, financial_exposure: undefined, regulatory_notifications: undefined, legal_counsel_notes: undefined, pr_monitoring: undefined, ...(req.body || {}) };
  return processCrisisManagement(fields, reply);
};
const crisisManagementFiles = async (req, reply) => {
  let fields = { crisis_type: undefined, financial_exposure: undefined, regulatory_notifications: undefined, legal_counsel_notes: undefined, pr_monitoring: undefined };
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
  return processCrisisManagement(fields, reply);
};
export { crisisManagementJSON, crisisManagementFiles };
