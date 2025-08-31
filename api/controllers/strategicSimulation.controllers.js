import { runGemini } from "../services/aiProviders.js";
import { generatePDF, generateDOCX } from "../services/documentService.js";

async function processStrategicSimulation(fields, reply) {
  if (!fields.market_size_data || !fields.competitive_landscape) {
    return reply.code(400).send({ error: "Missing required strategic simulation data" });
  }
  const prompt = `Strategic Simulation: Blue Ocean strategy canvas, PESTEL and Porter's Five Forces analysis, 3-5 year strategic roadmap.\nMarket Size Data: ${JSON.stringify(fields.market_size_data)}\nCompetitive Landscape: ${JSON.stringify(fields.competitive_landscape)}\n${fields.economic_indicators ? `Economic Indicators: ${JSON.stringify(fields.economic_indicators)}\n` : ""}${fields.scenario_assumptions ? `Scenario Assumptions: ${JSON.stringify(fields.scenario_assumptions)}\n` : ""}`;
  const aiResponse = await runGemini({ model: "gemini-1.5-flash", prompt, context: {} });
  let result = {};
  try { result = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse; } catch { result = { text: aiResponse }; }
  const pdfPath = await generatePDF(result);
  const docxPath = await generateDOCX(result);
  return reply.send({ result, deliverables: [pdfPath, docxPath] });
}
const strategicSimulationJSON = async (req, reply) => {
  let fields = { market_size_data: undefined, competitive_landscape: undefined, economic_indicators: undefined, scenario_assumptions: undefined, ...(req.body || {}) };
  return processStrategicSimulation(fields, reply);
};
const strategicSimulationFiles = async (req, reply) => {
  let fields = { market_size_data: undefined, competitive_landscape: undefined, economic_indicators: undefined, scenario_assumptions: undefined };
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
  return processStrategicSimulation(fields, reply);
};
export { strategicSimulationJSON, strategicSimulationFiles };
