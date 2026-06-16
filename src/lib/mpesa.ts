const MPESA_ENV = process.env.MPESA_ENV || "sandbox";

const BASE_URL =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

const CONSUMER_KEY = (process.env.MPESA_CONSUMER_KEY || "").trim();
const CONSUMER_SECRET = (process.env.MPESA_CONSUMER_SECRET || "").trim();
const SHORTCODE = (process.env.MPESA_SHORTCODE || "").trim();
const PASSKEY = (process.env.MPESA_PASSKEY || "").trim();
const CALLBACK_URL = (process.env.MPESA_CALLBACK_URL || "").trim();
const TRANSACTION_TYPE = (
  process.env.MPESA_TRANSACTION_TYPE || "CustomerBuyGoodsOnline"
).trim();

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getMpesaToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new Error(
      "MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET is not set in environment variables"
    );
  }

  const credentials = Buffer.from(
    `${CONSUMER_KEY}:${CONSUMER_SECRET}`
  ).toString("base64");

  console.log("[M-Pesa] ENV:", MPESA_ENV);
  console.log("[M-Pesa] URL:", BASE_URL);
  console.log("[M-Pesa] Key prefix:", CONSUMER_KEY.substring(0, 8));

  const res = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const text = await res.text();
  console.log("[M-Pesa] Token status:", res.status);
  console.log("[M-Pesa] Token body:", text);

  if (!res.ok) {
    throw new Error(`Token request failed (${res.status}): ${text}`);
  }

  let data: { access_token?: string; expires_in?: number };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Cannot parse token response: ${text}`);
  }

  if (!data.access_token) {
    throw new Error(`No access_token returned: ${text}`);
  }

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + ((data.expires_in || 3600) - 60) * 1000;
  console.log("[M-Pesa] Token OK");

  return cachedToken;
}

export function getMpesaTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

export function getMpesaPassword(timestamp: string): string {
  if (!SHORTCODE) throw new Error("MPESA_SHORTCODE is not set");
  if (!PASSKEY) throw new Error("MPESA_PASSKEY is not set");
  const raw = `${SHORTCODE}${PASSKEY}${timestamp}`;
  console.log("[M-Pesa] Password input shortcode:", SHORTCODE);
  console.log("[M-Pesa] Password input passkey prefix:", PASSKEY.substring(0, 8));
  return Buffer.from(raw).toString("base64");
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
  if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    return "254" + cleaned;
  }
  return cleaned;
}

export async function initiateStkPush({
  phone,
  amount,
  orderId,
  description,
}: {
  phone: string;
  amount: number;
  orderId: string;
  description: string;
}) {
  const token = await getMpesaToken();
  const timestamp = getMpesaTimestamp();
  const password = getMpesaPassword(timestamp);
  const formattedPhone = formatPhone(phone);
  const roundedAmount = Math.ceil(amount);

  if (!CALLBACK_URL) {
    throw new Error("MPESA_CALLBACK_URL is not set in environment variables");
  }

  console.log("[M-Pesa] STK phone:", formattedPhone);
  console.log("[M-Pesa] STK amount:", roundedAmount);
  console.log("[M-Pesa] STK shortcode:", SHORTCODE);
  console.log("[M-Pesa] STK callback:", CALLBACK_URL);
  console.log("[M-Pesa] STK type:", TRANSACTION_TYPE);

  const body = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: TRANSACTION_TYPE,
    Amount: roundedAmount,
    PartyA: formattedPhone,
    PartyB: SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: CALLBACK_URL,
    AccountReference: orderId.substring(0, 12),
    TransactionDesc: description.substring(0, 13),
  };

  console.log("[M-Pesa] STK body:", JSON.stringify(body, null, 2));

  const res = await fetch(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const text = await res.text();
  console.log("[M-Pesa] STK status:", res.status);
  console.log("[M-Pesa] STK response:", text);

  if (!res.ok) {
    throw new Error(`STK push failed: ${res.status} ${res.statusText} - ${text}`);
  }

  let data: {
    ResponseCode?: string;
    ResponseDescription?: string;
    CheckoutRequestID?: string;
    MerchantRequestID?: string;
    CustomerMessage?: string;
    errorMessage?: string;
    errorCode?: string;
  };

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Cannot parse STK response: ${text}`);
  }

  if (data.ResponseCode !== "0") {
    throw new Error(
      data.ResponseDescription ||
        data.errorMessage ||
        `STK failed with code: ${data.errorCode}`
    );
  }

  console.log("[M-Pesa] STK push sent successfully:", data.CheckoutRequestID);
  return data;
}

export function parseMpesaCallback(body: Record<string, unknown>) {
  const stkCallback = (
    body as {
      Body: {
        stkCallback: {
          ResultCode: number;
          ResultDesc: string;
          CheckoutRequestID: string;
          CallbackMetadata?: {
            Item: { Name: string; Value: unknown }[];
          };
        };
      };
    }
  ).Body.stkCallback;

  const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } =
    stkCallback;

  if (ResultCode !== 0) {
    return {
      success: false,
      checkoutRequestId: CheckoutRequestID,
      resultDesc: ResultDesc,
    };
  }

  const items = CallbackMetadata?.Item || [];
  const get = (name: string) =>
    items.find((i: { Name: string; Value: unknown }) => i.Name === name)
      ?.Value;

  return {
    success: true,
    checkoutRequestId: CheckoutRequestID,
    amount: get("Amount") as number,
    mpesaReceiptNumber: get("MpesaReceiptNumber") as string,
    transactionDate: get("TransactionDate") as string,
    phoneNumber: get("PhoneNumber") as string,
  };
}