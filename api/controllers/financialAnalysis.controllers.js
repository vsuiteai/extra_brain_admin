import { runGemini } from '../services/aiProviders.js';
import { buildContext } from '../services/context.js';
// import { generatePDF, generateDOCX } from '../services/documentService.js';
import mammoth from 'mammoth';
import ExcelJS from 'exceljs';
import { PDFExtract } from 'pdf.js-extract';

const GetTextFromPDF = async (buffer) => {
    const pdfExtract = new PDFExtract();
    const options = {};
    const result = await pdfExtract.extractBuffer(buffer, options);
    
    // Extract text from all pages
    const text = result.pages
        .map(page => 
            page.content
                .map(item => item.str)
                .join(' ')
        )
        .join('\n\n');
    
    return text;
}

// --- Shared utility: validate, run AI, and generate deliverables ---
async function processFinancialData(fields, reply) {
  console.log('Processing financial data:', fields);
  // Validate required fields
  if (!fields.balance_sheet || !fields.income_statement || !fields.cash_flow_statement || !fields.banking_data) {
    return reply.code(400).send({ error: 'Missing required financial data' });
  }

  // Build AI prompt
  const prompt = `Run forensic financial analysis, rolling forecasts, and peer benchmarking.\n
  Balance Sheet: ${JSON.stringify(fields.balance_sheet)}\n
  Income Statement: ${JSON.stringify(fields.income_statement)}\n
  Cash Flow Statement: ${JSON.stringify(fields.cash_flow_statement)}\n
  Banking Data: ${JSON.stringify(fields.banking_data)}\n
  ${fields.budget_forecasts ? `Budget Forecasts: ${JSON.stringify(fields.budget_forecasts)}\n` : ''}${fields.peer_benchmarks ? `Peer Benchmarks: ${JSON.stringify(fields.peer_benchmarks)}\n` : ''}${fields.variance_data ? `Variance Data: ${JSON.stringify(fields.variance_data)}\n` : ''}`;

  const context = await buildContext({ scope: 'platform', clientIds: [] })

  // Call AI (Gemini example)
  const aiResponse = await runGemini({ model: 'gemini-1.5-flash', prompt, context });

  // Try parsing AI response
  let insights = {};
  try {
    insights = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;
  } catch {
    insights = { text: aiResponse };
  }

  // Generate deliverables
  // const pdfPath = await generatePDF(insights);
  // const docxPath = await generateDOCX(insights);

  return reply.send({
    insights,
    // deliverables: [pdfPath, docxPath]
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
      // Detect file type
      const mime = part.mimetype || '';
      const ext = (part.filename || '').split('.').pop().toLowerCase();
      let extracted = '';
      let buffer = Buffer.alloc(0);
      for await (const chunk of part.file) {
        buffer = Buffer.concat([buffer, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)]);
      }

      try {
        if (mime.includes('pdf') || ext === 'pdf') {
          // PDF extraction using pdf.js-extract
          extracted = await GetTextFromPDF(buffer);
          console.log('extracted', extracted);
        } else if (mime.includes('word') || ext === 'docx') {
          // DOCX extraction
          const result = await mammoth.extractRawText({ buffer });
          extracted = result.value;
        } else if (mime.includes('excel') || ext === 'xlsx') {
          // XLSX extraction using exceljs
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          let text = '';
          workbook.eachSheet((worksheet) => {
            worksheet.eachRow((row) => {
              text += row.values.filter(v => v !== null && v !== undefined).join(' ') + '\n';
            });
          });
          extracted = text;
        } else {
          // Fallback: try to parse as text or JSON
          extracted = buffer.toString('utf8');
        }
      } catch (err) {
        console.log(err);
        extracted = buffer.toString('utf8');
      }

      // Try to parse JSON, else use raw text
      try {
        fields[part.fieldname] = JSON.parse(extracted);
      } catch {
        fields[part.fieldname] = extracted;
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
