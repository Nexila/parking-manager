import { Router } from 'express';
import Tenant from '../models/Tenant.js';
import Payment from '../models/Payment.js';
import Settings from '../models/Settings.js';
import { asyncRoute } from '../utils/http.js';
const router = Router();
router.get('/', asyncRoute(async (_req, res) => res.json({ tenants: await Tenant.find().lean(), payments: await Payment.find().lean(), settings: await Settings.findOne({ key: 'default' }).lean() })));
router.post('/restore', asyncRoute(async (req, res) => { const { tenants, payments, settings } = req.body; if (!Array.isArray(tenants) || !Array.isArray(payments)) return res.status(400).json({ message: 'Not a valid backup file.' }); await Payment.deleteMany({}); await Tenant.deleteMany({}); const idMap = new Map(); for (const item of tenants) { const { _id, id, ...data } = item; const tenant = await Tenant.create(data); idMap.set(String(_id || id), tenant._id); } for (const item of payments) { const { _id, id, tenantId, tid, ...data } = item; const mappedId = idMap.get(String(tenantId || tid)); if (mappedId) await Payment.create({ ...data, tenantId: mappedId }); } if (settings) { const { _id, ...data } = settings; await Settings.findOneAndUpdate({ key: 'default' }, { ...data, key: 'default' }, { upsert: true }); } res.json({ message: 'Backup restored.' }); }));
export default router;
