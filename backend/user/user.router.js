import {Router} from 'express';
import { createUser, LoginUser, getMe } from './user.controller.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();

router.post("/createUser", createUser);
router.post("/login", LoginUser);
router.get("/getMe", authenticateToken, getMe);
export default router;