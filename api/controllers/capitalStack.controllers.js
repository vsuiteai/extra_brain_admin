
import { runGemini } from "../services/aiProviders.js";
// import { generatePDF, generateDOCX } from "../services/documentService.js";

// --- Shared utility: validate, run AI, and generate deliverables ---
async function processCapitalStack(fields, reply) {
	// Validate required fields
	if (!fields.debt_schedule || !fields.equity_structure || typeof fields.cost_of_capital !== "number") {
		return reply.code(400).send({ error: "Missing required capital stack data" });
	}

	// Build AI prompt
	const prompt = `Analyze capital stack and funding scenarios. Provide IRR & WACC, pre/post-funding visualization, and funding recommendation memo.\n
	Debt Schedule: ${JSON.stringify(fields.debt_schedule)}\n
	Equity Structure: ${JSON.stringify(fields.equity_structure)}\n
	Cost of Capital: ${fields.cost_of_capital}\n
	${fields.market_rates ? `Market Rates: ${JSON.stringify(fields.market_rates)}\n` : ""}${fields.covenant_data ? `Covenant Data: ${JSON.stringify(fields.covenant_data)}\n` : ""}${fields.ipo_readiness_docs ? `IPO Readiness Docs: ${JSON.stringify(fields.ipo_readiness_docs)}\n` : ""}`;

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
	// const pdfPath = await generatePDF(result);
	// const docxPath = await generateDOCX(result);

	return reply.send({
		result,
		// deliverables: [pdfPath, docxPath]
	});
}

// --- JSON handler ---
const capitalStackJSON = async (req, reply) => {
	let fields = {
		debt_schedule: undefined,
		equity_structure: undefined,
		cost_of_capital: undefined,
		market_rates: undefined,
		covenant_data: undefined,
		ipo_readiness_docs: undefined,
		...(req.body || {})
	};

	// Ensure cost_of_capital is a number
	if (fields.cost_of_capital !== undefined) {
		fields.cost_of_capital = Number(fields.cost_of_capital);
	}

	return processCapitalStack(fields, reply);
};

// --- File Upload (Multipart) handler ---
const capitalStackFiles = async (req, reply) => {
	let fields = {
		debt_schedule: undefined,
		equity_structure: undefined,
		cost_of_capital: undefined,
		market_rates: undefined,
		covenant_data: undefined,
		ipo_readiness_docs: undefined
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
			if (part.fieldname === "cost_of_capital") {
				fields.cost_of_capital = Number(part.value);
			} else {
				try {
					fields[part.fieldname] = JSON.parse(part.value);
				} catch {
					fields[part.fieldname] = part.value;
				}
			}
		}
	}

	return processCapitalStack(fields, reply);
};

export { capitalStackJSON, capitalStackFiles };
