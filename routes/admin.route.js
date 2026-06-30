import express from "express";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import KYC from "../models/KYC.js";
import { LinkedWallet } from "../models/LinkedWallet.js";
import Redemption from "../models/Redemption.js";
import Appointment from "../models/Appointment.js";
import CardOrder from "../models/CardOrder.js";
import QPhone from "../models/QPhone.js";
import { sendEmail } from "../mailers/mailer.js";
import { appointmentApprovalTemplate } from "../mailers/templates/template.js";
import Withdrawal from "../models/Withdrawal.js";
import {
  withdrawalApprovedTemplate,
  withdrawalPendingTemplate,
  withdrawalRejectedTemplate,
} from "../mailers/templates/template.js";

const adminRouter = express.Router();

// GET routes
adminRouter.get("/login", (req, res) => {
  res.render("admin/login");
});
adminRouter.post("/login", (req, res) => {
  console.log("Admin login attempt", req.body);

  const { password, email } = req.body;

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    req.flash("success_msg", "Logged in as admin");
    return res.redirect("/admin/users");
  } else {
    req.flash("error_msg", "Invalid Admin Credentials");
    return res.redirect("/admin/login");
  }
});

adminRouter.get("/users", async (req, res) => {
  const users = await User.find();
  res.render("admin/users", { users });
});

