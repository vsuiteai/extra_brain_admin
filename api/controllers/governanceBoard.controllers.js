import { runGemini } from "../services/aiProviders.js";
import { generatePDF, generateDOCX } from "../services/documentService.js";

async function processGovernanceBoard(fields, reply) {
  if (!fields.board_roster || !fields.voting_history || !fields.compliance_docs) {
    return reply.code(400).send({ error: "Missing required governance & board data" });
  }
  const prompt = `Governance & Board: CEO–Board Trust Index, Voting behavior simulation, ESG disclosure package.\nBoard Roster: ${JSON.stringify(fields.board_roster)}\nVoting History: ${JSON.stringify(fields.voting_history)}\nCompliance Docs: ${JSON.stringify(fields.compliance_docs)}\n${fields.esg_reports ? `ESG Reports: ${JSON.stringify(fields.esg_reports)}\n` : ""}${fields.audit_findings ? `Audit Findings: ${JSON.stringify(fields.audit_findings)}\n` : ""}`;
  const aiResponse = await runGemini({ model: "gemini-1.5-flash", prompt, context: {} });
  let result = {};
  try { result = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse; } catch { result = { text: aiResponse }; }
  const pdfPath = await generatePDF(result);
  const docxPath = await generateDOCX(result);
  return reply.send({ result, deliverables: [pdfPath, docxPath] });
}
const governanceBoardJSON = async (req, reply) => {
  let fields = { board_roster: undefined, voting_history: undefined, compliance_docs: undefined, esg_reports: undefined, audit_findings: undefined, ...(req.body || {}) };
  return processGovernanceBoard(fields, reply);
};
const governanceBoardFiles = async (req, reply) => {
  let fields = { board_roster: undefined, voting_history: undefined, compliance_docs: undefined, esg_reports: undefined, audit_findings: undefined };
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
  return processGovernanceBoard(fields, reply);
};
export { governanceBoardJSON, governanceBoardFiles };
