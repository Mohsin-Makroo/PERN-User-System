const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "internship",
  password: "macstar@11",
  port: 5432,
});

module.exports = pool;
