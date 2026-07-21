
import { Router } from 'express';
import authRouter from './auth.routes';
import mapsRouter from './maps.routes';
import towerRouter from './tower.routes';
import scoresRouter from './scores.routes';
import adminRouter from './admin.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/maps', mapsRouter);
router.use('/tower', towerRouter);
router.use('/scores', scoresRouter);
router.use('/admin', adminRouter);

export default router;
