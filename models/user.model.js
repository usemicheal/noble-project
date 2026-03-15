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

    // Per-coin holdings (quantity of each coin the user holds)
    coinHoldings: {
      btc: { type: Number, default: 0 },
      eth: { type: Number, default: 0 },
      usdt: { type: Number, default: 0 },
      xlm: { type: Number, default: 0 },
      xrp: { type: Number, default: 0 },
      ltc: { type: Number, default: 0 },
      doge: { type: Number, default: 0 },
      bnb: { type: Number, default: 0 },
      shib: { type: Number, default: 0 },
      trx: { type: Number, default: 0 },
      ada: { type: Number, default: 0 },
      sol: { type: Number, default: 0 },
      matic: { type: Number, default: 0 },
      algo: { type: Number, default: 0 },
      trump: { type: Number, default: 0 },
      pepe: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;