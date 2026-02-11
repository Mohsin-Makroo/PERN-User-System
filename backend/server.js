const express = require("express");
const cors = require("cors");
const pool = require("./db");
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helpers
const validEmail = (e) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(e);
const validPassword = (p) => /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[#@$&]).{8,12}$/.test(p);
const validContact = (c) => /^\d{10}$/.test(c);
const isAdmin = (role) => role === 'admin';

const validateUser = (data, pwd = true) => {
  const errors = [];
  ['first_name', 'last_name', 'contact', 'email', 'address'].forEach(f => { if (!data[f]?.trim()) errors.push(`${f.replace('_', ' ')} required`); });
  if (pwd && !data.password?.trim()) errors.push("Password required");
  if (errors.length > 0) return errors;
  if (data.first_name.trim().length > 50) errors.push("First name max 50 chars");
  if (data.last_name.trim().length > 50) errors.push("Last name max 50 chars");
  if (!validContact(data.contact.trim())) errors.push("Contact must be 10 digits");
  if (!validEmail(data.email.trim())) errors.push("Email must be @gmail.com");
  if (pwd && !validPassword(data.password.trim())) errors.push("Password: 8-12 chars, upper, lower, number, special (#,$,&,@)");
  return errors;
};

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  try {
    const result = await pool.query("SELECT id, first_name, last_name, email, contact, address, is_active, role, profile_image, created_at FROM users WHERE email = $1 AND password = $2 AND is_deleted = false", [email, password]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    const user = result.rows[0];
    if (!user.is_active) return res.status(403).json({ error: "Account is inactive" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET USERS
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM get_active_users()");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
// ADD USER (Using stored function)
app.post("/users", async (req, res) => {
  const { first_name, last_name, contact, email, address, password, role, userRole } = req.body;
  if (!isAdmin(userRole)) return res.status(403).json({ error: "Admin access required" });
  const errors = validateUser(req.body);
  if (errors.length > 0) return res.status(400).json({ error: errors.join(", ") });
  const assignedRole = role === 'admin' || role === 'user' ? role : 'user';
  try {
    const result = await pool.query("SELECT * FROM add_user($1, $2, $3, $4, $5, $6, $7)",
      [first_name.trim(), last_name.trim(), contact.trim(), email.trim().toLowerCase(), address.trim(), password.trim(), assignedRole]);
    res.status(201).json({ message: "User added successfully", user: result.rows[0] });
  } catch (error) {
    if (error.message.includes('Email already exists')) return res.status(409).json({ error: "Email already exists" });
    res.status(400).json({ error: error.message });
  }
});

// UPDATE USER (Using stored function)
app.put("/users/:id", async (req, res) => {
  const { first_name, last_name, contact, address, role, userRole } = req.body;
  if (!isAdmin(userRole)) return res.status(403).json({ error: "Admin access required" });
  const errors = validateUser({ ...req.body, email: "dummy@gmail.com" }, false).filter(e => !e.includes("Email"));
  if (errors.length > 0) return res.status(400).json({ error: errors.join(", ") });
  const assignedRole = role === 'admin' || role === 'user' ? role : 'user';
  try {
    const result = await pool.query("SELECT * FROM update_user_details($1, $2, $3, $4, $5, $6)",
      [req.params.id, first_name.trim(), last_name.trim(), contact.trim(), address.trim(), assignedRole]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User updated successfully", user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE USER
app.delete("/users/:id", async (req, res) => {
  if (!isAdmin(req.body.userRole)) return res.status(403).json({ error: "Admin access required" });
  try {
    await pool.query("CALL soft_delete_user_proc($1)", [req.params.id]);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// TOGGLE STATUS
app.patch("/users/status/:id", async (req, res) => {
  if (!isAdmin(req.body.userRole)) return res.status(403).json({ error: "Admin access required" });
  try {
    const result = await pool.query("SELECT toggle_user_status($1)", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Status updated successfully", newStatus: result.rows[0].toggle_user_status });
  } catch (error) {
    res.status(500).json({ error: "Toggle failed" });
  }
});

// UPDATE PROFILE IMAGE
app.patch("/users/:id/profile-image", async (req, res) => {
  if (!req.body.profile_image) return res.status(400).json({ error: "Profile image is required" });
  try {
    const result = await pool.query("UPDATE users SET profile_image = $1 WHERE id = $2 AND is_deleted = false RETURNING id", [req.body.profile_image, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Profile image updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update image" });
  }
});

// BULK UPLOAD
app.post("/users/bulk-upload", async (req, res) => {
  const { users, userRole } = req.body;
  if (!isAdmin(userRole)) return res.status(403).json({ error: "Admin access required" });
  if (!users || !Array.isArray(users) || users.length === 0) return res.status(400).json({ error: "No users data provided" });

  try {
    const result = await pool.query("SELECT * FROM bulk_insert_users($1)", [JSON.stringify(users)]);
    const successful = [], failed = [];
    result.rows.forEach((r, i) => {
      if (r.success) successful.push({ row: r.row_number, data: users[i], id: r.user_id });
      else failed.push({ row: r.row_number, data: users[i], errors: [r.error_message] });
    });
    res.json({ successful, failed, summary: { total: users.length, success: successful.length, failed: failed.length } });
  } catch (error) {
    res.status(500).json({ error: "Bulk upload failed" });
  }
});

// DOWNLOAD CSV
app.get("/users/download/csv", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM get_active_users()");
    const csvData = result.rows.map(u => ({ 'First Name': u.first_name, 'Last Name': u.last_name, 'Email': u.email, 'Contact': u.contact, 'Address': u.address, 'Status': u.is_active ? 'Active' : 'Inactive', 'Role': u.role === 'admin' ? 'Admin' : 'User', 'Created At': new Date(u.created_at).toLocaleDateString() }));
    const csv = new Parser().parse(csvData);
    res.header('Content-Type', 'text/csv').header('Content-Disposition', 'attachment; filename=users.csv').send(csv);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate CSV" });
  }
});

// DOWNLOAD EXCEL
app.get("/users/download/excel", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM get_active_users()");
    const excelData = result.rows.map(u => ({ 'First Name': u.first_name, 'Last Name': u.last_name, 'Email': u.email, 'Contact': u.contact, 'Address': u.address, 'Status': u.is_active ? 'Active' : 'Inactive', 'Role': u.role === 'admin' ? 'Admin' : 'User', 'Created At': new Date(u.created_at).toLocaleDateString() }));
    res.json(excelData);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate Excel data" });
  }
});

// DOWNLOAD PDF
app.get("/users/download/pdf", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM get_active_users()");
    const users = result.rows;
    const doc = new PDFDocument({ margin: 50 });
    res.header('Content-Type', 'application/pdf').header('Content-Disposition', 'attachment; filename=users.pdf');
    doc.pipe(res);
    doc.fontSize(20).text('User Management Report', { align: 'center' }).moveDown().fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' }).moveDown(2);
    doc.fontSize(12).text(`Total Users: ${users.length}`).text(`Active Users: ${users.filter(u => u.is_active).length}`).text(`Admin Users: ${users.filter(u => u.role === 'admin').length}`).moveDown(2);
    doc.fontSize(10).font('Helvetica-Bold');
    const startY = doc.y;
    doc.text('Name', 50, startY, { width: 120, continued: false }).text('Email', 170, startY, { width: 150, continued: false }).text('Contact', 320, startY, { width: 80, continued: false }).text('Role', 400, startY, { width: 60, continued: false }).text('Status', 460, startY, { width: 60, continued: false });
    doc.moveDown().moveTo(50, doc.y).lineTo(520, doc.y).stroke().moveDown(0.5).font('Helvetica');
    users.forEach((user) => {
      if (doc.y > 700) { doc.addPage(); doc.y = 50; }
      const currentY = doc.y;
      doc.text(`${user.first_name} ${user.last_name}`.substring(0, 20), 50, currentY, { width: 120, continued: false })
        .text(user.email.substring(0, 25), 170, currentY, { width: 150, continued: false })
        .text(user.contact, 320, currentY, { width: 80, continued: false })
        .text(user.role === 'admin' ? 'Admin' : 'User', 400, currentY, { width: 60, continued: false })
        .text(user.is_active ? 'Active' : 'Inactive', 460, currentY, { width: 60, continued: false });
      doc.moveDown(0.8);
    });
    doc.moveDown(2).fontSize(8).text('Generated by User Management System', { align: 'center' });
    doc.end();
  } catch (error) {
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

app.listen(5000, () => console.log("✅ Backend running on port 5000"));