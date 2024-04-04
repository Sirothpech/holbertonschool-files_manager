import { Router } from 'express';
import Appcontroller from '../controllers/AppController';

const router = Router();

router.get('/status', Appcontroller.getStatus);

router.get('/stats', Appcontroller.getStats);

module.exports = router;
