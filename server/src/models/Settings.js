import mongoose from 'mongoose';
const settingsSchema = new mongoose.Schema({ key: { type: String, default: 'default', unique: true }, lateFee: { type: Number, default: 0, min: 0 }, grace: { type: Number, default: 5, min: 1, max: 28 }, theme: { type: String, enum: ['light', 'dark'], default: 'light' } });
export default mongoose.model('Settings', settingsSchema);
