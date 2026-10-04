const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const {
  getChildren,
  getChildFeeDetail,
} = require("../controllers/parentController");

router.get("/children", verifyToken, requireRole(["parent"]), getChildren);
router.get(
  "/fees/:studentId",
  verifyToken,
  requireRole(["parent"]),
  getChildFeeDetail,
);

module.exports = router;
