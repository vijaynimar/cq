import { Schema, model } from "mongoose";

const registrationOtpSchema = new Schema(
  {
    email: { type: String, required: true, index: true, unique: true },
    firstName: { type: String, required: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true, expires: 0 },
  },
  { timestamps: true }
);

export const RegistrationOtp = model("RegistrationOtp", registrationOtpSchema);
