import { Router } from 'express';
import Settings from '../models/Settings.js';
import { asyncRoute } from '../utils/http.js';
const router = Router();
router.get('/', asyncRoute(async (_req, res) => res.json(await Settings.findOneAndUpdate({ key: 'default' }, {}, { upsert: true, new: true, setDefaultsOnInsert: true }))));
router.put('/', asyncRoute(async (req, res) => { const { lateFee, grace, theme } = req.body; res.json(await Settings.findOneAndUpdate({ key: 'default' }, { lateFee, grace, theme }, { upsert: true, new: true, runValidators: true })); }));
export default router;
