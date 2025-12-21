import axios from "axios";

const BASE = "https://accept.paymob.com/api";

/* =========================================================
   AUTH
   ========================================================= */

export async function getAuthToken() {
  const r = await axios.post(`${BASE}/auth/tokens`, {
    api_key: process.env.PAYMOB_API_KEY,
  });
  return r.data.token;
}

/* =========================================================
   CREATE ORDER
   ========================================================= */

export async function createOrder(token, amountCents) {
  const r = await axios.post(`${BASE}/ecommerce/orders`, {
    auth_token: token,
    delivery_needed: false,
    amount_cents: amountCents,
    currency: "EGP",
    items: [],
  });
  return r.data;
}

/* =========================================================
   PAYMENT KEY (LEGACY – DO NOT REMOVE)
   ========================================================= */

export async function paymentKey(
  token,
  orderId,
  amountCents,
  user,
  integrationId,
  tokenize = false
) {
  const r = await axios.post(`${BASE}/acceptance/payment_keys`, {
    auth_token: token,
    amount_cents: amountCents,
    order_id: orderId,
    currency: "EGP",
    integration_id: integrationId,
    expiration: 3600,
    lock_order_when_paid: true,
    tokenize,
    billing_data: {
      first_name: user.name || "Customer",
      last_name: "NA",
      email: user.email,
      phone_number: user.phone || "0000000000",
      country: "EG",
      city: "Cairo",
      street: "NA",
      building: "NA",
      floor: "NA",
      apartment: "NA",
      postal_code: "00000",
    },
  });

  return r.data.token;
}

/* =========================================================
   ✅ NEW OFFICIAL API (USED BY CONTROLLERS)
   ========================================================= */

export async function createPaymentKey({
  authToken,
  orderId,
  amountCents,
  customer,
  integrationId,
  tokenize = false,
}) {
  return paymentKey(
    authToken,
    orderId,
    amountCents,
    customer,
    integrationId,
    tokenize
  );
}

/* =========================================================
   REFUND
   ========================================================= */

export async function refund(authToken, txnId, amountCents) {
  await axios.post(`${BASE}/acceptance/void_refund/refund`, {
    auth_token: authToken,
    transaction_id: txnId,
    amount_cents: amountCents,
  });
}
