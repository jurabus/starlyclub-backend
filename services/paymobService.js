import axios from "axios";
const BASE = "https://accept.paymob.com/api";

export async function getAuthToken() {
  const r = await axios.post(`${BASE}/auth/tokens`, {
    api_key: process.env.PAYMOB_API_KEY,
  });
  return r.data.token;
}

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

export async function paymentKey(token, orderId, amountCents, user, integrationId) {
  const r = await axios.post(`${BASE}/acceptance/payment_keys`, {
    auth_token: token,
    amount_cents: amountCents,
    order_id: orderId,
    currency: "EGP",
    integration_id: integrationId,
    expiration: 3600,
    billing_data: {
      first_name: user.name,
      last_name: "NA",
      email: user.email,
      phone_number: user.phone,
      country: "EG",
      city: "Cairo",
      street: "NA",
      building: "NA",
      floor: "NA",
      apartment: "NA",
      postal_code: "NA",
    },
  });
  return r.data.token;
}

export async function refund(token, txnId, amountCents) {
  await axios.post(`${BASE}/acceptance/void_refund/refund`, {
    auth_token: token,
    transaction_id: txnId,
    amount_cents: amountCents,
  });
}
