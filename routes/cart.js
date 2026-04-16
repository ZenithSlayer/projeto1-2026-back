const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const auth = require("../middleware/auth"); // Your JWT middleware

// All cart routes require a logged-in user
router.use(auth);

// GET /cart - Get all items with product details (JOIN)
router.get("/", cartController.getCart);

// POST /cart - Add item or increment quantity if exists
router.post("/", cartController.addToCart);

// PUT /cart/:id - Update quantity for a specific cart row
router.put("/:id", cartController.updateQuantity);

// DELETE /cart/:id - Remove one item
router.delete("/:id", cartController.removeFromCart);

module.exports = router;