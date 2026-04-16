    const express = require("express");
    const router = express.Router();
    const orderController = require("../controllers/orderController");
    const auth = require("../middleware/auth");

    router.use(auth);

    // POST /orders - The "Turbo" Checkout (Creates order + Clears cart)
    router.post("/", orderController.createOrder);

    // GET /orders - Fetch user order history
    router.get("/", orderController.getOrders);

    // GET /orders/:id - Fetch details of a specific order
    router.get("/:id", orderController.getOrderDetails);

    module.exports = router;