import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    serviceType: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    scheduledDate: { type: Date, required: true },
    completedDate: Date,
    status: { type: String, enum: ["upcoming", "in-progress", "completed", "overdue"], default: "upcoming" },
    cost: { type: Number, min: 0, default: 0 },
    odometer: { type: Number, min: 0 },
  },
  { timestamps: true },
);

maintenanceSchema.pre("validate", function updateOverdueStatus() {
  if (this.status === "upcoming" && this.scheduledDate < new Date()) {
    this.status = "overdue";
  }
});

export default mongoose.model("Maintenance", maintenanceSchema);

