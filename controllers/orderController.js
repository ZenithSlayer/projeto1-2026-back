const db = require("../db");

// Helper for promises
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// 1. Create Order (Checkout)
exports.createOrder = async (req, res) => {
  const { total, items } = req.body;
  const userId = req.user.id;

  try {
    // Start Transaction
    await query("START TRANSACTION");

    const orderResult = await query(
      "INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)",
      [userId, total, "paid"]
    );
    
    const orderId = orderResult.insertId;

    // Optional: Insert into order_items if you are tracking them
    // items.forEach(...) 

    // Clear the cart
    await query("DELETE FROM cart WHERE user_id = ?", [userId]);

    await query("COMMIT");
    res.status(201).json({ message: "Order placed successfully", orderId });
  } catch (err) {
    await query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
};

// 2. Get All Orders (This was likely the missing function causing the crash)
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

// 3. Get Order Details
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