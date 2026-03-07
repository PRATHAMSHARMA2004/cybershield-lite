const PDFDocument = require('pdfkit');
const Scan = require('../models/Scan.model');

// @desc    Download PDF security report
// @route   GET /api/report/:scanId
// @access  Private
const generateReport = async (req, res, next) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.scanId,
      userId: req.user._id,
      status: 'completed',
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan report not found',
      });
    }

    const doc = new PDFDocument();

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=cybershield-report-${scan._id}.pdf`
    );
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(22).text('CyberShield Security Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Website: ${scan.websiteUrl}`);
    doc.text(`Security Score: ${scan.securityScore}`);
    doc.text(`Scan Date: ${scan.createdAt}`);

    doc.moveDown();

    if (scan.summary) {
      doc.text('Summary:', { underline: true });
      doc.text(scan.summary);
    }

    doc.end();

  } catch (error) {
    next(error);
  }
};

module.exports = { generateReport };