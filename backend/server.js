const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

function validEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
}

function validPassword(p) {
  return /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[#@$&]).{8,12}$/.test(p);
}

app.post("/users", async (req, res) => {
  const { first_name, last_name, contact, email, address, password } = req.body;

  if (first_name.length > 50 || last_name.length > 50)
    return res.send("Name too long");

  if (!/^\d{10}$/.test(contact))
    return res.send("Contact number must be exactly 10 digits");

  if (!validEmail(email))
    return res.send("Email must be a valid @gmail.com address");

  if (!validPassword(password))
    return res.send(
      "Password must be 8–12 chars with upper, lower, number & special (# $ & @)"
    );

  try {
    await pool.query(
      "INSERT INTO users (first_name,last_name,contact,email,address,password) VALUES ($1,$2,$3,$4,$5,$6)",
      [first_name, last_name, contact, email, address, password]
    );
    res.send("User Added");
  } catch {
    res.send("Email already exists");
  }
});

app.get("/users", async (req, res) => {
  const users = await pool.query("SELECT * FROM users WHERE is_deleted=false");
  res.json(users.rows);
});

app.put("/users/:id", async (req, res) => {
  const { first_name, last_name, contact, address } = req.body;

  await pool.query(
    "UPDATE users SET first_name=$1,last_name=$2,contact=$3,address=$4 WHERE id=$5",
    [first_name, last_name, contact, address, req.params.id]
  );

  res.send("User Updated");
});

app.delete("/users/:id", async (req, res) => {
  await pool.query("UPDATE users SET is_deleted=true WHERE id=$1", [
    req.params.id,
  ]);
  res.send("User Soft Deleted");
});

app.patch("/users/status/:id", async (req, res) => {
  await pool.query("UPDATE users SET is_active = NOT is_active WHERE id=$1", [
    req.params.id,
  ]);
  res.send("Status Updated");
});

app.listen(5000, () => console.log("Backend running on 5000"));
