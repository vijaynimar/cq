import { Schema, model } from "mongoose";

const passwordResetOtpSchema = new Schema(
  {
    email: { type: String, required: true, index: true, unique: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true, expires: 0 },
  },
  { timestamps: true }
);

export const PasswordResetOtp = model("PasswordResetOtp", passwordResetOtpSchema);
