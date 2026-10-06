import Driver from "../models/Driver.js";
import FuelLog from "../models/FuelLog.js";
import Maintenance from "../models/Maintenance.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";

async function getDriverProfile(userId) {
  const user = await User.findById(userId).populate(
    "driver",
    "name email phone licenseNumber licenseExpiry status",
  );
  if (!user?.driver) {
    const error = new Error("This account is not linked to a driver profile. Contact an administrator.");
    error.status = 400;
    throw error;
  }
  return user.driver;
}

async function refreshAvailability(trip) {
  if (trip.status === "ongoing") {
    await Promise.all([
      Vehicle.findByIdAndUpdate(trip.vehicle, { status: "assigned" }),
      Driver.findByIdAndUpdate(trip.driver, { status: "assigned" }),
    ]);
    return;
  }

  if (!["completed", "cancelled"].includes(trip.status)) return;

  const [otherVehicleTrip, otherDriverTrip] = await Promise.all([
    Trip.exists({
      _id: { $ne: trip._id },
      vehicle: trip.vehicle,
      status: { $in: ["planned", "ongoing"] },
    }),
    Trip.exists({
      _id: { $ne: trip._id },
      driver: trip.driver,
      status: { $in: ["planned", "ongoing"] },
    }),
  ]);

  await Promise.all([
    !otherVehicleTrip ? Vehicle.findByIdAndUpdate(trip.vehicle, { status: "available" }) : null,
    !otherDriverTrip ? Driver.findByIdAndUpdate(trip.driver, { status: "available" }) : null,
  ]);
}

export async function driverOverview(req, res, next) {
  try {
    const driver = await getDriverProfile(req.user._id);
    const trips = await Trip.find({ driver: driver._id })
      .populate("vehicle", "registrationNumber make model type status odometer insuranceExpiry")
      .populate("driver", "name licenseNumber licenseExpiry status")
      .sort({ startDate: -1 });

    const vehicleIds = [...new Set(trips.map((trip) => String(trip.vehicle?._id || trip.vehicle)))];
    const [fuel, maintenance] = await Promise.all([
      FuelLog.find({ vehicle: { $in: vehicleIds } })
        .populate("vehicle", "registrationNumber make model")
        .sort({ date: -1 })
        .limit(8),
      Maintenance.find({
        vehicle: { $in: vehicleIds },
        status: { $in: ["upcoming", "in-progress", "overdue"] },
      })
        .populate("vehicle", "registrationNumber make model")
        .sort({ scheduledDate: 1 })
        .limit(8),
    ]);

    res.json({
      driver,
      metrics: {
        totalTrips: trips.length,
        activeTrips: trips.filter((trip) => ["planned", "ongoing"].includes(trip.status)).length,
        completedTrips: trips.filter((trip) => trip.status === "completed").length,
        totalDistance: trips.reduce((sum, trip) => sum + Number(trip.distance || 0), 0),
      },
      trips,
      recentFuel: fuel,
      maintenance,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOwnTrip(req, res, next) {
  try {
    const driver = await getDriverProfile(req.user._id);
    const trip = await Trip.findOne({ _id: req.params.id, driver: driver._id });
    if (!trip) return res.status(404).json({ message: "Assigned trip not found" });

    const allowedStatuses = ["planned", "ongoing", "completed", "cancelled"];
    if (req.body.status !== undefined) {
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: "Invalid trip status" });
      }
      trip.status = req.body.status;
      if (trip.status === "completed" && !trip.endDate) trip.endDate = new Date();
    }
    if (req.body.distance !== undefined) trip.distance = req.body.distance;
    await trip.save();
    await refreshAvailability(trip);

    const updated = await Trip.findById(trip._id)
      .populate("vehicle", "registrationNumber make model type status odometer insuranceExpiry")
      .populate("driver", "name licenseNumber licenseExpiry status");
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function createOwnFuelEntry(req, res, next) {
  try {
    const driver = await getDriverProfile(req.user._id);
    const { vehicle, date, quantity, pricePerLitre, odometer, vendor } = req.body;
    const assignedTrip = await Trip.exists({
      driver: driver._id,
      vehicle,
      status: { $in: ["planned", "ongoing"] },
    });
    if (!assignedTrip) {
      return res.status(403).json({ message: "Fuel can only be added for a vehicle assigned to your active trip" });
    }

    const entry = await FuelLog.create({ vehicle, date, quantity, pricePerLitre, odometer, vendor });
    const populated = await FuelLog.findById(entry._id).populate(
      "vehicle",
      "registrationNumber make model",
    );
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}
