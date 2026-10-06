const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const {
  getChildren,
  getChildFeeDetail,
} = require("../controllers/parentController");
const {
  getReceipt,
  getPaymentHistory,
} = require("../controllers/receiptController");

router.get("/children", verifyToken, requireRole(["parent"]), getChildren);
router.get(
  "/fees/:studentId",
  verifyToken,
  requireRole(["parent"]),
  getChildFeeDetail,
);
router.get(
  "/receipts/:paymentId",
  verifyToken,
  requireRole(["parent"]),
  getReceipt,
);
router.get(
  "/payment-history",
  verifyToken,
  requireRole(["parent"]),
  getPaymentHistory,
);

module.exports = router;
