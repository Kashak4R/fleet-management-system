import express from "express";
import { createUser, deleteUser, listUsers, updateUser } from "../controllers/userController.js";
import { allowRoles, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, allowRoles("admin"));
router.route("/").get(listUsers).post(createUser);
router.route("/:id").put(updateUser).delete(deleteUser);

export default router;
