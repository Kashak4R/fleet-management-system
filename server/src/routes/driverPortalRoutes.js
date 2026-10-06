import express from "express";
import {
  createOwnFuelEntry,
  driverOverview,
  updateOwnTrip,
} from "../controllers/driverPortalController.js";
import { allowRoles, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, allowRoles("driver"));
router.get("/overview", driverOverview);
router.put("/trips/:id", updateOwnTrip);
router.post("/fuel", createOwnFuelEntry);

export default router;
