import { Schema, model } from "mongoose";

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    nameSnapshot: { type: String, required: true },
    imageSnapshot: { type: String },
    typeSnapshot: { type: String, enum: ["veg", "non-veg"], default: "veg" },
    priceSnapshot: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], default: [] },
    amountSummary: {
      subTotal: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      delivery: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      paidAmount: { type: Number, default: 0 },
    },
    payment: {
      method: { type: String, enum: ["wallet", "upi", "card", "cod", "other"], default: "wallet" },
      status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending", index: true },
      transactionId: { type: String },
    },
    pickupTime: { type: Date, required: true, index: true },
    kitchenStatus: {
      type: String,
      enum: ["received", "preparing", "ready", "completed", "cancelled"],
      default: "received",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "paid", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    timeline: {
      type: [
        {
          status: { type: String, required: true },
          note: { type: String },
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    address: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });

export const Order = model("Order", orderSchema);
