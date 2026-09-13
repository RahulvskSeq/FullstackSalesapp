import express from 'express';
import { start as startJobs } from '../jobs/runner.js';
import '../services/imports.js';           // registers the apply job handler
import importsRouter from './imports.js';
import paymentsRouter from './payments.js';
import followupsRouter from './followups.js';
import tasksRouter from './tasks.js';
import compatRouter from '../compat/index.js';
import readRouter from './read.js';
import whatsappRouter from './whatsapp.js';
import employeesRouter from './employees.js';
import '../services/whatsapp.js';          // registers the send job handler
import { startTick } from '../engines/automation.js';
/**
 * /api/collections — the Outstanding + Collection CRM module.
 * Sub-routers are mounted here as they are built; nothing is stubbed.
 */
const router = express.Router();
router.get('/health', (req, res) => res.json({ ok: true, module: 'collections' }));
router.use('/imports', importsRouter);
router.use('/payments', paymentsRouter);
router.use('/followups', followupsRouter);
router.use('/tasks', tasksRouter);
router.use('/compat', compatRouter);
router.use('/whatsapp', whatsappRouter);
router.use('/employees', employeesRouter);
router.use('/', readRouter);
export { startJobs, startTick };
export default router;
