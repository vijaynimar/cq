import { User } from "../model/user.js";
import { RegistrationOtp } from "../model/registrationOtp.js";
import { PasswordResetOtp } from "../model/passwordResetOtp.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const OTP_EXPIRY_MINUTES = 10;
const GMAIL_USER = "fitnessbuddy08@gmail.com";
const GMAIL_PASS = "yrvq brdr jgyv ckrp".replace(/\s+/g, "");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
};

const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

const sendRegistrationOtpEmail = async ({ email, firstName, otp }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: GMAIL_USER,
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

const sendResetPasswordEmail = async ({ email, firstName, otp }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: GMAIL_USER,
    to: email,
    subject: "Crave Cart Password Reset OTP",
    text: `Hello ${firstName || "User"}, your password reset OTP is ${otp}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color:#1d4ed8;">Crave Cart - Password Reset OTP</h2>
        <p>Hello <strong>${firstName || "User"}</strong>,</p>
        <p>Your OTP for password reset is:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #1e40af; margin: 14px 0;">${otp}</div>
        <p>This OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
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

    const user = await User.findOne({ email, deletedAt: null });
    if (!user) {
      return res.status(404).json({ error: "Email does not exist" });
    }

    const otp = generateOtpCode();
    const otpHash = await argon2.hash(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await PasswordResetOtp.findOneAndUpdate(
      { email },
      { email, otpHash, expiresAt },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    await sendResetPasswordEmail({
      email: user.email,
      firstName: user.firstName,
      otp,
    });

    return res.json({ message: "Reset password OTP sent to your email" });
  } catch (err) {
    console.error("Error sending reset password email:", err);
    return res.status(500).json({ error: "Failed to send reset password OTP" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP and new password are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const otpDoc = await PasswordResetOtp.findOne({ email });
    if (!otpDoc) {
      return res.status(400).json({ error: "OTP not found. Please request again" });
    }

    if (otpDoc.expiresAt < new Date()) {
      await PasswordResetOtp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ error: "OTP expired. Please request a new OTP" });
    }

    const isOtpValid = await argon2.verify(otpDoc.otpHash, String(otp));
    if (!isOtpValid) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const user = await User.findOne({ email, deletedAt: null });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = await passwordHash(newPassword);
    await user.save();
    await PasswordResetOtp.deleteOne({ _id: otpDoc._id });

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