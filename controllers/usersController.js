const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.getMe = (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.user.id;

  const userQuery = `
    SELECT id, name, email, cpf, is_admin 
    FROM users 
    WHERE id = ?
  `;

  const ordersQuery = `
    SELECT * FROM orders WHERE user_id = ?
  `;

  const addressesQuery = `
    SELECT * FROM addresses WHERE user_id = ?
  `;

  const cardsQuery = `
    SELECT id, card_number, expiration_date 
    FROM credit_cards 
    WHERE user_id = ?
  `;

  db.query(userQuery, [userId], (err, userResult) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!userResult.length)
      return res.status(404).json({ error: "User not found" });

    const user = userResult[0];

    db.query(ordersQuery, [userId], (err, orders) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query(addressesQuery, [userId], (err, addresses) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(cardsQuery, [userId], (err, cards) => {
          if (err) return res.status(500).json({ error: err.message });

          return res.json({
            user,
            orders: orders || [],
            addresses: addresses || [],
            cards: cards || [],
          });
        });
      });
    });
  });
};

exports.registerUser = async (req, res) => {
  const { name, email, password, cpf, is_admin } = req.body;

  if (!name || !email || !password || !cpf) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

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
      },
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginUser = (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ error: "Email/username and password are required" });
  }

  const query = `
    SELECT * FROM users 
    WHERE email = ? OR name = ?
  `;

  db.query(query, [identifier, identifier], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = results[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin,
      },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "1h" },
    );

    res.json({ token });
  });
};

exports.addAddress = (req, res) => {
  const userId = req.user.id;
  const { country, state, city, street, number, postal_code } = req.body;

  if (!country || !state || !city || !street || !number) {
    return res.status(400).json({ error: "All fields required" });
  }

  const checkQuery = `
    SELECT id FROM addresses 
    WHERE user_id = ? 
    AND street = ? 
    AND number = ? 
    AND city = ?
  `;

  db.query(checkQuery, [userId, street, number, city], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length > 0) {
      return res.status(409).json({
        error: "Address already exists",
      });
    }

    const insertQuery = `
      INSERT INTO addresses (user_id, country, state, city, street, number, postal_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [userId, country, state, city, street, number, postal_code || null],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ message: "Address added successfully" });
      },
    );
  });
};
exports.addCard = (req, res) => {
  const userId = req.user.id;
  const { card_number, security_code, expiration_date } = req.body;

  if (!card_number || !security_code || !expiration_date) {
    return res.status(400).json({ error: "All fields required" });
  }

  const checkQuery = `
    SELECT id FROM credit_cards 
    WHERE user_id = ? 
    AND card_number = ?
  `;

  db.query(checkQuery, [userId, card_number], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length > 0) {
      return res.status(409).json({
        error: "Card already exists",
      });
    }

    const insertQuery = `
      INSERT INTO credit_cards (user_id, card_number, security_code, expiration_date)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [userId, card_number, security_code, expiration_date],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ message: "Card added successfully" });
      },
    );
  });
};
