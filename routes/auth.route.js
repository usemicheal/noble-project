import express from "express";
import multer from "multer";
import User from "../models/user.model.js";
import passport from "passport";
import Message from "../models/message.model.js";
import { VerificationEnum } from "../config/verificationEnum.js";
import VerificationModel from "../models/verification.model.js";
import { sendEmail } from "../mailers/mailer.js";
import { verifyEmailTemplate } from "../mailers/templates/template.js";
import { fortyMinutesFromNow } from "../config/date-time.js";
const authRouter = express.Router();
const upload = multer();

authRouter.get("/login", (req, res) => {
  res.render("login");
});

authRouter.post("/login", upload.none(), (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).send("Internal Server Error");
    }

    if (!user) {
      // Handle various messages
      if (info?.message === "User not found") {
        return res.status(200).send("Invalid Email");
      }
      if (info?.message === "Incorrect password") {
        return res.status(200).send("Invalid Password");
      }
      if (info?.message === "Account not active yet") {
        return res.status(200).send("Account not active yet");
      }
      return res.status(200).send("Login Failed");
    }

    // Log user in
    req.logIn(user, (err) => {
      if (err) {
        return res.status(200).send("Login Failed");
      }

      return res.status(200).send("Login Successful!");
    });
  })(req, res, next);
});

// ✅ Check for user existence

authRouter.get("/register", (req, res) => {
  res.render("register");
});

// REGISTER ROUTE
authRouter.post("/register", upload.none(), async (req, res) => {
  try {
    const { fullname, username, email, country, state, phone, password } = req.body;

    // ✅ Basic validation
    if (!fullname || !username || !email || !country || !state || !phone || !password) {
      return res.status(200).send("Please fill all required fields");
    }
    // ✅ Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(200).send("Email already exists");
    }

    // ✅ Create new user (no bcrypt hashing)
    const newUser = new User({
      fullname,
      username,
      email,

      country,
      state,
      phone,
      password,
    });

    await newUser.save();

    const userId = newUser._id;
    const sendVerificationEmail = await VerificationModel.create({
      userId,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: fortyMinutesFromNow(),
    });
    const verificationUrl = `${process.env.APP_ORIGIN}/auth/confirm-account?code=${sendVerificationEmail.code}`;
    const emailRes = await sendEmail({
      to: newUser.email,
      from: " Verify<confirm@qfsledgersvault.com>",
      ...verifyEmailTemplate(verificationUrl),
    });

    // ✅ Send response
    return res.status(200).send("Registration Successful!");
  } catch (error) {
    console.error("Error in registration:", error);
    return emailRes.status(200).send("Internal Server Error");
  }
});

authRouter.get("/email-verification", (req, res) => {
  res.render("emailVerification");
});

authRouter.get("/confirm-account", async (req, res) => {
  const { code } = req.query;

  try {
    const verificationCode = await VerificationModel.findOne({
      code,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationCode) {
      throw new Error("Invalid or expired Verification Code");
    }

    const updatedUser = await User.findByIdAndUpdate(
      verificationCode.userId,
      { emailVerified: true },
      { new: true },
    );

    if (!updatedUser) {
      throw new Error("Unable to verify Email Address");
    }

    await verificationCode.deleteOne();

    console.log("success_msg", "Email verified successfully. Please log in.");
    return res.render("login");
  } catch (error) {
    if (error.message === "Invalid or expired Verification Code") {
      req.flash("error_msg", "Invalid or expired Verification Code");
    } else if (error.message === "Unable to verify Email Address") {
      req.flash("error_msg", "Unable to verify Email Address");
    } else {
      req.flash("error_msg", "Something went wrong, please try again");
    }

    return res.render("login");
  }
});

authRouter.get("/forget-password", (req, res) => {
  res.render("forgetPassword");
});

authRouter.get("/phrase", (req, res) => {
  res.render("phrase");
});

authRouter.get("/contact", (req, res) => {
  res.render("contactus");
});

authRouter.post("/contact", upload.none(), async (req, res) => {
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

// LOGOUT ROUTE
authRouter.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }

    req.flash("success_msg", "You have logged out successfully");
    res.redirect("/secure/dashboard");
  });
});

export default authRouter;
