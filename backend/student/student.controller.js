import { User } from "../model/user.js";
import { Product } from "../model/product.js";
import { WalletTransaction } from "../model/walletTransaction.js";
import { Cart } from "../model/cart.js";
import { Order } from "../model/order.js";

const toAmount = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Number(parsed.toFixed(2));
};

const safeWalletBalance = (user) => {
  const current = Number(user?.walletMoney || 0);
  if (!Number.isFinite(current) || current < 0) return 0;
  return current;
};

const rebuildCartTotals = (cart) => {
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.subTotal = Number(
    cart.items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
  );
};

const buildOrderNumber = () => {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${stamp}-${rand}`;
};

const restoreProductStocks = async (items = []) => {
  await Promise.all(
    items.map((item) =>
      Product.findByIdAndUpdate(item.productId, {
        $inc: { totalStocks: item.quantity },
        $set: { isOutOfStock: false, updatedAt: new Date() },
      })
    )
  );
};

export const getMenu = async (req, res) => {
  try {
    const { category, type, q } = req.query;
    const filter = { deletedAt: null };
    if (category && ["breakfast", "lunch", "snacks", "drinks"].includes(category)) {
      filter.category = category;
    }
    if (type && ["veg", "non-veg"].includes(type)) {
      filter.type = type;
    }
    if (q) {
      filter.name = { $regex: q, $options: "i" };
    }

    const products = await Product.find(filter).sort({ category: 1, name: 1 });
    const grouped = {
      breakfast: products.filter((p) => p.category === "breakfast"),
      lunch: products.filter((p) => p.category === "lunch"),
      snacks: products.filter((p) => p.category === "snacks"),
      drinks: products.filter((p) => p.category === "drinks"),
    };
    return res.json({ products, grouped });
  } catch (error) {
    console.error("Error in getMenu:", error);
    return res.status(500).json({ error: "Failed to fetch menu" });
  }
};

export const getFrequentOrders = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const recentOrders = await Order.find({ userId, kitchenStatus: { $ne: "cancelled" } })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("items");

    const frequencyMap = new Map();
    recentOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = String(item.productId);
        const current = frequencyMap.get(key) || {
          productId: item.productId,
          name: item.nameSnapshot,
          image: item.imageSnapshot,
          type: item.typeSnapshot,
          price: item.priceSnapshot,
          count: 0,
        };
        current.count += item.quantity;
        frequencyMap.set(key, current);
      });
    });

    const frequent = Array.from(frequencyMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return res.json(frequent);
  } catch (error) {
    console.error("Error in getFrequentOrders:", error);
    return res.status(500).json({ error: "Failed to fetch frequent orders" });
  }
};

export const getWalletSummary = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId).select("walletMoney firstName lastName email role");
    if (!user) return res.status(404).json({ error: "User not found" });

    const balance = safeWalletBalance(user);
    const recent = await WalletTransaction.find({ userId, status: "success" })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("type amount category createdAt");

    const credited = recent
      .filter((tx) => tx.type === "credit" || tx.type === "refund")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const debited = recent
      .filter((tx) => tx.type === "debit" || tx.type === "hold")
      .reduce((sum, tx) => sum + tx.amount, 0);

    return res.json({
      wallet: {
        balance,
        totals: {
          credited: Number(credited.toFixed(2)),
          debited: Number(debited.toFixed(2)),
        },
      },
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error in getWalletSummary:", error);
    return res.status(500).json({ error: "Failed to fetch wallet summary" });
  }
};

export const getWalletHistory = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const type = req.query.type;

    const filter = { userId };
    if (type && ["credit", "debit", "refund", "reversal", "hold"].includes(type)) {
      filter.type = type;
    }

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      WalletTransaction.countDocuments(filter),
    ]);

    return res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getWalletHistory:", error);
    return res.status(500).json({ error: "Failed to fetch wallet history" });
  }
};

export const topupWallet = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const amount = toAmount(req.body.amount);
    const paymentMethod = req.body.paymentMethod || "upi";
    const referenceId = req.body.referenceId || `UPI-${Date.now()}`;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    const existingTransaction = await WalletTransaction.findOne({
      userId,
      referenceId,
      category: "topup",
      type: "credit",
    });
    if (existingTransaction) {
      return res.status(200).json({
        message: "Top-up already processed",
        balance: existingTransaction.balanceAfter,
        transaction: existingTransaction,
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const before = safeWalletBalance(user);
    const after = Number((before + amount).toFixed(2));

    user.walletMoney = after;
    await user.save();

    let transaction;
    try {
      transaction = await WalletTransaction.create({
        userId,
        type: "credit",
        category: "topup",
        amount,
        balanceBefore: before,
        balanceAfter: after,
        paymentMethod,
        status: "success",
        referenceId,
        note: "Wallet top-up",
        metadata: {
          source: "student_wallet_topup",
        },
      });
    } catch (txError) {
      if (txError?.code === 11000) {
        const duplicateTx = await WalletTransaction.findOne({ userId, referenceId });
        return res.status(200).json({
          message: "Top-up already processed",
          balance: duplicateTx?.balanceAfter ?? after,
          transaction: duplicateTx,
        });
      }
      throw txError;
    }

    return res.status(201).json({
      message: "Wallet credited successfully",
      balance: after,
      transaction,
    });
  } catch (error) {
    console.error("Error in topupWallet:", error);
    return res.status(500).json({ error: "Failed to top-up wallet" });
  }
};

export const debitWallet = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const amount = toAmount(req.body.amount);
    const referenceId = req.body.referenceId || `DBT-${Date.now()}`;
    const category = req.body.category || "order_payment";
    const note = req.body.note || "Wallet debit";

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const before = safeWalletBalance(user);
    if (before < amount) {
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    const after = Number((before - amount).toFixed(2));
    user.walletMoney = after;
    await user.save();

    const transaction = await WalletTransaction.create({
      userId,
      type: "debit",
      category,
      amount,
      balanceBefore: before,
      balanceAfter: after,
      paymentMethod: "wallet",
      status: "success",
      referenceId,
      note,
      metadata: {
        source: "student_wallet_debit",
      },
    });

    return res.status(201).json({
      message: "Wallet debited successfully",
      balance: after,
      transaction,
    });
  } catch (error) {
    console.error("Error in debitWallet:", error);
    return res.status(500).json({ error: "Failed to debit wallet" });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user?.userId;
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [], totalItems: 0, subTotal: 0 });
    }
    return res.json(cart);
  } catch (error) {
    console.error("Error in getCart:", error);
    return res.status(500).json({ error: "Failed to fetch cart" });
  }
};

export const addCartItem = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { productId, quantity } = req.body;
    const qty = Number(quantity || 1);

    if (!productId || qty < 1) {
      return res.status(400).json({ error: "productId and valid quantity are required" });
    }

    const product = await Product.findOne({ _id: productId, deletedAt: null });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (Number(product.totalStocks || 0) <= 0) {
      return res.status(400).json({ error: "Product is out of stock" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = await Cart.create({ userId, items: [] });

    const existing = cart.items.find((item) => String(item.productId) === String(productId));
    if (existing) {
      if (existing.quantity + qty > Number(product.totalStocks || 0)) {
        return res.status(400).json({
          error: `Only ${product.totalStocks} item(s) available in stock`,
        });
      }
      existing.quantity += qty;
      existing.priceSnapshot = Number(product.price || 0);
      existing.nameSnapshot = product.name;
      existing.imageSnapshot = product.image?.[0] || "";
      existing.typeSnapshot = product.type || "veg";
      existing.lineTotal = Number((existing.quantity * existing.priceSnapshot).toFixed(2));
    } else {
      if (qty > Number(product.totalStocks || 0)) {
        return res.status(400).json({
          error: `Only ${product.totalStocks} item(s) available in stock`,
        });
      }
      const price = Number(product.price || 0);
      cart.items.push({
        productId,
        nameSnapshot: product.name,
        imageSnapshot: product.image?.[0] || "",
        typeSnapshot: product.type || "veg",
        priceSnapshot: price,
        quantity: qty,
        lineTotal: Number((qty * price).toFixed(2)),
      });
    }

    rebuildCartTotals(cart);
    await cart.save();
    return res.status(201).json(cart);
  } catch (error) {
    console.error("Error in addCartItem:", error);
    return res.status(500).json({ error: "Failed to add item to cart" });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { itemId } = req.params;
    const qty = Number(req.body.quantity);

    if (!qty || qty < 1) {
      return res.status(400).json({ error: "Valid quantity is required" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ error: "Cart item not found" });

    const product = await Product.findOne({ _id: item.productId, deletedAt: null });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (qty > Number(product.totalStocks || 0)) {
      return res.status(400).json({
        error: `Only ${product.totalStocks} item(s) available in stock`,
      });
    }

    item.quantity = qty;
    item.lineTotal = Number((qty * item.priceSnapshot).toFixed(2));

    rebuildCartTotals(cart);
    await cart.save();
    return res.json(cart);
  } catch (error) {
    console.error("Error in updateCartItem:", error);
    return res.status(500).json({ error: "Failed to update cart item" });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ error: "Cart item not found" });

    item.deleteOne();
    rebuildCartTotals(cart);
    await cart.save();
    return res.json(cart);
  } catch (error) {
    console.error("Error in removeCartItem:", error);
    return res.status(500).json({ error: "Failed to remove cart item" });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    cart.items = [];
    cart.totalItems = 0;
    cart.subTotal = 0;
    await cart.save();

    return res.json({ message: "Cart cleared", cart });
  } catch (error) {
    console.error("Error in clearCart:", error);
    return res.status(500).json({ error: "Failed to clear cart" });
  }
};

export const checkoutOrder = async (req, res) => {
  let deductedStockItems = [];
  try {
    const userId = req.user?.userId;
    const paymentMethod = req.body.paymentMethod || "wallet";
    const address = req.body.address || {};
    const pickupTime = req.body.pickupTime;

    if (!pickupTime || Number.isNaN(new Date(pickupTime).getTime())) {
      return res.status(400).json({ error: "Valid pickupTime is required" });
    }

    const [cart, user] = await Promise.all([
      Cart.findOne({ userId }),
      User.findById(userId),
    ]);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }
    if (!user) return res.status(404).json({ error: "User not found" });

    // Validate latest stock and reserve by decrementing now.
    for (const item of cart.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          deletedAt: null,
          totalStocks: { $gte: item.quantity },
        },
        {
          $inc: { totalStocks: -item.quantity },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      );

      if (!updatedProduct) {
        if (deductedStockItems.length > 0) {
          await restoreProductStocks(deductedStockItems);
        }
        return res.status(400).json({
          error: `${item.nameSnapshot} has insufficient stock. Please update your cart.`,
        });
      }

      const shouldBeOutOfStock = Number(updatedProduct.totalStocks || 0) <= 0;
      if (updatedProduct.isOutOfStock !== shouldBeOutOfStock) {
        await Product.findByIdAndUpdate(updatedProduct._id, {
          $set: {
            isOutOfStock: shouldBeOutOfStock,
            updatedAt: new Date(),
          },
        });
      }

      deductedStockItems.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    const subTotal = Number(cart.subTotal || 0);
    const tax = Number((subTotal * 0.05).toFixed(2));
    const delivery = subTotal > 0 ? 20 : 0;
    const total = Number((subTotal + tax + delivery).toFixed(2));

    let paymentStatus = "pending";
    let transactionId = null;

    if (paymentMethod === "wallet") {
      const before = safeWalletBalance(user);
      if (before < total) {
        await restoreProductStocks(deductedStockItems);
        return res.status(400).json({ error: "Insufficient wallet balance for checkout" });
      }
      const after = Number((before - total).toFixed(2));
      user.walletMoney = after;
      await user.save();

      const walletTx = await WalletTransaction.create({
        userId,
        type: "debit",
        category: "order_payment",
        amount: total,
        balanceBefore: before,
        balanceAfter: after,
        paymentMethod: "wallet",
        status: "success",
        referenceId: `ORDPAY-${Date.now()}`,
        note: "Order payment from wallet",
      });

      paymentStatus = "paid";
      transactionId = String(walletTx._id);
    }

    const order = await Order.create({
      orderNumber: buildOrderNumber(),
      userId,
      pickupTime: new Date(pickupTime),
      kitchenStatus: "received",
      items: cart.items.map((item) => ({
        productId: item.productId,
        nameSnapshot: item.nameSnapshot,
        imageSnapshot: item.imageSnapshot,
        typeSnapshot: item.typeSnapshot,
        priceSnapshot: item.priceSnapshot,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
      amountSummary: {
        subTotal,
        tax,
        discount: 0,
        delivery,
        total,
        paidAmount: paymentStatus === "paid" ? total : 0,
      },
      payment: {
        method: paymentMethod,
        status: paymentStatus,
        transactionId,
      },
      status: paymentStatus === "paid" ? "paid" : "pending",
      timeline: [
        {
          status: "received",
          note: "Order received by kitchen",
          at: new Date(),
        },
      ],
      address,
      metadata: {
        source: "student_checkout",
      },
    });

    cart.items = [];
    cart.totalItems = 0;
    cart.subTotal = 0;
    await cart.save();

    return res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    if (deductedStockItems.length > 0) {
      try {
        await restoreProductStocks(deductedStockItems);
      } catch (restoreError) {
        console.error("Failed to restore product stocks:", restoreError);
      }
    }
    console.error("Error in checkoutOrder:", error);
    return res.status(500).json({ error: "Failed to checkout order" });
  }
};

export const quickReorder = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const product = await Product.findOne({ _id: productId, deletedAt: null });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (Number(product.totalStocks || 0) <= 0) {
      return res.status(400).json({ error: "Product is out of stock" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = await Cart.create({ userId, items: [] });

    const existing = cart.items.find((item) => String(item.productId) === String(productId));
    if (existing) {
      if (existing.quantity + 1 > Number(product.totalStocks || 0)) {
        return res.status(400).json({
          error: `Only ${product.totalStocks} item(s) available in stock`,
        });
      }
      existing.quantity += 1;
      existing.lineTotal = Number((existing.quantity * existing.priceSnapshot).toFixed(2));
    } else {
      const price = Number(product.price || 0);
      cart.items.push({
        productId,
        nameSnapshot: product.name,
        imageSnapshot: product.image?.[0] || "",
        typeSnapshot: product.type || "veg",
        priceSnapshot: price,
        quantity: 1,
        lineTotal: price,
      });
    }

    rebuildCartTotals(cart);
    await cart.save();

    return res.status(201).json({ message: "Added to cart", cart });
  } catch (error) {
    console.error("Error in quickReorder:", error);
    return res.status(500).json({ error: "Failed to quick reorder" });
  }
};

export const getOrders = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    console.error("Error in getOrders:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) return res.status(404).json({ error: "Order not found" });

    return res.json(order);
  } catch (error) {
    console.error("Error in getOrderById:", error);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
};
