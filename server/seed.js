const pool = require("./db");
const bcrypt = require("bcryptjs");

// --- Name pools for generating students ---
const muslimFirstNamesGirls = [
  "Aisha",
  "Fatima",
  "Zainab",
  "Hauwa",
  "Maryam",
  "Khadija",
  "Amina",
  "Hadiza",
  "Rukayya",
  "Safiya",
  "Halima",
  "Nafisa",
];
const muslimFirstNamesBoys = [
  "Abdullahi",
  "Ibrahim",
  "Musa",
  "Yusuf",
  "Suleiman",
  "Umar",
  "Aliyu",
  "Ismail",
  "Bello",
  "Usman",
  "Muhammad",
  "Abubakar",
];
const christianFirstNamesGirls = [
  "Blessing",
  "Grace",
  "Joy",
  "Precious",
  "Faith",
  "Esther",
  "Ruth",
  "Mercy",
  "Favour",
  "Deborah",
  "Hannah",
  "Comfort",
];
const christianFirstNamesBoys = [
  "Emmanuel",
  "Daniel",
  "David",
  "Samuel",
  "Peter",
  "John",
  "Joshua",
  "Michael",
  "Gabriel",
  "Victor",
  "Godwin",
  "Stephen",
];

const surnamesByTribe = {
  Hausa: [
    "Sani",
    "Garba",
    "Lawal",
    "Isah",
    "Mamman",
    "Shehu",
    "Jibril",
    "Tanko",
  ],
  Nupe: ["Ndayako", "Gana", "Kolo", "Ndako", "Makun"],
  Yoruba: [
    "Ogunleye",
    "Salami",
    "Adewale",
    "Ojo",
    "Fashola",
    "Akinwale",
    "Olaniyan",
    "Bamidele",
    "Ajayi",
  ],
  Igbo: [
    "Nwosu",
    "Eze",
    "Obi",
    "Okonkwo",
    "Nwachukwu",
    "Ugwu",
    "Okeke",
    "Anyanwu",
    "Uzor",
  ],
  Fulani: ["Bello", "Jallo", "Barde", "Adamu"],
  Other: ["Bassey", "Effiong", "Osagie", "Iyamu", "Togoriyamba"],
};

const tribeWeights = [
  { tribe: "Nupe", weight: 36 },
  { tribe: "Hausa", weight: 34 },
  { tribe: "Yoruba", weight: 32 },
  { tribe: "Igbo", weight: 16 },
  { tribe: "Fulani", weight: 10 },
  { tribe: "Other", weight: 5 },
];

