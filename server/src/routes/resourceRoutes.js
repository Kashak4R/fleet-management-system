import express from "express";
import { createCrudController } from "../controllers/crudFactory.js";
import { allowRoles, protect } from "../middleware/auth.js";
import Driver from "../models/Driver.js";
import FuelLog from "../models/FuelLog.js";
import Maintenance from "../models/Maintenance.js";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";

const router = express.Router();
router.use(protect);

function registerResource(path, controller) {
  router
    .route(path)
    .get(allowRoles("admin", "manager"), controller.list)
    .post(allowRoles("admin", "manager"), controller.create);
  router
    .route(`${path}/:id`)
    .get(allowRoles("admin", "manager"), controller.get)
    .put(allowRoles("admin", "manager"), controller.update)
    .delete(allowRoles("admin"), controller.remove);
}

registerResource("/vehicles", createCrudController(Vehicle, { sort: { registrationNumber: 1 } }));
registerResource("/drivers", createCrudController(Driver, { sort: { name: 1 } }));
registerResource(
  "/trips",
  createCrudController(Trip, {
    populate: [
      { path: "vehicle", select: "registrationNumber make model" },
      { path: "driver", select: "name licenseNumber" },
    ],
    sort: { startDate: -1 },
  }),
);
registerResource(
  "/fuel",
  createCrudController(FuelLog, {
    populate: [{ path: "vehicle", select: "registrationNumber make model" }],
    sort: { date: -1 },
  }),
);
registerResource(
  "/maintenance",
  createCrudController(Maintenance, {
    populate: [{ path: "vehicle", select: "registrationNumber make model" }],
    sort: { scheduledDate: 1 },
  }),
);

export default router;
