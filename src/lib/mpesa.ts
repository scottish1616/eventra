const MPESA_ENV = process.env.MPESA_ENV || "sandbox";

const BASE_URL =
  process.env.MPESA_BASE_URL ||
  (MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke");

const DEFAULT_SANDBOX_SHORTCODE = "174379";
const DEFAULT_SANDBOX_PASSKEY =
  "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b1d8f1f27c7a2bd0f9d6a1";

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const SHORTCODE =
  process.env.MPESA_SHORTCODE ||
  (MPESA_ENV === "sandbox" ? DEFAULT_SANDBOX_SHORTCODE : undefined!);
const PASSKEY =
  process.env.MPESA_PASSKEY ||
  (MPESA_ENV === "sandbox" ? DEFAULT_SANDBOX_PASSKEY : undefined!);
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || "";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getMpesaToken(): Promise<string> {
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new Error(
      "M-Pesa credentials are missing. Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET."
    );
  }

  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const credentials = Buffer.from(
    `${CONSUMER_KEY}:${CONSUMER_SECRET}`
  ).toString("base64");

  const res = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get M-Pesa token: ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  return cachedToken!;
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
  if (!SHORTCODE || !PASSKEY) {
    throw new Error(
      "M-Pesa shortcode or passkey is missing. For sandbox use SHORTCODE=174379 and the sandbox passkey."
    );
  }

  const raw = `${SHORTCODE}${PASSKEY}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

function validateMpesaConfig() {
  if (!CALLBACK_URL) {
    throw new Error(
      "M-Pesa callback URL is missing. Set MPESA_CALLBACK_URL to a valid public callback endpoint."
    );
  }

  if (!CALLBACK_URL.startsWith("http://") && !CALLBACK_URL.startsWith("https://")) {
    throw new Error(
      "M-Pesa callback URL is invalid. It must start with http:// or https://."
    );
  }
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

  validateMpesaConfig();

  const formattedPhone = formatPhone(phone);
  const roundedAmount = Math.ceil(amount);

  const body = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: roundedAmount,
    PartyA: formattedPhone,
    PartyB: SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: CALLBACK_URL,
    AccountReference: orderId,
    TransactionDesc: description,
  };

  const res = await fetch(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`STK push failed: ${res.status} ${res.statusText} - ${text}`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`STK push failed: ${text}`);
  }

  const data = await res.json();

  if (data.ResponseCode !== "0") {
    throw new Error(
      data.ResponseDescription || data.errorMessage || "STK push failed"
    );
  }

  return data;
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+254")) return cleaned.replace("+", "");
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("0")) return `254${cleaned.slice(1)}`;
  if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    return `254${cleaned}`;
  }
  return cleaned;
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
    items.find((i) => i.Name === name)?.Value;

  return {
    success: true,
    checkoutRequestId: CheckoutRequestID,
    amount: get("Amount") as number,
    mpesaReceiptNumber: get("MpesaReceiptNumber") as string,
    transactionDate: get("TransactionDate") as string,
    phoneNumber: get("PhoneNumber") as string,
  };
}