import { Router } from 'express';
import user from './user/user.router.js';
const router = Router();

router.use('/user', user);
export default router;