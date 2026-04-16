const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const [userRows, orders, addresses, cards] = await Promise.all([
      query("SELECT id, name, email, cpf, is_admin FROM users WHERE id = ?", [userId]),
      query("SELECT * FROM orders WHERE user_id = ?", [userId]),
      query("SELECT * FROM addresses WHERE user_id = ?", [userId]),
      query("SELECT id, card_number, expiration_date, is_favorite FROM credit_cards WHERE user_id = ?", [userId])
    ]);

    if (!userRows.length) return res.status(404).json({ error: "User not found" });

    res.json({
      user: userRows[0],
      orders: orders || [],
      addresses: addresses || [],
      cards: cards || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.registerUser = async (req, res) => {
  const { name, email, password, cpf, is_admin } = req.body;
  
  if (!name || !email || !password || !cpf) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO users (name, email, password, cpf, is_admin) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, cpf, is_admin || false]
    );

    const token = jwt.sign(
      { 
        id: result.insertId, 
        email: email, 
        name: name, 
        is_admin: is_admin || false 
      },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "7d" }
    );

    res.status(201).json({ 
      message: "User created successfully", 
      token: token 
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Email or CPF already exists" });
    res.status(500).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const results = await query("SELECT * FROM users WHERE email = ? OR name = ?", [identifier, identifier]);
    if (results.length === 0) return res.status(401).json({ error: "User not found" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "7d" }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  try {
    await query("UPDATE users SET name = ?, email = ? WHERE id = ?", [name, email, req.user.id]);
    res.json({ user: { name, email } });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const rows = await query("SELECT password FROM users WHERE id = ?", [req.user.id]);
    const user = rows[0];

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: "Current password incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error updating password" });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const result = await query("DELETE FROM users WHERE id = ?", [req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Database constraint error" });
  }
};


exports.addAddress = async (req, res) => {
  const { country, state, city, street, number, postal_code } = req.body;
  try {
    await query(
      "INSERT INTO addresses (user_id, country, state, city, street, number, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [req.user.id, country, state, city, street, number, postal_code]
    );
    res.json({ message: "Address added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAddress = async (req, res) => {
    const { id } = req.params;
    const { country, state, city, street, number, postal_code } = req.body;
    try {
      await query(
        "UPDATE addresses SET country=?, state=?, city=?, street=?, number=?, postal_code=? WHERE id=? AND user_id=?",
        [country, state, city, street, number, postal_code, id, req.user.id]
      );
      res.json({ message: "Address updated" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
      await query("DELETE FROM addresses WHERE id=? AND user_id=?", [req.params.id, req.user.id]);
      res.json({ message: "Address deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};

exports.setFavoriteAddress = async (req, res) => {
    try {
      await query("UPDATE addresses SET is_favorite = 0 WHERE user_id = ?", [req.user.id]);
      await query("UPDATE addresses SET is_favorite = 1 WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
      res.json({ message: "Favorite updated" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};

exports.addCard = async (req, res) => {
    const { card_number, security_code, expiration_date } = req.body;
    try {
      await query(
        "INSERT INTO credit_cards (user_id, card_number, security_code, expiration_date) VALUES (?, ?, ?, ?)",
        [req.user.id, card_number, security_code, expiration_date]
      );
      res.json({ message: "Card added" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};

exports.deleteCard = async (req, res) => {
    try {
      await query("DELETE FROM credit_cards WHERE id=? AND user_id=?", [req.params.id, req.user.id]);
      res.json({ message: "Card deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};

exports.setFavoriteCard = async (req, res) => {
    try {
      await query("UPDATE credit_cards SET is_favorite = 0 WHERE user_id = ?", [req.user.id]);
      await query("UPDATE credit_cards SET is_favorite = 1 WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
      res.json({ message: "Favorite updated" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};