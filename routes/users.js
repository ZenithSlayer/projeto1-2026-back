const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const auth = require("../middleware/auth");

// auth routes
router.post("/register", usersController.registerUser);
router.post("/login", usersController.loginUser);

// protected routes
router.get("/me", auth, usersController.getMe);
router.post("/address", auth, usersController.addAddress);
router.post("/card", auth, usersController.addCard);

module.exports = router;