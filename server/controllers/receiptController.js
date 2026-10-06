const pool = require("../db");
const PDFDocument = require("pdfkit");

async function getReceipt(req, res) {
  const parentId = req.user.userId;
  const { paymentId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        r.receipt_number, r.generated_at,
        p.amount_paid, p.paid_at, p.paystack_reference,
        s.name AS student_name, s.middle_name, s.class, s.admission_number, s.parent_id,
        fc.name AS fee_name
      FROM receipts r
      JOIN payments p ON p.id = r.payment_id
      JOIN students s ON s.id = p.student_id
      JOIN fee_structures fs ON fs.id = p.fee_structure_id
      JOIN fee_categories fc ON fc.id = fs.fee_category_id
      WHERE p.id = $1
    `,
      [paymentId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const receipt = result.rows[0];

    if (receipt.parent_id !== parentId) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this receipt" });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${receipt.receipt_number}.pdf`,
    );

    doc.pipe(res);

    doc
      .fontSize(20)
      .fillColor("#1B4332")
      .text("Crown Heights College", { align: "center" });
    doc
      .fontSize(11)
      .fillColor("#6b6b63")
      .text("Fee Payment Receipt", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(10).fillColor("#22221E");
    doc.text(`Receipt No: ${receipt.receipt_number}`);
    doc.text(
      `Date: ${new Date(receipt.paid_at).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}`,
    );
    doc.moveDown();

    doc
      .fontSize(12)
      .fillColor("#1B4332")
      .text("Student Details", { underline: true });
    doc.fontSize(10).fillColor("#22221E");
    doc.text(
      `Name: ${receipt.student_name}${receipt.middle_name ? " " + receipt.middle_name : ""}`,
    );
    doc.text(`Class: ${receipt.class}`);
    doc.text(`Admission No: ${receipt.admission_number}`);
    doc.moveDown();

    doc
      .fontSize(12)
      .fillColor("#1B4332")
      .text("Payment Details", { underline: true });
    doc.fontSize(10).fillColor("#22221E");
    doc.text(`Fee: ${receipt.fee_name}`);
    doc.text(
      `Amount Paid: ₦${parseFloat(receipt.amount_paid).toLocaleString()}`,
    );
    doc.text(`Paystack Reference: ${receipt.paystack_reference}`);
    doc.moveDown(2);

    doc
      .fontSize(9)
      .fillColor("#6b6b63")
      .text(
        "This is a computer-generated receipt and does not require a signature.",
        { align: "center" },
      );

    doc.end();
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to generate receipt", error: err.message });
  }
}

async function getPaymentHistory(req, res) {
  const parentId = req.user.userId;

  try {
    const result = await pool.query(
      `
      SELECT p.id AS payment_id, p.amount_paid, p.paid_at, s.name AS student_name,
        fc.name AS fee_name, r.receipt_number
      FROM payments p
      JOIN students s ON s.id = p.student_id
      JOIN fee_structures fs ON fs.id = p.fee_structure_id
      JOIN fee_categories fc ON fc.id = fs.fee_category_id
      LEFT JOIN receipts r ON r.payment_id = p.id
      WHERE s.parent_id = $1 AND p.status = 'success'
      ORDER BY p.paid_at DESC
    `,
      [parentId],
    );

    res.json(result.rows);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch payment history", error: err.message });
  }
}

module.exports = { getReceipt, getPaymentHistory };
