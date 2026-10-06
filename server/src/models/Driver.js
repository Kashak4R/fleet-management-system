import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    licenseExpiry: { type: Date, required: true },
    status: { type: String, enum: ["available", "assigned", "inactive"], default: "available" },
  },
  { timestamps: true },
);

export default mongoose.model("Driver", driverSchema);

