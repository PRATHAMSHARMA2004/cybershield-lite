const PDFDocument = require('pdfkit');
const Scan = require('../models/Scan.model');

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#2563eb',
};

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
      return res.status(404).json({ success: false, message: 'Scan report not found' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=cybershield-report-${scan._id}.pdf`
    );
    doc.pipe(res);

    // ── Header ──────────────────────────────────────────────
    doc
      .rect(0, 0, doc.page.width, 80)
      .fill('#0f172a');

    doc
      .fill('#38bdf8')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('CyberShield Lite', 50, 25, { align: 'left' });

    doc
      .fill('#94a3b8')
      .fontSize(11)
      .font('Helvetica')
      .text('Security Assessment Report', 50, 52);

    // ── Metadata ─────────────────────────────────────────────
    doc.fill('#1e293b').rect(0, 80, doc.page.width, 3).fill();

    doc.moveDown(2);
    doc.fill('#0f172a').fontSize(12).font('Helvetica');

    const meta = [
      ['Target Website', scan.websiteUrl],
      ['Scan Date', new Date(scan.createdAt).toLocaleString()],
      ['Scan Duration', `${scan.scanDuration || 'N/A'}s`],
      ['Report Generated', new Date().toLocaleString()],
    ];

    meta.forEach(([label, value]) => {
      doc
        .font('Helvetica-Bold').text(`${label}: `, { continued: true })
        .font('Helvetica').text(value);
    });

    // ── Security Score ────────────────────────────────────────
    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text('Security Score');
    doc.moveDown(0.3);

    const score = scan.securityScore;
    const scoreColor = score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
    const scoreLabel = score >= 80 ? 'GOOD' : score >= 50 ? 'FAIR' : 'POOR';

    doc
      .fontSize(48)
      .font('Helvetica-Bold')
      .fill(scoreColor)
      .text(`${score}/100`, { align: 'center' });
    doc
      .fontSize(14)
      .fill(scoreColor)
      .text(scoreLabel, { align: 'center' });

    // ── Summary ────────────────────────────────────────────────
    doc.moveDown();
    doc.fill('#0f172a').fontSize(14).font('Helvetica-Bold').text('Vulnerability Summary');
    doc.moveDown(0.5);

    const sumEntries = [
      ['Critical', scan.summary.critical, '#dc2626'],
      ['High', scan.summary.high, '#ea580c'],
      ['Medium', scan.summary.medium, '#d97706'],
      ['Low', scan.summary.low, '#2563eb'],
    ];

    sumEntries.forEach(([label, count, color]) => {
      doc
        .fill(color)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(`${label}: `, { continued: true })
        .fill('#0f172a')
        .font('Helvetica')
        .text(`${count} issue${count !== 1 ? 's' : ''}`);
    });

    // ── SSL Info ────────────────────────────────────────────────
    if (scan.sslInfo) {
      doc.moveDown();
      doc.fontSize(14).font('Helvetica-Bold').fill('#0f172a').text('SSL Certificate');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Status: ${scan.sslInfo.valid ? 'Valid ✓' : 'Invalid ✗'}`);
      if (scan.sslInfo.issuer) doc.text(`Issuer: ${scan.sslInfo.issuer}`);
      if (scan.sslInfo.expiryDate) {
        doc.text(`Expires: ${new Date(scan.sslInfo.expiryDate).toLocaleDateString()}`);
      }
      if (scan.sslInfo.daysUntilExpiry !== undefined) {
        doc.text(`Days Until Expiry: ${scan.sslInfo.daysUntilExpiry}`);
      }
    }

    // ── Vulnerabilities ────────────────────────────────────────
    if (scan.vulnerabilities?.length > 0) {
      doc.addPage();
      doc.fill('#0f172a').fontSize(16).font('Helvetica-Bold').text('Vulnerabilities Found');
      doc.moveDown();

      scan.vulnerabilities.forEach((vuln, idx) => {
        const color = SEVERITY_COLORS[vuln.severity] || '#64748b';
        doc
          .fill(color)
          .fontSize(13)
          .font('Helvetica-Bold')
          .text(`${idx + 1}. [${vuln.severity.toUpperCase()}] ${vuln.title}`);

        if (vuln.description) {
          doc.fill('#374151').fontSize(11).font('Helvetica').text(vuln.description);
        }
        if (vuln.recommendation) {
          doc
            .fill('#059669')
            .font('Helvetica-Bold')
            .text('Recommendation: ', { continued: true })
            .fill('#374151')
            .font('Helvetica')
            .text(vuln.recommendation);
        }
        doc.moveDown(0.8);
      });
    }

    // ── Footer ─────────────────────────────────────────────────
    doc.fontSize(9).fill('#94a3b8').text(
      'Generated by CyberShield Lite — Protect Your Business',
      50,
      doc.page.height - 40,
      { align: 'center' }
    );

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = { generateReport };
