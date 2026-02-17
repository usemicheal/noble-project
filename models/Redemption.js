import mongoose from "mongoose";

const redemptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    redemption_file: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Redemption", redemptionSchema);
