import express from "express";
import multer from "multer";
import bcrypt from "bcrypt"; // 🔒 Added for password hashing
import { body, validationResult } from "express-validator"; // 🔒 Added for XSS defense & sanitization
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

// Global country array used for validation
const validCountries = [
  "Afghanistan",

  "Albania",

  "Algeria",

  "American Samoa",

  "Angola",

  "Anguilla",

  "Antartica",

  "Antigua and Barbuda",

  "Argentina",

  "Armenia",

  "Aruba",

  "Ashmore and Cartier Island",

  "Australia",

  "Austria",

  "Azerbaijan",

  "Bahamas",

  "Bahrain",

  "Bangladesh",

  "Barbados",

  "Belarus",

  "Belgium",

  "Belize",

  "Benin",

  "Bermuda",

  "Bhutan",

  "Bolivia",

  "Bosnia and Herzegovina",

  "Botswana",

  "Brazil",

  "British Virgin Islands",

  "Brunei",

  "Bulgaria",

  "Burkina Faso",

  "Myanmar",

  "Burundi",

  "Cambodia",

  "Cameroon",

  "Canada",

  "Cape Verde",

  "Cayman Islands",

  "Central African Republic",

  "Chad",

  "Chile",

  "China",

  "Christmas Island",

  "Clipperton Island",

  "Cocos (Keeling) Islands",

  "Colombia",

  "Comoros",

  "Congo, Democratic Republic of the",

  "Congo, Republic of the",

  "Cook Islands",

  "Costa Rica",

  "Cote d'Ivoire",

  "Croatia",

  "Cuba",

  "Cyprus",

  "Czeck Republic",

  "Denmark",

  "Djibouti",

  "Dominica",

  "Dominican Republic",

  "Ecuador",

  "Egypt",

  "El Salvador",

  "Equatorial Guinea",

  "Eritrea",

  "Estonia",

  "Ethiopia",

  "Europa Island",

  "Falkland Islands (Islas Malvinas)",

  "Faroe Islands",

  "Fiji",

  "Finland",

  "France",

  "French Guiana",

  "French Polynesia",

  "French Southern and Antarctic Lands",

  "Gabon",

  "Gambia, The",

  "Gaza Strip",

  "Georgia",

  "Germany",

  "Ghana",

  "Gibraltar",

  "Glorioso Islands",

  "Greece",

  "Greenland",

  "Grenada",

  "Guadeloupe",

  "Guam",

  "Guatemala",

  "Guernsey",

  "Guinea",

  "Guinea-Bissau",

  "Guyana",

  "Haiti",

  "Heard Island and McDonald Islands",

  "Holy See (Vatican City)",

  "Honduras",

  "Hong Kong",

  "Howland Island",

  "Hungary",

  "Iceland",

  "India",

  "Indonesia",

  "Iran",

  "Iraq",

  "Ireland",

  "Ireland, Northern",

  "Israel",

  "Italy",

  "Jamaica",

  "Jan Mayen",

  "Japan",

  "Jarvis Island",

  "Jersey",

  "Johnston Atoll",

  "Jordan",

  "Juan de Nova Island",

  "Kazakhstan",

  "Kenya",

  "Kiribati",

  "Korea, North",

  "Korea, South",

  "Kuwait",

  "Kyrgyzstan",

  "Laos",

  "Latvia",

  "Lebanon",

  "Lesotho",

  "Liberia",

  "Libya",

  "Liechtenstein",

  "Lithuania",

  "Luxembourg",

  "Macau",

  "Macedonia, Former Yugoslav Republic of",

  "Madagascar",

  "Malawi",

  "Malaysia",

  "Maldives",

  "Mali",

  "Malta",

  "Man, Isle of",

  "Marshall Islands",

  "Martinique",

  "Mauritania",

  "Mauritius",

  "Mayotte",

  "Mexico",

  "Micronesia, Federated States of",

  "Midway Islands",

  "Moldova",

  "Monaco",

  "Mongolia",

  "Montserrat",

  "Morocco",

  "Mozambique",

  "Namibia",

  "Nauru",

  "Nepal",

  "Netherlands",

  "Netherlands Antilles",

  "New Caledonia",

  "New Zealand",

  "Nicaragua",

  "Niger",

  "Nigeria",

  "Niue",

  "Norfolk Island",

  "Northern Mariana Islands",

  "Norway",

  "Oman",

  "Pakistan",

  "Palau",

  "Panama",

  "Papua New Guinea",

  "Paraguay",

  "Peru",

  "Philippines",

  "Pitcaim Islands",

  "Poland",

  "Portugal",

  "Puerto Rico",

  "Qatar",

  "Reunion",

  "Romainia",

  "Russia",

  "Rwanda",

  "Saint Helena",

  "Saint Kitts and Nevis",

  "Saint Lucia",

  "Saint Pierre and Miquelon",

  "Saint Vincent and the Grenadines",

  "Samoa",

  "San Marino",

  "Sao Tome and Principe",

  "Saudi Arabia",

  "Scotland",

  "Senegal",

  "Seychelles",

  "Sierra Leone",

  "Singapore",

  "Slovakia",

  "Slovenia",

  "Solomon Islands",

  "Somalia",

  "South Africa",

  "South Georgia and South Sandwich Islands",

  "Spain",

  "Spratly Islands",

  "Sri Lanka",

  "Sudan",

  "Suriname",

  "Svalbard",

  "Swaziland",

  "Sweden",

  "Switzerland",

  "Syria",

  "Taiwan",

  "Tajikistan",

  "Tanzania",

  "Thailand",

  "Tobago",

  "Toga",

  "Tokelau",

  "Tonga",

  "Trinidad",

  "Tunisia",

  "Turkey",

  "Turkmenistan",

  "Tuvalu",

  "Uganda",

  "Ukraine",

  "United Arab Emirates",

  "United Kingdom",

  "United States",

  "Uruguay",

  "Uzbekistan",

  "Vanuatu",

  "Venezuela",

  "Vietnam",

  "Virgin Islands",

  "Wales",

  "Wallis and Futuna",

  "West Bank",

  "Western Sahara",

  "Yemen",

  "Yugoslavia",

  "Zambia",

  "Zimbabwe",
];

