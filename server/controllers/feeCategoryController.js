const pool = require("../db");

async function createFeeCategory(req, res) {
  const { name, mandatory, recurrenceType, classes, term, amount } = req.body;
  const directorId = req.user.userId;

  try {
    const categoryResult = await pool.query(
      `INSERT INTO fee_categories (name, mandatory, recurrence_type, created_by)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, mandatory, recurrenceType, directorId],
    );

    const categoryId = categoryResult.rows[0].id;

    for (const className of classes) {
      await pool.query(
        `INSERT INTO fee_structures (fee_category_id, class, term, amount)
         VALUES ($1, $2, $3, $4)`,
        [categoryId, className, term || null, amount],
      );
    }

    res.status(201).json({ message: "Fee category created", categoryId });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create fee category", error: err.message });
  }
}

async function listFeeCategories(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        fc.id, fc.name, fc.mandatory, fc.recurrence_type, fc.is_active,
        fs.id AS structure_id, fs.class, fs.term, fs.amount
      FROM fee_categories fc
      LEFT JOIN fee_structures fs ON fs.fee_category_id = fc.id
      ORDER BY fc.id, fs.class
    `);
    res.json(result.rows);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch fee categories", error: err.message });
  }
}

async function toggleFeeCategory(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE fee_categories SET is_active = NOT is_active WHERE id = $1 RETURNING is_active`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Fee category not found" });
    }

    res.json({
      message: "Status updated",
      is_active: result.rows[0].is_active,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update status", error: err.message });
  }
}

module.exports = { createFeeCategory, listFeeCategories, toggleFeeCategory };
