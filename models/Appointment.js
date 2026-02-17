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
  booking_amount: {
    type: Number,
    min: 20000,
    required: true,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Appointment", appointmentSchema);
