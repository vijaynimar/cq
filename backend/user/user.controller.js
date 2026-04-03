import { User } from "../model/user.js";
import { RegistrationOtp } from "../model/registrationOtp.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const OTP_EXPIRY_MINUTES = 10;
const RESET_PASSWORD_EXPIRY_MINUTES = 15;

const createTransporter = () => {
  const gmailUser = String(process.env.GMAIL_NODEMAILER || '').trim();
  const gmailPass = String(process.env.GMAIL_NODEMAILER_PASS || '')
    .trim()
    .replace(/\s+/g, '');

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });
};

const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

const sendRegistrationOtpEmail = async ({ email, firstName, otp }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.GMAIL_NODEMAILER,
    to: email,
    subject: "Crave Cart Registration OTP",
    text: `Hello ${firstName || "User"}, your OTP is ${otp}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color:#1d4ed8;">Crave Cart - Email Verification</h2>
        <p>Hello <strong>${firstName || "User"}</strong>,</p>
        <p>Your OTP for account registration is:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #1e40af; margin: 14px 0;">${otp}</div>
        <p>This OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

const sendResetPasswordEmail = async ({ email, firstName, resetLink }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.GMAIL_NODEMAILER,
    to: email,
    subject: "Crave Cart Reset Password",
    text: `Hello ${firstName || "User"}, reset your password using this link: ${resetLink}. This link expires in ${RESET_PASSWORD_EXPIRY_MINUTES} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color:#1d4ed8;">Crave Cart - Reset Password</h2>
        <p>Hello <strong>${firstName || "User"}</strong>,</p>
        <p>Click the button below to reset your password:</p>
        <p style="margin: 18px 0;">
          <a href="${resetLink}" style="background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;font-weight:700;">Reset Password</a>
        </p>
        <p>If button does not work, use this link:</p>
        <p style="word-break: break-all; color:#1e40af;">${resetLink}</p>
        <p>This link is valid for ${RESET_PASSWORD_EXPIRY_MINUTES} minutes.</p>
      </div>
    `,
  });
};
const passwordHash = async (password) => {
  // Implement your password hashing logic here (e.g., using argon2)
  // For demonstration purposes, this is a placeholder and should not be used in production
  return await argon2.hash(password);
}

export const createUser = async (req, res) => {
  try {
    console.log("Request body:", req.body); // Log the request body for debugging
    const { firstName, email, password, phone, image, role } = req.body;
    if(!firstName || !email || !password) {
      return res.status(400).json({ error: 'First name, email, and password are required' });
    }
    const hashedPassword = await passwordHash(password);
    //check if user already exists email or by phone
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }
    const newUser = new User({
      firstName,
      email,
      password: hashedPassword,
      phone,
      image,
      role
    });
    const savedUser = await newUser.save();
    const safeUser = savedUser.toObject();
    delete safeUser.password;
    res.status(201).json(safeUser);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendRegistrationOtp = async (req, res) => {
  try {
    const { firstName, email, password, phone } = req.body;

    if (!firstName || !email || !password || !phone) {
      return res.status(400).json({ error: "First name, email, phone and password are required" });
    }

    if (!process.env.GMAIL_NODEMAILER || !process.env.GMAIL_NODEMAILER_PASS) {
      return res.status(500).json({ error: "Email OTP service is not configured" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email or phone already exists" });
    }

    const otp = generateOtpCode();
    const otpHash = await argon2.hash(otp);
    const hashedPassword = await passwordHash(password);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await RegistrationOtp.findOneAndUpdate(
      { email },
      {
        email,
        firstName,
        phone,
        passwordHash: hashedPassword,
        otpHash,
        expiresAt,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    await sendRegistrationOtpEmail({ email, firstName, otp });

    return res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error sending registration OTP:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const otpDoc = await RegistrationOtp.findOne({ email });
    if (!otpDoc) {
      return res.status(400).json({ error: "OTP not found. Please request again" });
    }

    if (otpDoc.expiresAt < new Date()) {
      await RegistrationOtp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ error: "OTP expired. Please request a new OTP" });
    }

    const isOtpValid = await argon2.verify(otpDoc.otpHash, String(otp));
    if (!isOtpValid) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const existingUser = await User.findOne({ $or: [{ email: otpDoc.email }, { phone: otpDoc.phone }] });
    if (existingUser) {
      await RegistrationOtp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ error: "User with this email or phone already exists" });
    }

    const newUser = new User({
      firstName: otpDoc.firstName,
      email: otpDoc.email,
      phone: otpDoc.phone,
      password: otpDoc.passwordHash,
      role: "student",
    });

    const savedUser = await newUser.save();
    await RegistrationOtp.deleteOne({ _id: otpDoc._id });

    const safeUser = savedUser.toObject();
    delete safeUser.password;
    return res.status(201).json(safeUser);
  } catch (err) {
    console.error("Error verifying registration OTP:", err);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!process.env.GMAIL_NODEMAILER || !process.env.GMAIL_NODEMAILER_PASS) {
      return res.status(500).json({ error: "Email service is not configured" });
    }

    const user = await User.findOne({ email, deletedAt: null });
    if (!user) {
      return res.status(404).json({ error: "Email does not exist" });
    }

    const resetToken = jwt.sign(
      { userId: user._id, purpose: "reset-password" },
      process.env.JWT_SECRET,
      { expiresIn: `${RESET_PASSWORD_EXPIRY_MINUTES}m` }
    );

    const resetBaseUrl = String(
      process.env.RESET_PASSWORD_BASE_URL ||
      process.env.FRONTEND_URL ||
      req.headers.origin ||
      "https://cq-1-bpdm.onrender.com"
    ).replace(/\/$/, "");
    const resetLink = `${resetBaseUrl}/reset-password/${resetToken}`;

    await sendResetPasswordEmail({
      email: user.email,
      firstName: user.firstName,
      resetLink,
    });

    return res.json({ message: "Reset password link sent to your email" });
  } catch (err) {
    console.error("Error sending reset password email:", err);
    return res.status(500).json({ error: "Failed to send reset password link" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    if (decoded?.purpose !== "reset-password" || !decoded?.userId) {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.deletedAt) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = await passwordHash(newPassword);
    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error resetting password:", err);
    return res.status(500).json({ error: "Failed to reset password" });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const LoginUser = async (req, res) => {
    try{
        const { email, password } = req.body;
        if(!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await User.findOne({ email });
        if(!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const isPasswordValid = await argon2.verify(user.password, password);
        if(!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user._id, email: user.email, role: user.role } });    
    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}