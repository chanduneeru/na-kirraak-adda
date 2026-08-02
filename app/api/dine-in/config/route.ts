import { NextResponse } from "next/server";
import { getDineInConfig, saveDineInConfig, getPaytmConfig } from "@/lib/admin-db";

export async function GET() {
  try {
    const config = getDineInConfig();
    const paytmConfig = getPaytmConfig();
    return NextResponse.json({
      success: true,
      config,
      upiId: config.dineInUpiId || paytmConfig.upiId || "9966533466@ybl",
      bankDetails: paytmConfig.bankDetails || "State Bank of India | A/C: 1234567890 | IFSC: SBIN0001234 | Name: NA KIRRAAK ADDA",
      enableBank: paytmConfig.enableBank !== false,
      enableUpi: paytmConfig.enableUpi !== false,
      enableCod: config.enableDineInCod,
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
