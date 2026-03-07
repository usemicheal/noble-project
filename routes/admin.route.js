import express from "express";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import KYC from "../models/KYC.js";
import { LinkedWallet } from "../models/LinkedWallet.js";
import Redemption from "../models/Redemption.js";
import Appointment from "../models/Appointment.js";
import CardOrder from "../models/CardOrder.js";

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

adminRouter.post("/appointment/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id).populate("user");
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment record not found" });
    }

    if (appointment.status === "confirmed") {
      return res.status(400).json({ success: false, message: "Appointment is already approved" });
    }
    if (appointment.isApproved === true) {
      return res.status(400).json({ success: false, message: "Appointment is already approved" });
    }

    // ✅ Update KYC status
    appointment.status = "confirmed";
    appointment.isApproved = true;
    await appointment.save();

    res.json({ success: true, message: "Appointment approved successfully" });
  } catch (error) {
    console.error("Error approving Appointment:", error);
    res.status(500).json({ success: false, message: "Server error while approving Appointment" });
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

export default adminRouter;
