import express from "express";
import { dashboardSummary } from "../controllers/dashboardController.js";
import { allowRoles, protect } from "../middleware/auth.js";

const router = express.Router();
router.get("/", protect, allowRoles("admin", "manager"), dashboardSummary);
export default router;
