const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateSecurityReport = (scan) => {

  const doc = new PDFDocument();

  const fileName = `report-${scan._id}.pdf`;

  const reportsDir = path.join(__dirname, "../../reports");

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  const filePath = path.join(reportsDir, fileName);

  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  doc.fontSize(22).text("CyberShield Security Report", {
    align: "center",
  });

  doc.moveDown();

  doc.fontSize(14).text(`Website: ${scan.websiteUrl}`);
  doc.text(`Security Score: ${scan.securityScore}`);

  doc.moveDown();

  doc.text("Detected Vulnerabilities:");

  scan.vulnerabilities.forEach((v) => {
    doc.text(`• ${v.title}`);
  });

  doc.end();

  return fileName;
};

module.exports = { generateSecurityReport };