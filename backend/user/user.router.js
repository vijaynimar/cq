import {Router} from 'express';
import { createUser, LoginUser, getMe, sendRegistrationOtp, verifyRegistrationOtp } from './user.controller.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();

router.post("/createUser", createUser);
router.post("/send-registration-otp", sendRegistrationOtp);
router.post("/verify-registration-otp", verifyRegistrationOtp);
router.post("/login", LoginUser);
router.get("/getMe", authenticateToken, getMe);
export default router;