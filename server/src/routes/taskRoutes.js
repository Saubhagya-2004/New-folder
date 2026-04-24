const express = require("express");
const { body, param } = require("express-validator");
const {
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const { handleValidation } = require("../middleware/validateMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getTasks);
router.post(
  "/",
  [
    body("title")
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage("Task title is required"),
    handleValidation,
  ],
  createTask
);

router.patch(
  "/:id/status",
  [
    param("id").isMongoId().withMessage("Invalid task id"),
    body("status")
      .isIn(["Pending", "Completed"])
      .withMessage("Status must be Pending or Completed"),
    handleValidation,
  ],
  updateTaskStatus
);

router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid task id"), handleValidation],
  deleteTask
);

module.exports = router;