async function seed() {
  console.log("Starting seed...");

  // --- Clear all existing data first, so this script is always safe to re-run ---
  await pool.query(
    "TRUNCATE TABLE receipts, payments, fee_structures, fee_categories, students, users RESTART IDENTITY CASCADE",
  );
  console.log("Old data cleared.");

  // --- Hash a shared demo password ---
  const staffPassword = await bcrypt.hash("Staff123!", 10);

  // --- Insert staff accounts ---
  const directorResult = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [
      "Dr. Bashir Balogun",
      "director@crownheights.edu.ng",
      staffPassword,
      "director",
    ],
  );

  const wifeResult = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [
      "Dr. Afisat Ayorinde",
      "admin@crownheights.edu.ng",
      staffPassword,
      "director",
    ],
  );

  const principalResult = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [
      "Malam Salisu Danjuma",
      "principal@crownheights.edu.ng",
      staffPassword,
      "principal",
    ],
  );

  const bursarResult = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [
      "Mrs. Ifunanya Okafor",
      "bursar@crownheights.edu.ng",
      staffPassword,
      "bursar",
    ],
  );

  console.log("Staff accounts created.");
  console.log("Director ID:", directorResult.rows[0].id);

  // --- Fee categories ---
  const classes = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];
  const directorId = directorResult.rows[0].id;

  const feeCategoriesData = [
    { name: "Tuition", mandatory: true, recurrence_type: "recurring" },
    { name: "PTA Levy", mandatory: true, recurrence_type: "recurring" },
    { name: "CBT/Exam Fee", mandatory: true, recurrence_type: "recurring" },
    {
      name: "WAEC/NECO Registration",
      mandatory: true,
      recurrence_type: "one_time",
    },
    { name: "Excursion", mandatory: false, recurrence_type: "one_time" },
    {
      name: "Inter-house Sports",
      mandatory: false,
      recurrence_type: "one_time",
    },
    { name: "Cultural Day", mandatory: false, recurrence_type: "one_time" },
    {
      name: "Handcraft Materials",
      mandatory: false,
      recurrence_type: "one_time",
    },
    {
      name: "Cooking Practical",
      mandatory: false,
      recurrence_type: "one_time",
    },
    {
      name: "Science Lab Practical",
      mandatory: false,
      recurrence_type: "one_time",
    },
  ];

  const categoryIds = {};

  for (const cat of feeCategoriesData) {
    const result = await pool.query(
      `INSERT INTO fee_categories (name, mandatory, recurrence_type, created_by)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [cat.name, cat.mandatory, cat.recurrence_type, directorId],
    );
    categoryIds[cat.name] = result.rows[0].id;
  }

  console.log("Fee categories created.");

  // --- Fee structures (which class pays what, and how much) ---
  const feeStructuresData = [
    { category: "Tuition", class: "JSS1", term: "First Term", amount: 45000 },
    { category: "Tuition", class: "JSS2", term: "First Term", amount: 45000 },
    { category: "Tuition", class: "JSS3", term: "First Term", amount: 48000 },
    { category: "Tuition", class: "SS1", term: "First Term", amount: 55000 },
    { category: "Tuition", class: "SS2", term: "First Term", amount: 55000 },
    { category: "Tuition", class: "SS3", term: "First Term", amount: 60000 },

    ...classes.map((c) => ({
      category: "PTA Levy",
      class: c,
      term: "First Term",
      amount: 3000,
    })),
    ...classes.map((c) => ({
      category: "CBT/Exam Fee",
      class: c,
      term: "First Term",
      amount: 2500,
    })),

    {
      category: "WAEC/NECO Registration",
      class: "SS3",
      term: null,
      amount: 30000,
    },

    ...classes.map((c) => ({
      category: "Excursion",
      class: c,
      term: null,
      amount: 5000,
    })),
    ...classes.map((c) => ({
      category: "Inter-house Sports",
      class: c,
      term: null,
      amount: 1500,
    })),
    ...classes.map((c) => ({
      category: "Cultural Day",
      class: c,
      term: null,
      amount: 2000,
    })),

    {
      category: "Handcraft Materials",
      class: "JSS1",
      term: null,
      amount: 1500,
    },
    {
      category: "Handcraft Materials",
      class: "JSS2",
      term: null,
      amount: 1500,
    },

    { category: "Cooking Practical", class: "JSS3", term: null, amount: 3000 },

    {
      category: "Science Lab Practical",
      class: "SS1",
      term: null,
      amount: 4000,
    },
    {
      category: "Science Lab Practical",
      class: "SS2",
      term: null,
      amount: 4000,
    },
    {
      category: "Science Lab Practical",
      class: "SS3",
      term: null,
      amount: 4000,
    },
  ];

  for (const fs of feeStructuresData) {
    await pool.query(
      `INSERT INTO fee_structures (fee_category_id, class, term, amount)
       VALUES ($1, $2, $3, $4)`,
      [categoryIds[fs.category], fs.class, fs.term, fs.amount],
    );
  }

  console.log(`Fee structures created (${feeStructuresData.length} rows).`);

  // --- Helper: pick a random item from an array ---
  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // --- Helper: pick a tribe based on our weights ---
  function pickWeightedTribe() {
    const totalWeight = tribeWeights.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;
    for (const t of tribeWeights) {
      if (random < t.weight) return t.tribe;
      random -= t.weight;
    }
  }

  // --- Religion probability depends on tribe (realistic correlation) ---
  const muslimProbabilityByTribe = {
    Hausa: 0.9,
    Fulani: 0.95,
    Nupe: 0.85,
    Yoruba: 0.5,
    Igbo: 0.05,
    Other: 0.5,
  };

  // --- Generate 150 students ---
  const studentsData = [];
  const usedFullNames = new Set();
  let admissionCounter = 1001;

  while (studentsData.length < 150) {
    const tribe = pickWeightedTribe();
    const surname = randomItem(surnamesByTribe[tribe]);
    const isBoy = Math.random() < 0.5;
    const isMuslim = Math.random() < muslimProbabilityByTribe[tribe];
    let firstName;
    if (isBoy) {
      firstName = isMuslim
        ? randomItem(muslimFirstNamesBoys)
        : randomItem(christianFirstNamesBoys);
    } else {
      firstName = isMuslim
        ? randomItem(muslimFirstNamesGirls)
        : randomItem(christianFirstNamesGirls);
    }

    const fullNameKey = `${firstName} ${surname}`;
    if (usedFullNames.has(fullNameKey)) continue; // skip, try again

    usedFullNames.add(fullNameKey);

    studentsData.push({
      firstName,
      surname,
      middleName: null,
      class: randomItem(classes),
      admissionNumber: `CHC/${admissionCounter}`,
    });
    admissionCounter++;
  }

  // --- Intentionally add 2 duplicate-name students, to demo the middle-name feature ---
  studentsData.push({
    firstName: "Isah",
    surname: "Ibrahim",
    middleName: null,
    class: "JSS2",
    admissionNumber: `CHC/${admissionCounter}`,
  });
  admissionCounter++;

  studentsData.push({
    firstName: "Isah",
    surname: "Ibrahim",
    middleName: "Suleiman", // disambiguated with a middle name
    class: "SS1",
    admissionNumber: `CHC/${admissionCounter}`,
  });
  admissionCounter++;

  console.log(`Generated ${studentsData.length} student names.`);
  console.log("Sample:", studentsData.slice(0, 5));

  const studentIds = [];

  for (const s of studentsData) {
    const result = await pool.query(
      `INSERT INTO students (name, middle_name, class, admission_number)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [`${s.firstName} ${s.surname}`, s.middleName, s.class, s.admissionNumber],
    );
    studentIds.push({ id: result.rows[0].id, ...s });
  }

  console.log(`${studentIds.length} students inserted into the database.`);

   // --- Group students by surname first, then form families from matching surnames ---
  const studentsBySurname = {};
  for (const s of studentIds) {
    if (!studentsBySurname[s.surname]) studentsBySurname[s.surname] = [];
    studentsBySurname[s.surname].push(s);
  }

  const families = [];
  for (const surname in studentsBySurname) {
    const group = studentsBySurname[surname];
    while (group.length > 0) {
      let familySize = 1;
      if (group.length >= 2 && Math.random() < 0.3) {
        familySize = group.length >= 3 && Math.random() < 0.5 ? 3 : 2;
      }
      const familyStudents = group.splice(0, familySize);

      // --- Twins: if this family has more than 1 child, 20% chance they're twins ---
      if (familyStudents.length > 1 && Math.random() < 0.2) {
        const twinClass = familyStudents[0].class;
        for (const sibling of familyStudents) {
          if (sibling.class !== twinClass) {
            sibling.class = twinClass; // update in memory, for the payments step later
            await pool.query('UPDATE students SET class = $1 WHERE id = $2', [twinClass, sibling.id]);
          }
        }
      }

      families.push(familyStudents);
    }
  }

  console.log(`${families.length} families formed from ${studentIds.length} students.`);

  // --- Titles to mix across parents ---
  const titles = ["Mr.", "Mrs.", "Alhaji", "Alhaja", "Chief", "Dr.", "Engr."];

  const parentPassword = await bcrypt.hash("Parent123!", 10);
  let parentCounter = 1;
  let totalParents = 0;

  for (const family of families) {
    const surname = family[0].surname; // every student in this family shares a surname
    const title = randomItem(titles);
    const parentName = `${title} ${randomItem(muslimFirstNamesBoys.concat(christianFirstNamesBoys))} ${surname}`;
    const parentEmail = `parent${parentCounter}@example.com`;

    const parentResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [parentName, parentEmail, parentPassword, "parent"],
    );

    const parentId = parentResult.rows[0].id;

    // Link every child in this family to this parent
    for (const student of family) {
      await pool.query(`UPDATE students SET parent_id = $1 WHERE id = $2`, [
        parentId,
        student.id,
      ]);
    }

    parentCounter++;
    totalParents++;
  }

  console.log(
    `${totalParents} parent accounts created and linked to their children.`,
  );

  // --- Fetch the fee structures we already created, grouped by class ---
  const feeStructuresResult = await pool.query(
    "SELECT id, class, amount FROM fee_structures",
  );
  const feeStructuresByClass = {};
  for (const row of feeStructuresResult.rows) {
    if (!feeStructuresByClass[row.class]) feeStructuresByClass[row.class] = [];
    feeStructuresByClass[row.class].push(row);
  }

  // --- Helper: a random date within the last 60 days ---
  function randomRecentDate() {
    const daysAgo = Math.floor(Math.random() * 60);
    return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  }

  let paymentCounter = 1;
  let receiptCounter = 1;
  let paymentsCreated = 0;
  let receiptsCreated = 0;

  for (const student of studentIds) {
    const applicableFees = feeStructuresByClass[student.class] || [];
    const roll = Math.random();
    const category = roll < 0.6 ? "full" : roll < 0.85 ? "partial" : "owing";

    for (const fee of applicableFees) {
      let shouldPay = false;
      let amountPaid = fee.amount;
      let status = "success";

      if (category === "full") {
        shouldPay = true;
        amountPaid = fee.amount;
      } else if (category === "partial") {
        const feeRoll = Math.random();
        if (feeRoll < 0.5) {
          shouldPay = true;
          amountPaid = fee.amount;
        } else if (feeRoll < 0.8) {
          shouldPay = true;
          amountPaid = Math.round(fee.amount * (0.2 + Math.random() * 0.6));
        }
      } else {
        if (Math.random() < 0.1) {
          shouldPay = true;
          status = Math.random() < 0.5 ? "pending" : "failed";
        }
      }

      if (!shouldPay) continue;

      const reference = `PSK-${Date.now()}-${paymentCounter}`;
      const paidAt = status === "success" ? randomRecentDate() : null;

      const paymentResult = await pool.query(
        `INSERT INTO payments (student_id, fee_structure_id, amount_paid, paystack_reference, status, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [student.id, fee.id, amountPaid, reference, status, paidAt],
      );
      paymentsCreated++;
      paymentCounter++;

      if (status === "success") {
        const receiptNumber = `RCPT-2026-${String(receiptCounter).padStart(4, "0")}`;
        await pool.query(
          `INSERT INTO receipts (payment_id, receipt_number) VALUES ($1, $2)`,
          [paymentResult.rows[0].id, receiptNumber],
        );
        receiptsCreated++;
        receiptCounter++;
      }
    }
  }

  console.log(
    `${paymentsCreated} payments created, ${receiptsCreated} receipts generated.`,
  );

  console.log("Seeding complete!");
  process.exit();
}

seed();
