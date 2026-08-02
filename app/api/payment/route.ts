import { NextResponse } from "next/server";
import { getPaytmConfig } from "@/lib/admin-db";
import { generateQRCodeSVG } from "@/lib/qr-generator";

export async function GET() {
  try {
    const config = getPaytmConfig();
    return NextResponse.json({
      success: true,
      upiId: config.upiId || "9966533466@ybl",
      merchantId: config.merchantId || "NAKIRRAAK_MERCHANT",
      bankDetails: config.bankDetails || "",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const amount = body.amount || 0;
    const customerName = body.customerName || "Customer";
    const phone = body.phone || "";
    const tableNumber = body.tableNumber || "";

    const config = getPaytmConfig();

    const merchantId = config.merchantId || "NAKIRRAAK_MERCHANT";
    const upiId = config.upiId || "9966533466@ybl";
    const txnId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Generate dynamic order-specific UPI URL for exact order amount
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("NA KIRRAAK ADDA")}&mc=5812&tid=${txnId}&tr=${txnId}&am=${amount}&cu=INR&tn=${encodeURIComponent(`DineIn ${tableNumber || ""} ${customerName || ""}`)}`;

    // Generate dynamic QR Code SVG for this specific order
    const qrCodeSvg = generateQRCodeSVG(upiUri, 200);

    return NextResponse.json({
      success: true,
      txnId,
      upiId,
      amount,
      upiUri,
      qrCodeSvg,
      merchantId,
      bankDetails: config.bankDetails || "",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Server error" }, { status: 500 });
  }
}