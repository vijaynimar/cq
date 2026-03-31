import { Schema, model } from "mongoose";

const walletTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["credit", "debit", "refund", "reversal", "hold"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["topup", "order_payment", "order_refund", "manual_adjustment", "other"],
      default: "other",
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    balanceBefore: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "success", "failed"], default: "success", index: true },
    paymentMethod: { type: String, enum: ["upi", "card", "netbanking", "wallet", "internal", "other"], default: "other" },
    referenceId: { type: String, index: true },
    note: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index(
  { userId: 1, referenceId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      referenceId: { $exists: true, $type: "string" },
    },
  }
);

export const WalletTransaction = model("WalletTransaction", walletTransactionSchema);
