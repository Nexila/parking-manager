import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },

    kind: {
      type: String,
      enum: ['rent', 'deposit', 'refund', 'latefee'],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    // Month for which the payment is being recorded
    // Example: 2026-10
    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
    },

    // Actual date on which payment was made
    // Example: 2026-10-03
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Payment', paymentSchema);