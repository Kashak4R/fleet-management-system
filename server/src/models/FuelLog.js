import mongoose from "mongoose";

const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    date: { type: Date, default: Date.now },
    quantity: { type: Number, required: true, min: 0.1 },
    pricePerLitre: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, min: 0 },
    odometer: { type: Number, required: true, min: 0 },
    vendor: { type: String, trim: true },
  },
  { timestamps: true },
);

fuelLogSchema.pre("validate", function calculateCost() {
  this.totalCost = Number((this.quantity * this.pricePerLitre).toFixed(2));
});

export default mongoose.model("FuelLog", fuelLogSchema);

