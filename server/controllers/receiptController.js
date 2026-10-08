const pool = require("../db");
const PDFDocument = require("pdfkit");
const path = require("path");

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

    const doc = new PDFDocument({ size: "A4", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${receipt.receipt_number}.pdf`,
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const margin = 50;

    // --- Header band ---
    doc.rect(0, 0, pageWidth, 140).fill("#1B4332");

    const logoPath = path.join(__dirname, "../assets/logo.png");
    doc.image(logoPath, margin, 25, { width: 90 });

    doc
      .fillColor("#FAF8F3")
      .fontSize(22)
      .text("Crown Heights College", margin + 110, 35);
    doc
      .fillColor("#C9A227")
      .fontSize(12)
      .text("Fee Payment Receipt", margin + 110, 63);

    doc
      .fillColor("#D9D6CD")
      .fontSize(9)
      .text(receipt.receipt_number, pageWidth - margin - 150, 40, {
        width: 150,
        align: "right",
      });
    doc.text(
      new Date(receipt.paid_at).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      pageWidth - margin - 150,
      55,
      { width: 150, align: "right" },
    );

    // --- Gold divider ---
    doc.rect(0, 140, pageWidth, 4).fill("#C9A227");

    let y = 190;

    // --- Student Details box ---
    doc
      .roundedRect(margin, y, pageWidth - margin * 2, 110, 6)
      .lineWidth(1)
      .stroke("#E3E6E4");
    doc
      .fillColor("#1B4332")
      .fontSize(13)
      .text("Student Details", margin + 20, y + 16);
    doc.fillColor("#22221E").fontSize(11);
    doc.text(
      `Name: ${receipt.student_name}${receipt.middle_name ? " " + receipt.middle_name : ""}`,
      margin + 20,
      y + 42,
    );
    doc.text(`Class: ${receipt.class}`, margin + 20, y + 62);
    doc.text(`Admission No: ${receipt.admission_number}`, margin + 20, y + 82);

    y += 130;

    // --- Payment Details box ---
    doc
      .roundedRect(margin, y, pageWidth - margin * 2, 130, 6)
      .lineWidth(1)
      .stroke("#E3E6E4");
    doc
      .fillColor("#1B4332")
      .fontSize(13)
      .text("Payment Details", margin + 20, y + 16);
    doc.fillColor("#22221E").fontSize(11);
    doc.text(`Fee: ${receipt.fee_name}`, margin + 20, y + 42);
    doc.text(
      `Paystack Reference: ${receipt.paystack_reference}`,
      margin + 20,
      y + 62,
    );

    doc
      .fillColor("#1B4332")
      .fontSize(20)
      .text(
        `₦${parseFloat(receipt.amount_paid).toLocaleString()}`,
        margin + 20,
        y + 88,
      );
    doc
      .fillColor("#7A9B87")
      .fontSize(11)
      .text("PAID", pageWidth - margin - 100, y + 92, {
        width: 80,
        align: "right",
      });

    y += 170;

    // --- Footer ---
    doc
      .fillColor("#6b6b63")
      .fontSize(9)
      .text(
        "This is a computer-generated receipt and does not require a signature.",
        margin,
        y,
        { width: pageWidth - margin * 2, align: "center" },
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
