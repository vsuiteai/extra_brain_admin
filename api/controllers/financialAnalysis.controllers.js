import { runGemini, runOpenAI } from "../services/aiProviders.js";
import { buildContext } from "../services/context.js";
import { generatePDF, generateDOCX } from "../services/documentService.js";

// --- Shared utility: validate, run AI, and generate deliverables ---
async function processFinancialData(fields, reply) {
  // Validate required fields
  if (!fields.balance_sheet || !fields.income_statement || !fields.cash_flow_statement || !fields.banking_data) {
    return reply.code(400).send({ error: "Missing required financial data" });
  }

  // Build AI prompt
  const prompt = `Run forensic financial analysis, rolling forecasts, and peer benchmarking.\n
  Balance Sheet: ${JSON.stringify(fields.balance_sheet)}\n
  Income Statement: ${JSON.stringify(fields.income_statement)}\n
  Cash Flow Statement: ${JSON.stringify(fields.cash_flow_statement)}\n
  Banking Data: ${JSON.stringify(fields.banking_data)}\n
  ${fields.budget_forecasts ? `Budget Forecasts: ${JSON.stringify(fields.budget_forecasts)}\n` : ""}${fields.peer_benchmarks ? `Peer Benchmarks: ${JSON.stringify(fields.peer_benchmarks)}\n` : ""}${fields.variance_data ? `Variance Data: ${JSON.stringify(fields.variance_data)}\n` : ""}`;

  // Call AI (Gemini example)
  const aiResponse = await runGemini({ model: "gemini-1.5-flash", prompt, context: {} });

  // Try parsing AI response
  let insights = {};
  try {
    insights = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;
  } catch {
    insights = { text: aiResponse };
  }

  // Generate deliverables
  const pdfPath = await generatePDF(insights);
  const docxPath = await generateDOCX(insights);

  return reply.send({
    insights,
    deliverables: [pdfPath, docxPath]
  });
}


// --- JSON handler ---
const financialAnalysisJSON = async (req, reply) => {
  let fields = {
    balance_sheet: undefined,
    income_statement: undefined,
    cash_flow_statement: undefined,
    banking_data: undefined,
    budget_forecasts: undefined,
    peer_benchmarks: undefined,
    variance_data: undefined,
    ...(req.body || {})
  };

  return processFinancialData(fields, reply);
};


// --- File Upload (Multipart) handler ---
const financialAnalysisFiles = async (req, reply) => {
  let fields = {
    balance_sheet: undefined,
    income_statement: undefined,
    cash_flow_statement: undefined,
    banking_data: undefined,
    budget_forecasts: undefined,
    peer_benchmarks: undefined,
    variance_data: undefined
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

  return processFinancialData(fields, reply);
};

export { financialAnalysisJSON, financialAnalysisFiles };

