import express from "express";
import { login, me, register } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", async (req, res, next) => {
  try {
    const { default: User } = await import("../models/User.js");
    const count = await User.countDocuments();
    if (count === 0) return register(req, res, next);
    return protect(req, res, () => register(req, res, next));
  } catch (error) {
    next(error);
  }
});
router.get("/me", protect, me);

export default router;