// Suspend user
adminRouter.post("/users/:userId/suspend", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(userId, { suspended: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User suspended successfully" });
  } catch (error) {
    console.error("Suspend user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Unsuspend user
adminRouter.post("/users/:userId/unsuspend", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(userId, { suspended: false });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User unsuspended successfully" });
  } catch (error) {
    console.error("Unsuspend user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//update wallet balance
adminRouter.put("/users/:userId/update", async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.walletValue = amount;
    await user.save();
    res.json({ success: true, message: "Wallet Updated Successfully" });
  } catch (error) {
    console.error("Wallet cannot be updated:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

adminRouter.put("/users/:userId/profit", async (req, res) => {
  try {
    const { userId } = req.params;
    const { profit } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.profit = profit;
    await user.save();
    res.json({ success: true, message: "Profit Updated Successfully" });
  } catch (error) {
    console.error("Profit cannot be updated:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
adminRouter.put("/users/:userId/humanitarian-funding", async (req, res) => {
  try {
    const { userId } = req.params;
    const { humanitarianFunding } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.humanitarianFunding = humanitarianFunding;
    await user.save();
    res.json({ success: true, message: "Humanitarian Funding Updated Successfully" });
  } catch (error) {
    console.error("Humanitarian funding cannot be updated:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete user
adminRouter.delete("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

adminRouter.get("/messages", async (req, res) => {
  const messages = await Message.find();
  res.render("admin/messages", { messages });
});

adminRouter.delete("/messages/:msgId", async (req, res) => {
  try {
    const { msgId } = req.params;

    const deletedMessage = await Message.findByIdAndDelete(msgId);

    if (!deletedMessage) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    res.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

adminRouter.get("/wallets", async (req, res) => {
  const wallets = await LinkedWallet.find().populate("user");
  res.render("admin/wallets", { wallets });
});

adminRouter.delete("/wallets/:walletId", async (req, res) => {
  try {
    const { walletId } = req.params;
    const deletedWallet = await LinkedWallet.findByIdAndDelete(walletId);

    if (!deletedWallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    const deletedUserWallet = await User.findById(deletedWallet.user);
    deletedUserWallet.walletConnected = false;
    deletedUserWallet.walletValue = "0";
    deletedUserWallet.profit = "0";

    await deletedUserWallet.save();

    res.json({ success: true, message: "Wallet deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting wallet:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

adminRouter.get("/kyc", async (req, res) => {
  const kycs = await KYC.find().populate("user");
  res.render("admin/kyc", { kycs });
});

adminRouter.post("/kyc/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;

    const kyc = await KYC.findById(id).populate("user");
    if (!kyc) {
      return res.status(404).json({ success: false, message: "KYC record not found" });
    }

    if (kyc.status === "approved") {
      return res.status(400).json({ success: false, message: "KYC is already approved" });
    }

    // ✅ Update KYC status
    kyc.status = "approved";
    await kyc.save();

    // ✅ Also mark the user as verified
    if (kyc.user) {
      await User.findByIdAndUpdate(kyc.user._id, { verified: true });
    } else {
      return res.status(404).json({ success: false, message: "Associated user not found" });
    }

    res.json({ success: true, message: "KYC approved and user verified successfully" });
  } catch (error) {
    console.error("Error approving KYC:", error);
    res.status(500).json({ success: false, message: "Server error while approving KYC" });
  }
});

adminRouter.delete("/kyc/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const kyc = await KYC.findByIdAndDelete(id);
    if (!kyc) {
      return res.status(404).json({ message: "KYC not found" });
    }

    res.status(200).json({ message: "KYC deleted successfully" });
  } catch (err) {
    console.error("Error deleting KYC:", err);
    res.status(500).json({ message: "Server error deleting KYC" });
  }
});

// redemption
adminRouter.get("/redemption", async (req, res) => {
  const redemptions = await Redemption.find().populate("user");
  res.render("admin/redemption", { redemptions });
});

adminRouter.delete("/redemption/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const redemption = await Redemption.findByIdAndDelete(id);
    if (!redemption) {
      return res.status(404).json({ message: "Redemption not found" });
    }

    res.status(200).json({ message: "Redemption deleted successfully" });
  } catch (err) {
    console.error("Error deleting Redemption:", err);
    res.status(500).json({ message: "Server error deleting Redemption" });
  }
});

// appointments
adminRouter.get("/appointment", async (req, res) => {
  const appointment = await Appointment.find();
  res.render("admin/appointment", { appointment });
});

// ── UPDATED: Approve appointment application (Stage 1) ────────────────
// Replace the existing adminRouter.post("/appointment/:id/approve", ...) with this:
adminRouter.post("/appointment/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body; // amount set by admin

    if (!amount || Number(amount) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a valid payment amount." });
    }

    const appointment = await Appointment.findById(id).populate("user");
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (appointment.status === "approved") {
      return res.status(400).json({ success: false, message: "Already approved" });
    }

    appointment.status = "approved";
    appointment.isApproved = true;
    appointment.booking_amount = Number(amount); // ← admin sets the amount here
    await appointment.save();

    // Send approval email

    try {
      const emailRes = await sendEmail({
        to: appointment.sender_email,
        ...appointmentApprovalTemplate(appointment.sender_name, Number(amount)),
      });
    } catch (emailErr) {
      console.error("❌ Failed to send approval email:", emailErr);
    }

    res.json({ success: true, message: "Application approved. Email sent to user." });
  } catch (error) {
    console.error("Error approving appointment:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── NEW: Reject appointment application ───────────────────────────────
adminRouter.post("/appointment/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    appointment.status = "rejected";
    appointment.isApproved = false;
    await appointment.save();

    res.json({ success: true, message: "Application rejected." });
  } catch (error) {
    console.error("Error rejecting appointment:", error);
    res.status(500).json({ success: false, message: "Server error while rejecting appointment" });
  }
});

// ── NEW: Confirm payment proof (Stage 2) ──────────────────────────────
adminRouter.post("/appointment/:id/confirm-payment", async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (appointment.payment_status !== "submitted") {
      return res.status(400).json({ success: false, message: "No payment proof submitted yet" });
    }

    appointment.payment_status = "confirmed";
    await appointment.save();

    res.json({ success: true, message: "Payment confirmed. Appointment fully confirmed!" });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ success: false, message: "Server error while confirming payment" });
  }
});

adminRouter.delete("/appointment/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Use findByIdAndDelete to do it in one step
    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({ mssg: "Appointment not found" });
    }

    res.status(200).json({ mssg: "Appointment deleted successfully" });
  } catch (err) {
    console.error("Error deleting Appointment:", err);
    res.status(500).json({ mssg: "Server error deleting Appointment" });
  }
});

// cards

adminRouter.get("/cards", async (req, res) => {
  const cards = await CardOrder.find();
  res.render("admin/cards", { cards });
});

adminRouter.post("/cards/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;

    const card = await CardOrder.findById(id).populate("user");

    if (!card) {
      return res.status(404).json({
        success: false,
        mssg: "Card order not found",
      });
    }

    // Already approved?
    if (card.status === "approved") {
      return res.status(400).json({
        success: false,
        mssg: "Card already approved",
      });
    }

    // ✅ Update status
    card.status = "approved";
    await card.save();

    res.json({
      success: true,
      mssg: "Card approved successfully",
    });
  } catch (err) {
    console.error("Approve card error:", err);
    res.status(500).json({
      success: false,
      mssg: "Server error approving card",
    });
  }
});

adminRouter.delete("/cards/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const card = await CardOrder.findByIdAndDelete(id);

    if (!card) {
      return res.status(404).json({
        mssg: "Card order not found",
      });
    }

    res.json({
      mssg: "Card order deleted successfully",
    });
  } catch (err) {
    console.error("Delete card error:", err);
    res.status(500).json({
      mssg: "Server error deleting card",
    });
  }
});

// ADD THIS ROUTE to your existing admin.route.js
// Place it alongside the other /users/:userId routes

adminRouter.put("/users/:userId/coins", async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      btc,
      eth,
      usdt,
      xlm,
      xrp,
      ltc,
      doge,
      bnb,
      shib,
      trx,
      ada,
      sol,
      matic,
      algo,
      trump,
      pepe,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update each holding — only replace if a value was actually sent
    user.coinHoldings = {
      btc: parseFloat(btc ?? user.coinHoldings?.btc ?? 0),
      eth: parseFloat(eth ?? user.coinHoldings?.eth ?? 0),
      usdt: parseFloat(usdt ?? user.coinHoldings?.usdt ?? 0),
      xlm: parseFloat(xlm ?? user.coinHoldings?.xlm ?? 0),
      xrp: parseFloat(xrp ?? user.coinHoldings?.xrp ?? 0),
      ltc: parseFloat(ltc ?? user.coinHoldings?.ltc ?? 0),
      doge: parseFloat(doge ?? user.coinHoldings?.doge ?? 0),
      bnb: parseFloat(bnb ?? user.coinHoldings?.bnb ?? 0),
      shib: parseFloat(shib ?? user.coinHoldings?.shib ?? 0),
      trx: parseFloat(trx ?? user.coinHoldings?.trx ?? 0),
      ada: parseFloat(ada ?? user.coinHoldings?.ada ?? 0),
      sol: parseFloat(sol ?? user.coinHoldings?.sol ?? 0),
      matic: parseFloat(matic ?? user.coinHoldings?.matic ?? 0),
      algo: parseFloat(algo ?? user.coinHoldings?.algo ?? 0),
      trump: parseFloat(trump ?? user.coinHoldings?.trump ?? 0),
      pepe: parseFloat(pepe ?? user.coinHoldings?.pepe ?? 0),
    };

    await user.save();
    res.json({ success: true, message: "Portfolio updated successfully" });
  } catch (error) {
    console.error("Coin holdings update error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

adminRouter.get("/qphone", async (req, res) => {
  const orders = await QPhone.find().sort({ createdAt: -1 });
  res.render("admin/qphone", { orders });
});

adminRouter.delete("/qphone/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await QPhone.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Delete QPhone order error:", err);
    res.status(500).json({ message: "Server error deleting order" });
  }
});

// ============================================================
// ADD these imports to the top of admin.route.js
// ============================================================
// import Withdrawal from "../models/Withdrawal.js";
// import {
//   withdrawalApprovedTemplate,
//   withdrawalRejectedTemplate,
// } from "../mailers/templates/template.js";

// ============================================================
// ADD these routes to admin.route.js
// ============================================================

const WITHDRAWABLE_COIN_KEYS = [
  "btc",
  "eth",
  "usdt",
  "xlm",
  "xrp",
  "ltc",
  "doge",
  "bnb",
  "shib",
  "trx",
  "ada",
  "sol",
  "matic",
  "algo",
  "trump",
  "pepe",
];

adminRouter.get("/withdrawals", async (req, res) => {
  const withdrawals = await Withdrawal.find().populate("user").sort({ createdAt: -1 });
  res.render("admin/admin_withdrawals", { withdrawals });
});

adminRouter.post("/withdrawals/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;

    const withdrawal = await Withdrawal.findById(id).populate("user");
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "This withdrawal has already been processed" });
    }

    withdrawal.status = "approved";
    await withdrawal.save();

    // Send approval email (no balance change needed — already deducted at submission)
    try {
      await sendEmail({
        to: withdrawal.user.email,
        ...withdrawalApprovedTemplate(
          withdrawal.user.fullname,
          withdrawal.asset_label,
          withdrawal.amount,
          withdrawal.destination_address,
        ),
      });
    } catch (emailErr) {
      console.error("❌ Failed to send withdrawal approval email:", emailErr);
    }

    res.json({ success: true, message: "Withdrawal approved. Email sent to user." });
  } catch (error) {
    console.error("Error approving withdrawal:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

adminRouter.post("/withdrawals/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;

    const withdrawal = await Withdrawal.findById(id).populate("user");
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "This withdrawal has already been processed" });
    }

    // ✅ Refund the amount back to the user's balance
    const user = await User.findById(withdrawal.user._id);
    if (user) {
      const { asset_type, amount } = withdrawal;
      const isCoin = WITHDRAWABLE_COIN_KEYS.includes(asset_type);

      if (asset_type === "walletValue") {
        user.walletValue = (Number(user.walletValue || 0) + amount).toFixed(2);
      } else if (asset_type === "profit") {
        user.profit = (Number(user.profit || 0) + amount).toFixed(2);
      } else if (isCoin) {
        user.coinHoldings[asset_type] = Number(user.coinHoldings?.[asset_type] || 0) + amount;
      }

      await user.save();
    }

    withdrawal.status = "rejected";
    await withdrawal.save();

    // Send rejection email
    try {
      await sendEmail({
        to: withdrawal.user.email,
        ...withdrawalRejectedTemplate(
          withdrawal.user.fullname,
          withdrawal.asset_label,
          withdrawal.amount,
          withdrawal.destination_address,
        ),
      });
    } catch (emailErr) {
      console.error("❌ Failed to send withdrawal rejection email:", emailErr);
    }

    res.json({
      success: true,
      message: "Withdrawal rejected and amount refunded. Email sent to user.",
    });
  } catch (error) {
    console.error("Error rejecting withdrawal:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default adminRouter;
