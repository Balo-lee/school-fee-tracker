const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const {
  initializePayment,
  handleWebhook,
} = require("../controllers/paymentController");

router.post(
  "/initialize",
  verifyToken,
  requireRole(["parent"]),
  initializePayment,
);
router.post("/webhook", handleWebhook);

module.exports = router;
