const Task = require("../models/Task");
const asyncHandler = require("../utils/asyncHandler");

const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.json(tasks);
});

const createTask = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const task = await Task.create({ title, user: req.user._id });
  return res.status(201).json(task);
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const task = await Task.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { status },
    { new: true, runValidators: true }
  );

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  return res.json(task);
});

const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findOneAndDelete({ _id: id, user: req.user._id });
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  return res.json({ message: "Task deleted" });
});

module.exports = { getTasks, createTask, updateTaskStatus, deleteTask };
