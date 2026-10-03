const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

async function register(req, res) {
  const { name, email, password, admissionNumber } = req.body;

  try {
    const studentResult = await pool.query(
      "SELECT id, parent_id FROM students WHERE admission_number = $1",
      [admissionNumber],
    );

    if (studentResult.rows.length === 0) {
      return res.status(400).json({ message: "Admission number not found" });
    }

    const student = studentResult.rows[0];

    if (student.parent_id) {
      return res
        .status(400)
        .json({
          message: "This student is already linked to a parent account",
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'parent') RETURNING id`,
      [name, email, hashedPassword],
    );

    const newParentId = userResult.rows[0].id;

    await pool.query("UPDATE students SET parent_id = $1 WHERE id = $2", [
      newParentId,
      student.id,
    ]);

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = userResult.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
}

module.exports = { register, login };
