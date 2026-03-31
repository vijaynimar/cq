import { Router } from 'express';
import user from './user/user.router.js';
import commonRouter from './common/common.router.js';
import adminRouter from './admin/admin.router.js';
import studentRouter from './student/student.router.js';
const router = Router();

router.use('/user', user);
router.use('/common', commonRouter);
router.use('/admin', adminRouter);
router.use('/student', studentRouter);
export default router;