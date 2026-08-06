import QRCode from "qrcode";
import crypto from "crypto";

export async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: "H",
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export function generateQrPayload(ticketId: string, eventId: string): string {
  return `eventra:ticket:${ticketId}:${eventId}:${Date.now()}`;
}

export function parseQrPayload(payload: string) {
  const parts = payload.split(":");
  if (parts.length !== 5 || parts[0] !== "eventra" || parts[1] !== "ticket") {
    return null;
  }
  return {
    ticketId: parts[2],
    eventId: parts[3],
    timestamp: parseInt(parts[4], 10),
  };
}

// Signed QR payload helpers
export function generateSignedPayload(ticketId: string, eventId: string, orderId?: string) {
  const secret = process.env.QR_SECRET;
  if (!secret) throw new Error("QR_SECRET is not set in environment");

  const payload = { t: ticketId, e: eventId, o: orderId || null, i: Date.now() };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", secret).update(b64).digest("hex");
  return `${b64}.${hmac}`;
}

export function verifySignedPayload(signed: string) {
  const secret = process.env.QR_SECRET;
  if (!secret) throw new Error("QR_SECRET is not set in environment");
  const parts = signed.split(".");
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const expected = crypto.createHmac("sha256", secret).update(b64).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"))) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString());
    return payload as { t: string; e: string; o?: string | null; i: number };
  } catch (e) {
    return null;
  }
}
