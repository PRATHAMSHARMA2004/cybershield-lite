const puppeteer = require('puppeteer');
const Scan = require('../models/Scan.model');
const generateHTMLReport = require('../templates/report.template');

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

    // Map fields for template compatibility
    const formattedScan = {
      url: scan.websiteUrl,
      score: scan.securityScore,
      summary: scan.summary,
      createdAt: scan.createdAt,
    };

    const html = generateHTMLReport(formattedScan);

    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: puppeteer.executablePath()
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true
    });

    await browser.close();

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename=cybershield-report-${scan._id}.pdf`,
    });

    res.end(pdfBuffer);

  } catch (error) {
    next(error);
  }
};

module.exports = { generateReport };