import { Schema, model } from "mongoose";

const cartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    nameSnapshot: { type: String, required: true },
    imageSnapshot: { type: String },
    typeSnapshot: { type: String, enum: ["veg", "non-veg"], default: "veg" },
    priceSnapshot: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
    totalItems: { type: Number, default: 0 },
    subTotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Cart = model("Cart", cartSchema);
