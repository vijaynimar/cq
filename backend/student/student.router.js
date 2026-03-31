import { Router } from "express";
import { authenticateToken, authorizeStudent } from "../middleware/auth.js";
import {
  getMenu,
  getFrequentOrders,
  getWalletSummary,
  getWalletHistory,
  topupWallet,
  debitWallet,
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  checkoutOrder,
  getOrders,
  getOrderById,
  quickReorder,
} from "./student.controller.js";

const studentRouter = Router();

studentRouter.use(authenticateToken);
studentRouter.use(authorizeStudent);

studentRouter.get("/menu", getMenu);
studentRouter.get("/frequent-orders", getFrequentOrders);
studentRouter.post("/reorder", quickReorder);

studentRouter.get("/wallet/summary", getWalletSummary);
studentRouter.get("/wallet/history", getWalletHistory);
studentRouter.post("/wallet/topup", topupWallet);
studentRouter.post("/wallet/debit", debitWallet);

studentRouter.get("/cart", getCart);
studentRouter.post("/cart/items", addCartItem);
studentRouter.put("/cart/items/:itemId", updateCartItem);
studentRouter.delete("/cart/items/:itemId", removeCartItem);
studentRouter.delete("/cart", clearCart);

studentRouter.post("/orders/checkout", checkoutOrder);
studentRouter.get("/orders", getOrders);
studentRouter.get("/orders/:orderId", getOrderById);

export default studentRouter;
