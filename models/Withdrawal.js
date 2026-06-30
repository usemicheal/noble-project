import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Which balance this came from: walletValue, profit, or a coin key (btc, eth, etc.)
    asset_type: { type: String, required: true },

    // Human-readable label shown in admin (e.g. "Wallet Balance (USD)", "Bitcoin (BTC)")
    asset_label: { type: String, required: true },

    amount: { type: Number, required: true },

    destination_address: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Withdrawal", withdrawalSchema);
