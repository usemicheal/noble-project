import mongoose from "mongoose";

const cardOrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cardholdersname: { type: String, required: true },
  card_typ: { type: String, required: true }, // tier number (1-6)
  card_name: { type: String, required: true }, // Bronze, Silver, Gold, etc.
  card_price: { type: String, required: true }, // $18,750, etc.
  card_spend_limit: { type: String, required: true }, // $25K - $100K, etc.
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  proof_of_address: { type: String, required: true },
  status: { type: String, default: "pending" }, // pending, approved, shipped, etc.
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("CardOrder", cardOrderSchema);
