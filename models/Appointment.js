import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender_name: {
    type: String,
    required: true,
  },
  sender_subject: {
    type: String,
    required: true,
  },
  sender_email: {
    type: String,
    required: true,
  },
  sender_mssg: {
    type: String,
    required: true,
  },

  // ── Stage 1: Booking application status (set by admin) ──────────────
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  isApproved: {
    type: Boolean,
    default: false,
  },

  // ── Stage 2: Payment (only unlocked after admin approves) ────────────
  booking_amount: {
    type: Number,
    default: null, // not collected at booking time
  },
  proof_of_payment: {
    type: String,
    default: null,
  },
  payment_status: {
    type: String,
    enum: ["unpaid", "submitted", "confirmed"],
    default: "unpaid",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Appointment", appointmentSchema);
