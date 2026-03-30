import {Router} from 'express';
import { createUser,LoginUser } from './user.controller.js';
const router = Router();

router.post("/createUser", createUser);
router.post("/login", LoginUser);
export default router;