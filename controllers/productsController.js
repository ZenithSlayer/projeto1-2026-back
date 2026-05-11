const db = require("../db");

exports.getAllProducts = (req, res) => {
  db.query("SELECT * FROM products WHERE is_deleted = 0", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getAllCategory = (req, res) => {
  const { id } = req.params;
  db.query("SELECT products.* FROM products INNER JOIN product_categories ON id = product_id WHERE category_id = ? and is_deleted = 0", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getAllTags = (req, res) => {
  const { id } = req.params;
  db.query("SELECT c.name, c.id FROM categories c INNER JOIN product_categories pc ON c.id = pc.category_id GROUP BY c.name HAVING COUNT(pc.product_id) > 0;", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getProductById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "Product not found" });
    res.json(results[0]);
  });
};

exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, description, price, image } = req.body;
  try {
    db.query(
      "UPDATE products SET name=?, description=?, price=?, image_url=? WHERE id=?",
      [name, description, price, image, id]
    );
    res.json({ message: "Product updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  db.query("UPDATE products SET is_deleted = TRUE WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Product archived (Soft Deleted)" });
  });
};