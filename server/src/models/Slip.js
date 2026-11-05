import mongoose from "mongoose";

const slipSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    from: {
      type: String,
      default: "",
    },

    to: {
      type: String,
      default: "",
    },

    start: {
      type: Number,
      default: null,
    },

    end: {
      type: Number,
      default: null,
    },

    rate: {
      type: Number,
      default: 20,
    },

    cash: {
      type: Number,
      default: 0,
    },

    paytm: {
      type: Number,
      default: 0,
    },

    over: {
      type: Number,
      default: 0,
    },
    extra: {
      type: Number,
      default: 0,
    },
    short: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Slip = mongoose.model("Slip", slipSchema);

export default Slip;