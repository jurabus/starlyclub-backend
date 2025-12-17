import PaymentIntent from "../models/PaymentIntent.js";
import { finalizeMembershipPayment } from "../controllers/membershipController.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Voucher from "../models/Voucher.js";
import Provider from "../models/Provider.js";

export const finalizePaymentOnce = async (intent) => {
  // 🔒 Atomic idempotency lock
  const locked = await PaymentIntent.findOneAndUpdate(
    { _id: intent._id, status: { $ne: "paid" } },
    { status: "paid", paidAt: new Date() },
    { new: true }
  );

  if (!locked) return;

  /* ================= MEMBERSHIP ================= */
  if (locked.type === "membership_purchase") {
    if (!locked.membershipPaymentId) return;

    await finalizeMembershipPayment({
      metadata: { membershipPaymentId: locked.membershipPaymentId },
    });
    return;
  }

  /* ================= VOUCHER ================= */
  if (
    locked.type === "provider_purchase" &&
    locked.providerId &&
    locked.userId &&
    locked.voucherPayload
  ) {
    const provider = await Provider.findById(locked.providerId);
    if (!provider) return;

    await Voucher.create({
      provider: provider._id,
      providerName: provider.name,
      logoUrl: provider.logoUrl || "",
      currency: "SR",
      faceValue: locked.voucherPayload.faceValue,
      price: locked.amount,
      discountPercent: locked.voucherPayload.discountPercent,
      userId: locked.userId,
      status: "unused",
      name: `${provider.name} Voucher ${locked.voucherPayload.faceValue} SR`,
    });
    return;
  }

  /* ================= ORDER (ORIGINAL LOGIC) ================= */
  const cart = await Cart.findOne(
    locked.userId
      ? { userId: locked.userId }
      : { sessionId: locked.sessionId }
  ).populate("items.productId");

  if (!cart || cart.items.length === 0) return;

  const items = cart.items.map((i) => ({
    productId: i.productId._id,
    name: i.productId.name,
    imageUrl: i.productId.imageUrl,
    price: i.productId.newPrice,
    quantity: i.quantity,
  }));

  await Order.create({
    userId: locked.userId,
    sessionId: locked.sessionId,
    providerId: locked.providerId,
    items,
    total: locked.amount,
    payment: {
      gateway: locked.gateway,
      paymentIntentId: locked._id,
      paidAt: new Date(),
    },
    status: "pending",
  });

  await Cart.findOneAndUpdate(
    locked.userId
      ? { userId: locked.userId }
      : { sessionId: locked.sessionId },
    { items: [] }
  );
};
