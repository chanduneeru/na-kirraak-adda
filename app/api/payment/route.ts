import { NextResponse } from "next/server";
import { getPaytmConfig } from "@/lib/admin-db";
import { generateQRCodeSVG } from "@/lib/qr-generator";

export async function GET() {
  try {
    const config = getPaytmConfig();
    const merchantId = config.merchantId ? config.merchantId.trim() : "";
    const merchantKey = config.merchantKey ? config.merchantKey.trim() : "";
    const upiId = config.upiId ? config.upiId.trim() : "";
    const isActive = Boolean(config.isActive);

    const hasCredentials = Boolean((merchantId && merchantKey) || upiId);

    return NextResponse.json({
      success: true,
      isActive,
      hasCredentials,
      upiId,
      merchantId,
      bankDetails: config.bankDetails || "",
      enableUpi: Boolean(config.enableUpi),
      enableBank: Boolean(config.enableBank),
      enableCard: Boolean(config.enableCard),
      enableCod: Boolean(config.enableCod),
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
    const isActive = Boolean(config.isActive);
    const merchantId = config.merchantId ? config.merchantId.trim() : "";
    const merchantKey = config.merchantKey ? config.merchantKey.trim() : "";
    const upiId = config.upiId ? config.upiId.trim() : "";

    const hasCredentials = Boolean((merchantId && merchantKey) || upiId);

    // 1. If Paytm Business Gateway is enabled but NO credentials (neither MID/Key nor Store UPI ID) are entered in Admin:
    if (isActive && !hasCredentials) {
      return NextResponse.json(
        {
          success: false,
          error: "No Payment Gateway configured. Please add Paytm Merchant Credentials (MID/Secret Key) OR Paytm Store UPI ID in Admin Panel.",
          code: "NO_GATEWAY_CONFIGURED",
        },
        { status: 400 }
      );
    }

    // 2. If Paytm is inactive and all manual payment options are also disabled:
    const hasManualOptions = Boolean(config.enableUpi || config.enableBank || config.enableCard || config.enableCod);
    if (!isActive && !hasManualOptions) {
      return NextResponse.json(
        {
          success: false,
          error: "No payment gateway or payment options are currently enabled by the admin. Please contact restaurant staff.",
          code: "NO_PAYMENT_METHODS_ENABLED",
        },
        { status: 400 }
      );
    }

    const txnId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    let upiUri = "";
    let qrCodeSvg = "";

    if (upiId) {
      upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("NA KIRRAAK ADDA")}&mc=5812&tid=${txnId}&tr=${txnId}&am=${amount}&cu=INR&tn=${encodeURIComponent(`DineIn ${tableNumber || ""} ${customerName || ""}`)}`;
      qrCodeSvg = generateQRCodeSVG(upiUri, 200);
    }

    return NextResponse.json({
      success: true,
      txnId,
      upiId,
      amount,
      upiUri,
      qrCodeSvg,
      merchantId,
      isActive,
      hasCredentials,
      bankDetails: config.bankDetails || "",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Server error" }, { status: 500 });
  }
}