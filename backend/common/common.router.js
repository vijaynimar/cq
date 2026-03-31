import { Router } from "express";
import { updateUserProfile, getMe } from "./common.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { profileMulter } from "../middleware/multer.js";
const commonRouter = Router();

commonRouter.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

commonRouter.put("/updateProfile", authenticateToken, profileMulter.single("image"), updateUserProfile);
commonRouter.get("/getMe", authenticateToken, getMe);
export default commonRouter;