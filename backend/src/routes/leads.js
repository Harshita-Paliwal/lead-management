const express = require("express");
const router = express.Router();
const leadsController = require("../controllers/leadsController");

// All lead CRUD + stats endpoints (JWT auth is applied in index.js).
// Dashboard stats
router.get("/stats", leadsController.getStats);

// Get all leads
router.get("/", leadsController.getLeads);

// Get single lead by id
router.get("/:id", leadsController.getLead);

// Create lead
router.post("/", leadsController.createLead);

// Update lead
router.put("/:id", leadsController.updateLead);

// Delete lead
router.delete("/:id", leadsController.deleteLead);

module.exports = router;
