const cron = require("node-cron");
const axios = require("axios");

const Domain = require("../models/Domain.model");
const Scan = require("../models/Scan.model");
const config = require("../config");

const runAutoScan = () => {

  // Daily 2 AM scan
  cron.schedule("0 2 * * *", async () => {

    console.log("Auto scan started");

    try {

      const domains = await Domain.find({ isActive: true });

      for (const domain of domains) {

        try {

          const response = await axios.post(
            `${config.services.scannerUrl}/scan`,
            {
              url: domain.domain
            }
          );

          const result = response?.data || {};

          await Scan.create({
            userId: domain.userId,
            domainId: domain._id,
            websiteUrl: domain.domain,
            status: "completed",
            securityScore: result.score || 0,
            vulnerabilities: result.vulnerabilities || [],
            technologies: result.technologies || [],
            openPorts: result.open_ports || [],
          });

        } catch (err) {

          console.error("Auto scan failed", domain.domain);

        }

      }

      console.log("Auto scan completed");

    } catch (err) {

      console.error("Auto scan job error", err);

    }

  });

};

module.exports = runAutoScan;