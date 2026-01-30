const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helpers
const validEmail = (e) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(e);
const validPassword = (p) => /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[#@$&]).{8,12}$/.test(p);
const validContact = (c) => /^\d{10}$/.test(c);
const isAdmin = (role) => role === 'admin';

const validateUserData = (data, includePassword = true) => {
  const errors = [];
  if (!data.first_name?.trim()) errors.push("First name is required");
  if (!data.last_name?.trim()) errors.push("Last name is required");
  if (!data.contact?.trim()) errors.push("Contact is required");
  if (!data.email?.trim()) errors.push("Email is required");
  if (!data.address?.trim()) errors.push("Address is required");
  if (includePassword && !data.password?.trim()) errors.push("Password is required");
  if (errors.length > 0) return errors;
  
  if (data.first_name.trim().length > 50) errors.push("First name must be max 50 characters");
  if (data.last_name.trim().length > 50) errors.push("Last name must be max 50 characters");
  if (!validContact(data.contact.trim())) errors.push("Contact must be exactly 10 digits");
  if (!validEmail(data.email.trim())) errors.push("Email must be valid @gmail.com address");
  if (includePassword && !validPassword(data.password.trim())) {
    errors.push("Password must be 8-12 chars with uppercase, lowercase, number, special char (#,$,&,@)");
  }
  return errors;
};

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const result = await pool.query(
      "SELECT id, first_name, last_name, email, contact, address, is_active, role, profile_image, created_at FROM users WHERE email = $1 AND password = $2 AND is_deleted = false",
      [email, password]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    const user = result.rows[0];
    if (!user.is_active) return res.status(403).json({ error: "Account is inactive" });
    res.json(user);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET USERS
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM get_active_users()");
    res.json(result.rows);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ADD USER
app.post("/users", async (req, res) => {
  const { first_name, last_name, contact, email, address, password, userRole } = req.body;
  
  if (!isAdmin(userRole)) return res.status(403).json({ error: "Admin access required" });
  
  const errors = validateUserData({ first_name, last_name, contact, email, address, password }, true);
  if (errors.length > 0) return res.status(400).json({ error: errors.join(", ") });

  try {
    const result = await pool.query(
      "SELECT * FROM add_user($1,$2,$3,$4,$5,$6)", 
      [first_name.trim(), last_name.trim(), contact.trim(), email.trim().toLowerCase(), address.trim(), password.trim()]
    );
    res.status(201).json({ message: "User added successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Add user error:", error);
    if (error.message.includes("already exists")) {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(400).json({ error: error.message });
  }
});

// UPDATE USER
app.put("/users/:id", async (req, res) => {
  const { first_name, last_name, contact, address, userRole } = req.body;
  const { id } = req.params;
  
  if (!isAdmin(userRole)) return res.status(403).json({ error: "Admin access required" });
  
  const errors = validateUserData({ first_name, last_name, contact, email: "dummy@gmail.com", address }, false);
  const filteredErrors = errors.filter(e => !e.includes("Email"));
  if (filteredErrors.length > 0) return res.status(400).json({ error: filteredErrors.join(", ") });

  try {
    const result = await pool.query(
      "SELECT * FROM update_user_details($1,$2,$3,$4,$5)",
      [id, first_name.trim(), last_name.trim(), contact.trim(), address.trim()]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User updated successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE USER
app.delete("/users/:id", async (req, res) => {
  const { userRole } = req.body;
  if (!isAdmin(userRole)) return res.status(403).json({ error: "Admin access required" });

  try {
    await pool.query("CALL soft_delete_user_proc($1)", [req.params.id]);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Delete failed" });
  }
});

// TOGGLE STATUS
app.patch("/users/status/:id", async (req, res) => {
  const { userRole } = req.body;
  if (!isAdmin(userRole)) return res.status(403).json({ error: "Admin access required" });

  try {
    const result = await pool.query("SELECT toggle_user_status($1)", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Status updated successfully", newStatus: result.rows[0].toggle_user_status });
  } catch (error) {
    console.error("Toggle status error:", error);
    res.status(500).json({ error: "Toggle failed" });
  }
});

// UPDATE PROFILE IMAGE
app.patch("/users/:id/profile-image", async (req, res) => {
  const { profile_image } = req.body;
  if (!profile_image) return res.status(400).json({ error: "Profile image is required" });
  
  try {
    const result = await pool.query(
      "UPDATE users SET profile_image = $1 WHERE id = $2 AND is_deleted = false RETURNING id",
      [profile_image, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Profile image updated successfully" });
  } catch (error) {
    console.error("Profile image update error:", error);
    res.status(500).json({ error: "Failed to update image" });
  }
});

// ✅ OPTIMIZED BULK UPLOAD (15 lines instead of 80)
app.post("/users/bulk-upload", async (req, res) => {
  const { users, userRole } = req.body;
  
  if (!isAdmin(userRole)) return res.status(403).json({ error: "Admin access required" });
  if (!users || !Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: "No users data provided" });
  }

  try {
    const result = await pool.query("SELECT * FROM bulk_insert_users($1)", [JSON.stringify(users)]);
    
    const rows = result.rows;
    const successful = rows.filter(r => r.success).map(r => ({ row: r.row_number, id: r.user_id }));
    const failed = rows.filter(r => !r.success).map(r => ({ row: r.row_number, errors: [r.error_message] }));
    
    res.json({
      successful,
      failed,
      summary: { total: users.length, success: successful.length, failed: failed.length }
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ error: "Bulk upload failed" });
  }
});

app.listen(5000, () => console.log("✅ Backend running on port 5000"));