import { runGemini } from "../services/aiProviders.js";
import { generatePDF, generateDOCX } from "../services/documentService.js";

async function processBrandIdentity(fields, reply) {
  if (!fields.nps || !fields.customer_sentiment) {
    return reply.code(400).send({ error: "Missing required brand & identity data" });
  }
  const prompt = `Brand & Identity: Brand Drift Index report, 90-Day rebrand roadmap, Customer journey mapping.\nNPS: ${JSON.stringify(fields.nps)}\nCustomer Sentiment: ${JSON.stringify(fields.customer_sentiment)}\n${fields.competitor_brand_data ? `Competitor Brand Data: ${JSON.stringify(fields.competitor_brand_data)}\n` : ""}${fields.customer_journey_maps ? `Customer Journey Maps: ${JSON.stringify(fields.customer_journey_maps)}\n` : ""}`;
  const aiResponse = await runGemini({ model: "gemini-1.5-flash", prompt, context: {} });
  let result = {};
  try { result = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse; } catch { result = { text: aiResponse }; }
  const pdfPath = await generatePDF(result);
  const docxPath = await generateDOCX(result);
  return reply.send({ result, deliverables: [pdfPath, docxPath] });
}
const brandIdentityJSON = async (req, reply) => {
  let fields = { nps: undefined, customer_sentiment: undefined, competitor_brand_data: undefined, customer_journey_maps: undefined, ...(req.body || {}) };
  return processBrandIdentity(fields, reply);
};
const brandIdentityFiles = async (req, reply) => {
  let fields = { nps: undefined, customer_sentiment: undefined, competitor_brand_data: undefined, customer_journey_maps: undefined };
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
  return processBrandIdentity(fields, reply);
};
export { brandIdentityJSON, brandIdentityFiles };
