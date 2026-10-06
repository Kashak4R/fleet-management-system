import Driver from "../models/Driver.js";
import FuelLog from "../models/FuelLog.js";
import Maintenance from "../models/Maintenance.js";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";

export async function dashboardSummary(req, res, next) {
  try {
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const complianceWindow = new Date();
    complianceWindow.setDate(complianceWindow.getDate() + 60);
    const costWindow = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      vehicleCount,
      availableVehicles,
      driverCount,
      activeTrips,
      maintenanceDue,
      fuelTotals,
      recentTrips,
      upcomingMaintenance,
      vehicleStatus,
      tripStatus,
      monthlyFuel,
      monthlyMaintenance,
      expiringVehicles,
      expiringDrivers,
    ] = await Promise.all([
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: "available" }),
      Driver.countDocuments(),
      Trip.countDocuments({ status: { $in: ["planned", "ongoing"] } }),
      Maintenance.countDocuments({ status: { $in: ["upcoming", "overdue"] } }),
      FuelLog.aggregate([{ $group: { _id: null, totalCost: { $sum: "$totalCost" }, totalLitres: { $sum: "$quantity" } } }]),
      Trip.find().populate("vehicle", "registrationNumber").populate("driver", "name").sort({ createdAt: -1 }).limit(5),
      Maintenance.find({ scheduledDate: { $gte: now, $lte: nextMonth }, status: "upcoming" })
        .populate("vehicle", "registrationNumber")
        .sort({ scheduledDate: 1 })
        .limit(5),
      Vehicle.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Trip.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      FuelLog.aggregate([
        { $match: { date: { $gte: costWindow } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, total: { $sum: "$totalCost" } } },
        { $sort: { _id: 1 } },
      ]),
      Maintenance.aggregate([
        { $match: { scheduledDate: { $gte: costWindow } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$scheduledDate" } }, total: { $sum: "$cost" } } },
        { $sort: { _id: 1 } },
      ]),
      Vehicle.find({ insuranceExpiry: { $gte: now, $lte: complianceWindow } })
        .select("registrationNumber make model insuranceExpiry")
        .sort({ insuranceExpiry: 1 })
        .limit(5),
      Driver.find({ licenseExpiry: { $gte: now, $lte: complianceWindow } })
        .select("name licenseNumber licenseExpiry")
        .sort({ licenseExpiry: 1 })
        .limit(5),
    ]);

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return {
        key,
        label: date.toLocaleDateString("en-IN", { month: "short" }),
        fuel: monthlyFuel.find((item) => item._id === key)?.total || 0,
        maintenance: monthlyMaintenance.find((item) => item._id === key)?.total || 0,
      };
    });

    const toStatusMap = (rows) => Object.fromEntries(rows.map((item) => [item._id, item.count]));
    const vehicleStatusMap = toStatusMap(vehicleStatus);
    const tripStatusMap = toStatusMap(tripStatus);
    const utilizedVehicles = (vehicleStatusMap.assigned || 0) + (vehicleStatusMap.maintenance || 0);

    res.json({
      metrics: {
        vehicleCount,
        availableVehicles,
        driverCount,
        activeTrips,
        maintenanceDue,
        fuelSpend: fuelTotals[0]?.totalCost || 0,
        fuelLitres: fuelTotals[0]?.totalLitres || 0,
      },
      recentTrips,
      upcomingMaintenance,
      analytics: {
        vehicleStatus: vehicleStatusMap,
        tripStatus: tripStatusMap,
        monthlyCosts: months,
        utilizationRate: vehicleCount ? Math.round((utilizedVehicles / vehicleCount) * 100) : 0,
      },
      complianceAlerts: [
        ...expiringVehicles.map((vehicle) => ({
          id: vehicle._id,
          type: "insurance",
          title: `${vehicle.registrationNumber} insurance`,
          subtitle: `${vehicle.make} ${vehicle.model}`,
          dueDate: vehicle.insuranceExpiry,
        })),
        ...expiringDrivers.map((driver) => ({
          id: driver._id,
          type: "licence",
          title: `${driver.name} licence`,
          subtitle: driver.licenseNumber,
          dueDate: driver.licenseExpiry,
        })),
      ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 6),
    });
  } catch (error) {
    next(error);
  }
}
