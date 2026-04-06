const db = require("../db");
const bcrypt = require("bcrypt");

// POST /users/register
exports.registerUser = async (req, res) => {
  const { name, email, password, cpf, is_admin } = req.body;

  // Basic validation
  if (!name || !email || !password || !cpf) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into DB
    const query = `
      INSERT INTO users (name, email, password, cpf, is_admin)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      query,
      [name, email, hashedPassword, cpf, is_admin || false],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res
              .status(409)
              .json({ error: "Email or CPF already registered" });
          }
          return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
          message: "User created successfully",
          userId: result.insertId,
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const jwt = require("jsonwebtoken");

// POST /users/login
exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ error: "User not found" });

    const user = results[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "1h" }
    );

    res.json({ token });
  });
};