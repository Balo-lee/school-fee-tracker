const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const {
  createFeeCategory,
  listFeeCategories,
  toggleFeeCategory,
} = require("../controllers/feeCategoryController");

router.post("/", verifyToken, requireRole(["director"]), createFeeCategory);
router.get(
  "/",
  verifyToken,
  requireRole(["director", "bursar", "principal"]),
  listFeeCategories,
);
router.patch(
  "/:id/toggle",
  verifyToken,
  requireRole(["director"]),
  toggleFeeCategory,
);

module.exports = router;
