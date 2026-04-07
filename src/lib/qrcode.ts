import QRCode from "qrcode";

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
