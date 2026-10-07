const pool = require("../db");
const axios = require("axios");
const crypto = require("crypto");

async function initializePayment(req, res) {
  const parentId = req.user.userId;
  const { studentId, feeStructureId } = req.body;

  try {
    const studentResult = await pool.query(
      `SELECT s.id, u.email FROM students s
       JOIN users u ON u.id = $1
       WHERE s.id = $2 AND s.parent_id = $1`,
      [parentId, studentId],
    );

    if (studentResult.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "This student is not linked to your account" });
    }

    const feeResult = await pool.query(
      `SELECT fs.id, fs.amount FROM fee_structures fs WHERE fs.id = $1`,
      [feeStructureId],
    );

    if (feeResult.rows.length === 0) {
      return res.status(404).json({ message: "Fee not found" });
    }

    const fee = feeResult.rows[0];
    const parentEmail = studentResult.rows[0].email;
    const amountInKobo = Math.round(parseFloat(fee.amount) * 100);
    const reference = `PSK-${Date.now()}-${studentId}-${feeStructureId}`;

    await pool.query(
      `INSERT INTO payments (student_id, fee_structure_id, amount_paid, paystack_reference, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [studentId, feeStructureId, fee.amount, reference],
    );

    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: parentEmail,
        amount: amountInKobo,
        reference,
        metadata: { studentId, feeStructureId, parentId },
        callback_url:
          "https://https://school-fee-tracker-beige.vercel.app/.vercel.app/payment-callback",
      },
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      },
    );

    res.json({
      authorizationUrl: paystackResponse.data.data.authorization_url,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to initialize payment", error: err.message });
  }
}

async function handleWebhook(req, res) {
  const signature = req.headers["x-paystack-signature"];
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest("hex");

  if (hash !== signature) {
    return res.status(401).send("Invalid signature");
  }

  const event = JSON.parse(req.body);

  if (event.event === "charge.success") {
    const reference = event.data.reference;
    const amountPaid = event.data.amount / 100;

    try {
      const existing = await pool.query(
        `SELECT id, status FROM payments WHERE paystack_reference = $1`,
        [reference],
      );

      if (existing.rows.length === 0) {
        return res.status(200).send("No matching payment found");
      }

      if (existing.rows[0].status === "success") {
        return res.status(200).send("Already processed");
      }

      const paymentId = existing.rows[0].id;

      await pool.query(
        `UPDATE payments SET status = 'success', amount_paid = $1, paid_at = NOW() WHERE id = $2`,
        [amountPaid, paymentId],
      );

      const receiptNumber = `RCPT-2026-${String(paymentId).padStart(4, "0")}`;
      await pool.query(
        `INSERT INTO receipts (payment_id, receipt_number) VALUES ($1, $2)`,
        [paymentId, receiptNumber],
      );

      res.status(200).send("Webhook processed");
    } catch (err) {
      console.error("Webhook processing error:", err);
      res.status(500).send("Webhook processing failed");
    }
  } else {
    res.status(200).send("Event ignored");
  }
}

module.exports = { initializePayment, handleWebhook };
