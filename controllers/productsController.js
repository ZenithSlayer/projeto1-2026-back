const db = require("../db");

exports.getAllProducts = (req, res) => {
  db.query("SELECT p.*, c.name AS category_name FROM products p LEFT JOIN product_categories pc ON p.id = pc.product_id LEFT JOIN categories c ON pc.category_id = c.id WHERE is_deleted = 0", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getAllCategory = (req, res) => {
  const { id } = req.params;
  db.query("SELECT p.* FROM products p INNER JOIN product_categories c ON p.id = c.product_id WHERE c.category_id = ? AND p.is_deleted = 0", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getAllTags = (req, res) => {
  const { id } = req.params;
  db.query("SELECT c.id, c.name FROM categories c INNER JOIN product_categories pc ON c.id = pc.category_id INNER JOIN products p ON pc.product_id = p.id GROUP BY c.id, c.name HAVING SUM(p.is_deleted = 0) > 0 ORDER BY c;", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getProductById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT p.*, c.name FROM products p LEFT JOIN product_categories pc ON p.id = pc.product_id LEFT JOIN categories c ON pc.category_id = c.id WHERE p.id = ?;", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "Product not found" });
    res.json(results[0]);
  });
};

exports.createProduct = (req, res) => {
  const { name, description, price, image_url, admin_id } = req.body;
  db.query("INSERT INTO products (name, description, price, image_url, admin_id) VALUES (?, ?, ?, ?, ?)", [name, description, price, image_url, admin_id || 1], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    
    res.status(201).json({ 
      id: result.insertId, 
      name, 
      description, 
      price, 
      image_url 
    });
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
