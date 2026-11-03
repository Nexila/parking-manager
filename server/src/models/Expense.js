
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
  type: String,
  required: true,
  validate: {
    validator: (value) =>
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(value),
    message: "Invalid date format",
  },
},
  },
  { timestamps: true }
);

expenseSchema.index({ date: -1 });

export default mongoose.model("Expense", expenseSchema);
