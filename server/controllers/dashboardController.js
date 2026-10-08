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
        COALESCE(SUM(p.amount_paid) FILTER (WHERE p.status = 'success'), 0) AS total_paid,
        COALESCE(class_totals.total_expected, 0) AS total_expected
      FROM students s
      LEFT JOIN payments p ON p.student_id = s.id
      LEFT JOIN (
        SELECT class, SUM(amount) AS total_expected
        FROM fee_structures WHERE is_active = true GROUP BY class
      ) class_totals ON class_totals.class = s.class
    `;
    const params = [];

    if (classFilter) {
      query += " WHERE s.class = $1";
      params.push(classFilter);
    }

    query +=
      " GROUP BY s.id, class_totals.total_expected ORDER BY s.class, s.name";

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

async function createStudent(req, res) {
  const { name, middleName, class: studentClass, admissionNumber } = req.body;

  try {
    const duplicate = await pool.query(
      `SELECT id FROM students WHERE name = $1`,
      [name],
    );

    if (duplicate.rows.length > 0 && !middleName) {
      return res.status(409).json({
        message:
          "A student with this exact name already exists. Please provide a middle name to continue.",
        needsMiddleName: true,
      });
    }

    const admCheck = await pool.query(
      `SELECT id FROM students WHERE admission_number = $1`,
      [admissionNumber],
    );
    if (admCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "This admission number is already in use" });
    }

    const result = await pool.query(
      `INSERT INTO students (name, middle_name, class, admission_number)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, middleName || null, studentClass, admissionNumber],
    );

    res.status(201).json({
      message: "Student added successfully",
      studentId: result.rows[0].id,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to add student", error: err.message });
  }
}

async function updateStudent(req, res) {
  const { id } = req.params;
  const { name, middleName, class: studentClass, admissionNumber } = req.body;

  try {
    if (admissionNumber) {
      const dup = await pool.query(
        `SELECT id FROM students WHERE admission_number = $1 AND id != $2`,
        [admissionNumber, id],
      );
      if (dup.rows.length > 0) {
        return res
          .status(400)
          .json({
            message:
              "This admission number is already in use by another student",
          });
      }
    }

    await pool.query(
      `UPDATE students SET
        name = COALESCE($1, name),
        middle_name = $2,
        class = COALESCE($3, class),
        admission_number = COALESCE($4, admission_number)
       WHERE id = $5`,
      [name, middleName || null, studentClass, admissionNumber, id],
    );
    res.json({ message: "Student updated" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update student", error: err.message });
  }
}

module.exports = {
  getMetrics,
  listStudents,
  listDefaulters,
  createStudent,
  updateStudent,
};