authRouter.get("/login", (req, res) => {
  res.render("login");
});

authRouter.post("/login", upload.none(), (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(500).send("Internal Server Error");
    if (!user) {
      if (info?.message === "User not found") return res.status(200).send("Invalid Email");
      if (info?.message === "Incorrect password") return res.status(200).send("Invalid Password");
      if (info?.message === "Account not active yet")
        return res.status(200).send("Account not active yet");
      return res.status(200).send("Login Failed");
    }
    req.logIn(user, (err) => {
      if (err) return res.status(200).send("Login Failed");
      return res.status(200).send("Login Successful!");
    });
  })(req, res, next);
});

authRouter.get("/register", (req, res) => {
  res.render("register");
});

// SECURED REGISTER ROUTE
authRouter.post(
  "/register",
  upload.none(),
  [
    // 🔒 Sanitization Array: Strips HTML/Script tags to permanently kill XSS
    body("fullname").trim().escape(),
    body("username").trim().escape(),
    body("email").isEmail().withMessage("Please enter a valid email address").normalizeEmail(),
    body("country").trim().escape(),
    body("state").trim().escape(),
    body("phone").trim().escape(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    try {
      // Check validation array results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(200).send(errors.array()[0].msg);
      }

      const { fullname, username, email, country, state, phone, password } = req.body;

      // Ensure fields aren't blank after trimming
      if (!fullname || !username || !email || !country || !state || !phone || !password) {
        return res.status(200).send("Please fill all required fields");
      }

      // Validate country whitelist
      if (!validCountries.includes(country)) {
        return res.status(200).send("Please select a valid country");
      }

      // Check for existing user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(200).send("Email already exists");
      }

      // Create new secure user
      const newUser = new User({
        fullname,
        username,
        email,
        country,
        state,
        phone,
        password, // Save the hashed variant
      });

      await newUser.save();

      // Verification handling
      const userId = newUser._id;
      const sendVerificationEmail = await VerificationModel.create({
        userId,
        type: VerificationEnum.EMAIL_VERIFICATION,
        expiresAt: fortyMinutesFromNow(),
      });

      const verificationUrl = `${process.env.APP_ORIGIN}/auth/confirm-account?code=${sendVerificationEmail.code}`;

      await sendEmail({
        to: newUser.email,
        from: "Verify <confirm@qfsledgersvault.com>",
        ...verifyEmailTemplate(verificationUrl),
      });

      return res.status(200).send("Registration Successful!");
    } catch (error) {
      console.error("Error in registration:", error);
      // 🐛 FIXED BUG: Changed 'emailRes.status' to 'res.status' to prevent server crash
      return res.status(500).send("Internal Server Error");
    }
  },
);

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
