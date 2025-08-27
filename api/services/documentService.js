import { Storage } from "@google-cloud/storage";
import PDFdocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun } from "docx";

const storage = new Storage();
const bucketName = "vsuite-objects";

export async function generatePDF(insights) {
  const fileName = `cashflow_dashboard_${Date.now()}.pdf`;
  const file = storage.bucket(bucketName).file(fileName);

  const doc = new PDFdocument();
  const chunks = [];
  return new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);

      await file.save(pdfBuffer, {
        contentType: "application/pdf",
        resumable: false,
      });

      resolve(`https://storage.googleapis.com/${bucketName}/${fileName}`);
    });

    doc.text('13-Week Cash Flow Dashboard');
    doc.moveDown();
    doc.text(JSON.stringify(insights, null, 2));

    doc.end();
  })
}

export async function generateDOCX(insights) {
  const fileName = `cfo_board_memo_${Date.now()}.docx`;
  const file = storage.bucket(bucketName).file(fileName);

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun("CFO-to-Board Memo")],
          }),
          new Paragraph({
            children: [new TextRun(JSON.stringify(insights, null, 2))],
          }),
        ]
      }
    ]
  })

  const buffer = await Packer.toBuffer(doc);

  await file.save(buffer, ({
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    resumable: false,
  }))

  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}
