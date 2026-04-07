import axios from "axios";

const BASE_URL =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  ).toString("base64");

  const res = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } },
  );

  cachedToken = {
    token: res.data.access_token,
    expiresAt: Date.now() + res.data.expires_in * 1000,
  };
  return cachedToken.token;
}

function getTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .substring(0, 14);
}

function getPassword(timestamp: string): string {
  const raw = `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 10)
    return "254" + cleaned.substring(1);
  if (cleaned.startsWith("254") && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith("7") && cleaned.length === 9) return "254" + cleaned;
  throw new Error("Invalid Kenyan phone number: " + phone);
}

export async function initiateStkPush(params: {
  phoneNumber: string;
  amount: number;
  orderId: string;
  description: string;
}) {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = getPassword(timestamp);
  const phone = formatPhone(params.phoneNumber);

  const res = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(params.amount),
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: `EVT-${params.orderId.slice(-8).toUpperCase()}`,
      TransactionDesc: params.description.substring(0, 13),
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (res.data.ResponseCode !== "0") {
    throw new Error("M-Pesa error: " + res.data.ResponseDescription);
  }

  return {
    checkoutRequestId: res.data.CheckoutRequestID,
    merchantRequestId: res.data.MerchantRequestID,
    customerMessage: res.data.CustomerMessage,
  };
}

export function parseMpesaCallback(body: {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: string | number }>;
      };
    };
  };
}) {
  const cb = body.Body.stkCallback;
  const success = cb.ResultCode === 0;
  if (!success) {
    return {
      success: false,
      merchantRequestId: cb.MerchantRequestID,
      checkoutRequestId: cb.CheckoutRequestID,
      errorMessage: cb.ResultDesc,
    };
  }
  const items = cb.CallbackMetadata?.Item ?? [];
  const get = (name: string) => items.find((i) => i.Name === name)?.Value;
  return {
    success: true,
    merchantRequestId: cb.MerchantRequestID,
    checkoutRequestId: cb.CheckoutRequestID,
    receiptNumber: get("MpesaReceiptNumber") as string,
    amount: get("Amount") as number,
    phoneNumber: get("PhoneNumber") as string,
  };
}
