const db = require("../db");

const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

exports.getCart = async (req, res) => {
  try {
    // We JOIN with products to get price, name, and image for the frontend
    const sql = `
      SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_url 
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?`;
    const items = await query(sql, [req.user.id]);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addToCart = async (req, res) => {
  const { product_id, quantity } = req.body;
  try {
    // Check if item already exists to increment quantity instead of duplicate row
    const existing = await query("SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?", [req.user.id, product_id]);
    
    if (existing.length > 0) {
      await query("UPDATE cart SET quantity = quantity + ? WHERE id = ?", [quantity, existing[0].id]);
    } else {
      await query("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)", [req.user.id, product_id, quantity]);
    }
    res.json({ message: "Cart updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateQuantity = async (req, res) => {
  const { quantity } = req.body;
  try {
    await query("UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?", [quantity, req.params.id, req.user.id]);
    res.json({ message: "Quantity updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    await query("DELETE FROM cart WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json({ message: "Item removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};