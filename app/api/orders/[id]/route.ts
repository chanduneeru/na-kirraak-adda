import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateOrderPaymentVerification, addOrderChatMessage, updateOrderPaymentScreenshot } from "@/lib/admin-db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = getOrder(id);

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    let parsedItems = [];
    try {
      parsedItems = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
    } catch (e) {
      parsedItems = [];
    }

    let parsedChat = [];
    try {
      parsedChat = typeof (order as any).chatMessages === "string" 
        ? JSON.parse((order as any).chatMessages || "[]") 
        : ((order as any).chatMessages || []);
    } catch (e) {
      parsedChat = [];
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items: parsedItems,
        chatMessages: parsedChat,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const action = body.action;

    const order = getOrder(id);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (action === "verify_payment") {
      updateOrderPaymentVerification(id, "verified", "", "Preparing");
      addOrderChatMessage(id, "admin", "✅ Payment verified & confirmed by store staff! Your order is now being prepared.");
      return NextResponse.json({ success: true, message: "Payment verified successfully" });
    }

    if (action === "decline_payment") {
      const reason = body.reason || "Payment details could not be verified";
      updateOrderPaymentVerification(id, "declined", reason);
      addOrderChatMessage(id, "admin", `⚠️ Payment declined: ${reason}. Please upload a clear payment screenshot or contact staff.`);
      return NextResponse.json({ success: true, message: "Payment marked as declined" });
    }

    if (action === "add_chat_message") {
      const sender = body.sender === "admin" ? "admin" : "customer";
      const text = body.text ? body.text.trim() : "";
      if (!text) {
        return NextResponse.json({ success: false, error: "Message text cannot be empty" }, { status: 400 });
      }
      const newMsg = addOrderChatMessage(id, sender, text);
      return NextResponse.json({ success: true, message: newMsg });
    }

    if (action === "upload_screenshot") {
      const screenshot = body.paymentScreenshot || "";
      const upiUtrInput = body.upiUtrInput || "";
      if (!screenshot && !upiUtrInput) {
        return NextResponse.json({ success: false, error: "No screenshot or UTR provided" }, { status: 400 });
      }
      updateOrderPaymentScreenshot(id, screenshot, upiUtrInput);
      addOrderChatMessage(id, "customer", `📷 Sent updated payment screenshot/receipt (UTR: ${upiUtrInput || "N/A"})`, screenshot);
      return NextResponse.json({ success: true, message: "Payment screenshot updated" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
