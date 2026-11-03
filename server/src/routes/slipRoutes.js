import express from "express";
import Slip from "../models/Slip.js";

const router = express.Router();

// Get all daily collection records
router.get("/", async (req, res, next) => {
  try {
    const slips = await Slip.find().sort({ date: -1 });
    res.json(slips);
  } catch (error) {
    next(error);
  }
});

// Save or update one day's collection
router.put("/:date", async (req, res, next) => {
  try {
    const slip = await Slip.findOneAndUpdate(
      { date: req.params.date },
      {
        ...req.body,
        date: req.params.date,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json(slip);
  } catch (error) {
    next(error);
  }
});

// Delete a daily collection record
router.delete("/:date", async (req, res, next) => {
  try {
    await Slip.findOneAndDelete({ date: req.params.date });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;