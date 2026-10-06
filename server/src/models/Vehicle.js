import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    type: { type: String, enum: ["Car", "Van", "Truck", "Bus", "Two Wheeler", "Other"], default: "Car" },
    year: { type: Number, min: 1990 },
    capacity: { type: Number, min: 1, default: 4 },
    status: { type: String, enum: ["available", "assigned", "maintenance", "inactive"], default: "available" },
    odometer: { type: Number, min: 0, default: 0 },
    insuranceExpiry: Date,
  },
  { timestamps: true },
);

export default mongoose.model("Vehicle", vehicleSchema);

