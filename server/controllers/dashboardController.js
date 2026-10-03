const pool = require("../db");

async function getMetrics(req, res) {
  try {
    const expectedResult = await pool.query(`
      SELECT COALESCE(SUM(fs.amount * class_counts.student_count), 0) AS total_expected
      FROM fee_structures fs
      JOIN (
        SELECT class, COUNT(*) AS student_count FROM students GROUP BY class
      ) class_counts ON class_counts.class = fs.class
      WHERE fs.is_active = true
    `);

    const collectedResult = await pool.query(`
      SELECT COALESCE(SUM(amount_paid), 0) AS total_collected FROM payments WHERE status = 'success'
    `);

    const defaulterCountResult = await pool.query(`
      SELECT COUNT(DISTINCT s.id) AS defaulter_count
      FROM students s
      JOIN fee_structures fs ON fs.class = s.class AND fs.is_active = true
      JOIN fee_categories fc ON fc.id = fs.fee_category_id AND fc.mandatory = true
      LEFT JOIN payments p ON p.student_id = s.id AND p.fee_structure_id = fs.id AND p.status = 'success'
      WHERE p.id IS NULL
    `);

    const totalExpected = parseFloat(expectedResult.rows[0].total_expected);
    const totalCollected = parseFloat(collectedResult.rows[0].total_collected);

    res.json({
      totalExpected,
      totalCollected,
      totalOutstanding: totalExpected - totalCollected,
      defaulterCount: parseInt(defaulterCountResult.rows[0].defaulter_count),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch metrics", error: err.message });
  }
}

async function listStudents(req, res) {
  const { class: classFilter } = req.query;

  try {
    let query = `
      SELECT s.id, s.name, s.middle_name, s.class, s.admission_number,
        COALESCE(SUM(p.amount_paid) FILTER (WHERE p.status = 'success'), 0) AS total_paid
      FROM students s
      LEFT JOIN payments p ON p.student_id = s.id
    `;
    const params = [];

    if (classFilter) {
      query += " WHERE s.class = $1";
      params.push(classFilter);
    }

    query += " GROUP BY s.id ORDER BY s.class, s.name";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch students", error: err.message });
  }
}

async function listDefaulters(req, res) {
  const { class: classFilter } = req.query;

  try {
    let query = `
      SELECT DISTINCT s.id, s.name, s.class, s.admission_number, fc.name AS fee_name, fs.amount
      FROM students s
      JOIN fee_structures fs ON fs.class = s.class AND fs.is_active = true
      JOIN fee_categories fc ON fc.id = fs.fee_category_id AND fc.mandatory = true AND fc.is_active = true
      LEFT JOIN payments p ON p.student_id = s.id AND p.fee_structure_id = fs.id AND p.status = 'success'
      WHERE p.id IS NULL
    `;
    const params = [];

    if (classFilter) {
      query += " AND s.class = $1";
      params.push(classFilter);
    }

    query += " ORDER BY s.class, s.name";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch defaulters", error: err.message });
  }
}

module.exports = { getMetrics, listStudents, listDefaulters };
