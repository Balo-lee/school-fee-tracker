const pool = require("../db");

async function getChildren(req, res) {
  const parentId = req.user.userId;

  try {
    const result = await pool.query(
      `
      SELECT s.id, s.name, s.middle_name, s.class, s.admission_number,
        COALESCE(SUM(p.amount_paid) FILTER (WHERE p.status = 'success'), 0) AS total_paid,
        COALESCE(class_totals.total_expected, 0) AS total_expected
      FROM students s
      LEFT JOIN payments p ON p.student_id = s.id
      LEFT JOIN (
        SELECT class, SUM(amount) AS total_expected
        FROM fee_structures WHERE is_active = true GROUP BY class
      ) class_totals ON class_totals.class = s.class
      WHERE s.parent_id = $1
      GROUP BY s.id, class_totals.total_expected
      ORDER BY s.name
    `,
      [parentId],
    );

    res.json(result.rows);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch children", error: err.message });
  }
}

async function getChildFeeDetail(req, res) {
  const parentId = req.user.userId;
  const { studentId } = req.params;

  try {
    const studentResult = await pool.query(
      `SELECT id, name, middle_name, class, admission_number FROM students
       WHERE id = $1 AND parent_id = $2`,
      [studentId, parentId],
    );

    if (studentResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Student not found or not linked to your account" });
    }

    const student = studentResult.rows[0];

    const feesResult = await pool.query(
      `
      SELECT 
        fs.id AS fee_structure_id, fc.name AS fee_name, fc.mandatory, fs.term, fs.amount,
        COALESCE(SUM(p.amount_paid) FILTER (WHERE p.status = 'success'), 0) AS amount_paid
      FROM fee_structures fs
      JOIN fee_categories fc ON fc.id = fs.fee_category_id
      LEFT JOIN payments p ON p.fee_structure_id = fs.id AND p.student_id = $1
      WHERE fs.class = $2 AND fs.is_active = true AND fc.is_active = true
      GROUP BY fs.id, fc.name, fc.mandatory, fs.term, fs.amount
      ORDER BY fc.mandatory DESC, fc.name
    `,
      [studentId, student.class],
    );

    res.json({ student, fees: feesResult.rows });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch fee detail", error: err.message });
  }
}

module.exports = { getChildren, getChildFeeDetail };
