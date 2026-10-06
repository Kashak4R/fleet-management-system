import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import Driver from "./models/Driver.js";
import FuelLog from "./models/FuelLog.js";
import Maintenance from "./models/Maintenance.js";
import Trip from "./models/Trip.js";
import User from "./models/User.js";
import Vehicle from "./models/Vehicle.js";

async function seed() {
  await connectDatabase();

  await Promise.all([
    User.deleteMany(),
    Vehicle.deleteMany(),
    Driver.deleteMany(),
    Trip.deleteMany(),
    FuelLog.deleteMany(),
    Maintenance.deleteMany(),
  ]);

  await User.create({
    name: "Fleet Administrator",
    email: "admin@fleet.com",
    password: "Admin@123",
    role: "admin",
  });

  const vehicles = await Vehicle.create([
    { registrationNumber: "TN01AB1234", make: "Tata", model: "Ace", type: "Truck", year: 2023, capacity: 2, status: "available", odometer: 18450 },
    { registrationNumber: "TN09CD5678", make: "Toyota", model: "Innova", type: "Car", year: 2022, capacity: 7, status: "assigned", odometer: 32600 },
    { registrationNumber: "TN10EF9012", make: "Ashok Leyland", model: "Dost", type: "Van", year: 2021, capacity: 3, status: "maintenance", odometer: 48750 },
  ]);

  const drivers = await Driver.create([
    { name: "Arun Kumar", email: "arun@example.com", phone: "9876543210", licenseNumber: "TN0120190001234", licenseExpiry: "2028-05-20", status: "available" },
    { name: "Priya S", email: "priya@example.com", phone: "9876501234", licenseNumber: "TN0920200005678", licenseExpiry: "2027-11-10", status: "assigned" },
  ]);

  await User.create([
    {
      name: "Fleet Manager",
      email: "manager@fleet.com",
      password: "Manager@123",
      role: "manager",
    },
    {
      name: "Priya S",
      email: "driver@fleet.com",
      password: "Driver@123",
      role: "driver",
      driver: drivers[1]._id,
    },
  ]);

  await Trip.create({
    title: "Chennai Warehouse Delivery",
    origin: "Ramapuram",
    destination: "Ambattur",
    vehicle: vehicles[1]._id,
    driver: drivers[1]._id,
    startDate: new Date(),
    status: "ongoing",
    distance: 28,
    purpose: "Material delivery",
  });

  await FuelLog.create({
    vehicle: vehicles[1]._id,
    date: new Date(),
    quantity: 32,
    pricePerLitre: 102.5,
    odometer: 32600,
    vendor: "Indian Oil",
  });

  const serviceDate = new Date();
  serviceDate.setDate(serviceDate.getDate() + 12);
  await Maintenance.create({
    vehicle: vehicles[0]._id,
    serviceType: "Periodic service",
    description: "Engine oil and filter replacement",
    scheduledDate: serviceDate,
    status: "upcoming",
    odometer: 19000,
  });

  console.log("Sample data created");
  console.log("Admin: admin@fleet.com / Admin@123");
  console.log("Manager: manager@fleet.com / Manager@123");
  console.log("Driver: driver@fleet.com / Driver@123");
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
