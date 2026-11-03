
import { Router } from "express";
import Expense from "../models/Expense.js";
import { asyncRoute } from "../utils/http.js";

const router = Router();

// GET ALL EXPENSES
router.get(
  "/",
  asyncRoute(async (_req, res) => {
    const expenses = await Expense.find().sort({ date: -1 });

    res.json(expenses);
  })
);

// ADD EXPENSE
router.post(
  "/",
  asyncRoute(async (req, res) => {
    const { category, amount, date, note } = req.body;

    if (!category || !amount || Number(amount) <= 0 || !date) {
      return res.status(400).json({
        message: "Category, valid amount and date are required.",
      });
    }

    const expense = await Expense.create({
      category,
      amount: Number(amount),
      date,
      note,
    });

    res.status(201).json(expense);
  })
);

// DELETE EXPENSE
router.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found.",
      });
    }

    res.status(204).end();
  })
);

export default router;
