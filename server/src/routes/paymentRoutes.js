import { Router } from 'express';
import Payment from '../models/Payment.js';
import Tenant from '../models/Tenant.js';
import { asyncRoute, monthIsValid } from '../utils/http.js';
const router = Router();
router.get('/', asyncRoute(async (_req, res) => res.json(await Payment.find().sort({ date: -1, createdAt: -1 }))));
router.post('/', asyncRoute(async (req, res) => { if (!monthIsValid(req.body.month)) return res.status(400).json({ message: 'A valid month is required.' }); if (!await Tenant.exists({ _id: req.body.tenantId })) return res.status(404).json({ message: 'Tenant not found.' }); res.status(201).json(await Payment.create(req.body)); }));
router.delete('/:id', asyncRoute(async (req, res) => { const payment = await Payment.findByIdAndDelete(req.params.id); if (!payment) return res.status(404).json({ message: 'Payment not found.' }); res.status(204).end(); }));
export default router;
