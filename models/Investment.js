import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    investment_type: {
      type: String,
      enum: ["gold", "silver", "diamond"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price_per_unit: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    purchase_date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Investment", investmentSchema);
