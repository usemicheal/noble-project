import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mpassword: {
      type: String,
      default: "None",
    },

    country: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    image: {
      type: String,
      default: "",
    },

    password: {
      type: String,
      required: true,
    },

    // Wallet-related fields
    wallet: {
      type: Number,
      default: 0,
    },
    walletValue: {
      type: String,
      default: "0",
    },
    profit: {
      type: String,
      default: "0",
    },
    humanitarianFunding: {
      type: String,
      default: "0",
    },
    kycSumitted: {
      type: Boolean,
      default: false,
    },

    walletConnected: {
      type: Boolean,
      default: false,
    },

    suspended: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
