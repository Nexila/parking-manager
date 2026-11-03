import mongoose from 'mongoose';
const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, phone: { type: String, default: '' },
  car: { type: String, default: '', uppercase: true, trim: true }, slot: { type: Number, required: true, min: 1, max: 40 },
  start: { type: String, required: true, match: /^\d{4}-\d{2}$/ }, end: { type: String, default: null },
  rent: { type: Number, required: true, min: 1 }
}, { timestamps: true });
tenantSchema.index({ slot: 1 });
export default mongoose.model('Tenant', tenantSchema);
