import { runGemini } from "../services/aiProviders.js";
import { generatePDF, generateDOCX } from "../services/documentService.js";

async function processOperationsEfficiency(fields, reply) {
  if (!fields.production_data || !fields.vendor_performance || !fields.inventory_levels) {
    return reply.code(400).send({ error: "Missing required operations & efficiency data" });
  }
  const prompt = `Operations & Efficiency: Operational efficiency scorecard, Commodity hedging playbook, Automation roadmap.\nProduction Data: ${JSON.stringify(fields.production_data)}\nVendor Performance: ${JSON.stringify(fields.vendor_performance)}\nInventory Levels: ${JSON.stringify(fields.inventory_levels)}\n${fields.commodity_pricing ? `Commodity Pricing: ${JSON.stringify(fields.commodity_pricing)}\n` : ""}${fields.automation_plans ? `Automation Plans: ${JSON.stringify(fields.automation_plans)}\n` : ""}`;
  const aiResponse = await runGemini({ model: "gemini-1.5-flash", prompt, context: {} });
  let result = {};
  try { result = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse; } catch { result = { text: aiResponse }; }
  const pdfPath = await generatePDF(result);
  const docxPath = await generateDOCX(result);
  return reply.send({ result, deliverables: [pdfPath, docxPath] });
}
const operationsEfficiencyJSON = async (req, reply) => {
  let fields = { production_data: undefined, vendor_performance: undefined, inventory_levels: undefined, commodity_pricing: undefined, automation_plans: undefined, ...(req.body || {}) };
  return processOperationsEfficiency(fields, reply);
};
const operationsEfficiencyFiles = async (req, reply) => {
  let fields = { production_data: undefined, vendor_performance: undefined, inventory_levels: undefined, commodity_pricing: undefined, automation_plans: undefined };
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
  return processOperationsEfficiency(fields, reply);
};
export { operationsEfficiencyJSON, operationsEfficiencyFiles };
