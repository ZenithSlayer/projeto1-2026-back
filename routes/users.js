const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const auth = require("../middleware/auth");

router.post("/register", usersController.registerUser);
router.post("/login", usersController.loginUser);

router.use(auth);

router.get("/me", usersController.getMe);

router.delete("/", usersController.deleteAccount); 
router.put("/profile", usersController.updateProfile);

router.put("/password", usersController.changePassword);

router.post("/address", usersController.addAddress);
router.put("/address/:id", usersController.updateAddress);
router.delete("/address/:id", usersController.deleteAddress);
router.put("/address/:id/favorite", usersController.setFavoriteAddress);

router.post("/card", usersController.addCard);
router.delete("/card/:id", usersController.deleteCard);
router.put("/card/:id/favorite", usersController.setFavoriteCard);

module.exports = router;