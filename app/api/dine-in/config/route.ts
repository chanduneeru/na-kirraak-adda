import { NextResponse } from "next/server";
import { getDineInConfig, saveDineInConfig, getPaytmConfig } from "@/lib/admin-db";

export async function GET() {
  try {
    const config = getDineInConfig();
    const paytmConfig = getPaytmConfig();
    
    const merchantId = paytmConfig.merchantId ? paytmConfig.merchantId.trim() : "";
    const merchantKey = paytmConfig.merchantKey ? paytmConfig.merchantKey.trim() : "";
    const upiId = paytmConfig.upiId ? paytmConfig.upiId.trim() : "";
    const isActive = Boolean(paytmConfig.isActive);

    // Count credentials as valid ONLY if merchantId (MID) & merchantKey (Secret Key) are filled!
    const hasCredentials = Boolean(merchantId && merchantKey);

    return NextResponse.json({
      success: true,
      config,
      upiId: config.dineInUpiId || upiId,
      bankDetails: paytmConfig.bankDetails || "",
      enableBank: Boolean(paytmConfig.enableBank),
      enableUpi: Boolean(paytmConfig.enableUpi),
      enableCard: Boolean(paytmConfig.enableCard),
      enableCod: Boolean(config.enableDineInCod || paytmConfig.enableCod),
      paytmActive: isActive,
      paytmHasCredentials: hasCredentials,
      paytmConfig: {
        merchantId,
        merchantKey,
        upiId,
        isActive,
        hasCredentials,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch dine-in config" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = saveDineInConfig(body);
    return NextResponse.json({
      success: true,
      config: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update dine-in config" },
      { status: 500 }
    );
  }
}
