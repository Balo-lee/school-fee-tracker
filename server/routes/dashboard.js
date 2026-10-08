const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const {
  getMetrics,
  listStudents,
  listDefaulters,
  createStudent,
  updateStudent,
} = require("../controllers/dashboardController");

const adminRoles = ["director", "bursar", "principal"];

router.get("/metrics", verifyToken, requireRole(adminRoles), getMetrics);
router.get("/students", verifyToken, requireRole(adminRoles), listStudents);
router.get("/defaulters", verifyToken, requireRole(adminRoles), listDefaulters);
router.post("/students", verifyToken, requireRole(["director"]), createStudent);
router.patch(
  "/students/:id",
  verifyToken,
  requireRole(["director"]),
  updateStudent,
);

module.exports = router;
