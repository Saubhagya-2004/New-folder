const express = require("express");
const { body } = require("express-validator");
const { signup, login, getProfile } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { handleValidation } = require("../middleware/validateMiddleware");

const router = express.Router();

router.post(
  "/signup",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    handleValidation,
  ],
  signup
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidation,
  ],
  login
);

router.get("/me", protect, getProfile);

module.exports = router;
