import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
    startDate: { type: Date, required: true },
    endDate: Date,
    status: { type: String, enum: ["planned", "ongoing", "completed", "cancelled"], default: "planned" },
    distance: { type: Number, min: 0, default: 0 },
    purpose: { type: String, trim: true },
  },
  { timestamps: true },
);

export default mongoose.model("Trip", tripSchema);

