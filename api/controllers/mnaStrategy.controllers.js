import { runGemini } from "../services/aiProviders.js";
import { generatePDF, generateDOCX } from "../services/documentService.js";

// --- Shared utility: validate, run AI, and generate deliverables ---
async function processMnaStrategy(fields, reply) {
  // Validate required fields
  if (!fields.target_financials || !fields.synergy_assumptions || !fields.deal_structure) {
    return reply.code(400).send({ error: "Missing required M&A strategy data" });
  }

  // Build AI prompt
  const prompt = `M&A & Acquisition Strategy analysis. Provide pre-LOI target brief, DCF & synergy valuation models, and 100-Day post-merger integration roadmap.\n
  Target Financials: ${JSON.stringify(fields.target_financials)}\n
  Synergy Assumptions: ${JSON.stringify(fields.synergy_assumptions)}\n
  Deal Structure: ${JSON.stringify(fields.deal_structure)}\n
  ${fields.comparable_transactions ? `Comparable Transactions: ${JSON.stringify(fields.comparable_transactions)}\n` : ""}${fields.cultural_assessment ? `Cultural Assessment: ${JSON.stringify(fields.cultural_assessment)}\n` : ""}${fields.integration_plans ? `Integration Plans: ${JSON.stringify(fields.integration_plans)}\n` : ""}`;

  // Call AI (Gemini example)
  const aiResponse = await runGemini({ model: "gemini-1.5-flash", prompt, context: {} });

  // Try parsing AI response
  let result = {};
  try {
    result = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;
  } catch {
    result = { text: aiResponse };
  }

  // Generate deliverables
  const pdfPath = await generatePDF(result);
  const docxPath = await generateDOCX(result);

  return reply.send({
    result,
    deliverables: [pdfPath, docxPath]
  });
}

// --- JSON handler ---
const mnaStrategyJSON = async (req, reply) => {
  let fields = {
    target_financials: undefined,
    synergy_assumptions: undefined,
    deal_structure: undefined,
    comparable_transactions: undefined,
    cultural_assessment: undefined,
    integration_plans: undefined,
    ...(req.body || {})
  };
  return processMnaStrategy(fields, reply);
};

// --- File Upload (Multipart) handler ---
const mnaStrategyFiles = async (req, reply) => {
  let fields = {
    target_financials: undefined,
    synergy_assumptions: undefined,
    deal_structure: undefined,
    comparable_transactions: undefined,
    cultural_assessment: undefined,
    integration_plans: undefined
  };

  const parts = req.parts();
  for await (const part of parts) {
    if (part.file) {
      // Handle uploaded file
      let content = "";
      for await (const chunk of part.file) {
        content += chunk.toString();
      }
      try {
        fields[part.fieldname] = JSON.parse(content);
      } catch {
        fields[part.fieldname] = content; // fallback raw text
      }
    } else {
      // Regular field
      try {
        fields[part.fieldname] = JSON.parse(part.value);
      } catch {
        fields[part.fieldname] = part.value;
      }
    }
  }

  return processMnaStrategy(fields, reply);
};

export { mnaStrategyJSON, mnaStrategyFiles };
