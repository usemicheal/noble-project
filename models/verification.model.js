import mongoose from "mongoose";
import { VerificationEnum } from "../config/verificationEnum.js";
import { generateUniqueCode } from "../config/uuid.js";

const { Schema } = mongoose;

const verificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    default: generateUniqueCode,
  },
  type: {
    type: String,
    enum: Object.values(VerificationEnum),
    required: true,
  },
  expiresAt: {
    type: Date,
    default: new Date(),
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
    required: true,
  },
});

const VerificationModel = mongoose.model("Verification", verificationSchema, "verification-codes");

export default VerificationModel;
