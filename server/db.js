require("dotenv").config();
console.log("DB Password being used: ", process.env.DB_PASSWORD);
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: process.env.DB_HOST.includes("render.com")
    ? { rejectUnauthorized: false }
    : false,
});

module.exports = pool;
