const express = require("express");
const router = express.Router();
const productsController = require("../controllers/productsController");

router.get("/tag", productsController.getAllTags);
router.get("/tag/:id", productsController.getAllCategory);
router.get("/", productsController.getAllProducts);
router.post("/", productsController.createProduct);
router.get("/:id", productsController.getProductById);
router.put("/:id", productsController.updateProduct);
router.delete("/:id", productsController.deleteProduct);


module.exports = router;