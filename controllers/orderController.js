const db = require("../db");

const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

exports.createOrder = async (req, res) => {
  const { total, items } = req.body;
  const userId = req.user.id;

  try {
    const address = await query(
      "SELECT id FROM addresses WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (address.length === 0) {
      return res.status(400).json({ error: "No shipping address found. Please add an address before checkout." });
    }

    const card = await query(
      "SELECT id FROM credit_cards WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (card.length === 0) {
      return res.status(400).json({ error: "No payment method found. Please add a credit card before checkout." });
    }

    await query("START TRANSACTION");

    const orderResult = await query(
      "INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)",
      [userId, total, "paid"]
    );
    
    const orderId = orderResult.insertId;

    await query("DELETE FROM cart WHERE user_id = ?", [userId]);

    await query("COMMIT");
    res.status(201).json({ message: "Order placed successfully", orderId });
  } catch (err) {
    await query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const results = await query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", 
      [req.user.id]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const results = await query(
      "SELECT * FROM order_items WHERE order_id = ?", 
      [req.params.id]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};