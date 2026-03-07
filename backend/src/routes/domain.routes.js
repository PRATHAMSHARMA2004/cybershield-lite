const express = require("express");
const router = express.Router();

const { addDomain, getDomains } = require("../controllers/domain.controller");
const { protect } = require("../middleware/auth.middleware");

// All routes protected (login required)

router.post("/", protect, addDomain);
router.get("/", protect, getDomains);

module.exports = router;