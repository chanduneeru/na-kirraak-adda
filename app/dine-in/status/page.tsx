"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  items: string | any[];
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus?: string;
  declineReason?: string;
  paymentScreenshot?: string;
  chatMessages?: any[] | string;
  createdAt: number;
  tableNumber?: string;
}

function DineInStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId") || "";
  const tableParam = searchParams.get("table") || "Table 1";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerMsgInput, setCustomerMsgInput] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // In-App Star Rating & Review Popup States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [chatNotification, setChatNotification] = useState<string | null>(null);
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const prevChatCountRef = useRef<number>(0);
  const isFirstChatLoadRef = useRef<boolean>(true);

  const playChatChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {}
  };

  const fetchOrder = () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.order) {
          setOrder(data.order);

          // Check for new chat messages from staff
          const chatList = typeof data.order.chatMessages === "string" 
            ? JSON.parse(data.order.chatMessages || "[]") 
            : (data.order.chatMessages || []);

          if (Array.isArray(chatList)) {
            if (!isFirstChatLoadRef.current && chatList.length > prevChatCountRef.current) {
              const latestMsg = chatList[chatList.length - 1];
              if (latestMsg && latestMsg.sender === "admin") {
                setChatNotification(`💬 New Message from Store Staff: "${latestMsg.text}"`);
                playChatChimeSound();
                setTimeout(() => setChatNotification(null), 7000);
              }
            }
            prevChatCountRef.current = chatList.length;
            isFirstChatLoadRef.current = false;
          }

          // Auto-trigger In-App Review Popup Modal when staff confirms order or verifies payment
          const isConfirmed = data.order.paymentStatus === "verified" || data.order.status === "Preparing" || data.order.status === "Ready" || data.order.status === "Completed";
          const alreadyReviewed = typeof window !== "undefined" && localStorage.getItem(`reviewed_order_${orderId}`);
          if (isConfirmed && !alreadyReviewed && !reviewSubmitted) {
            setShowReviewModal(true);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleSendCustomerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerMsgInput.trim() || !orderId) return;

    setIsSendingMsg(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_chat_message",
          sender: "customer",
          text: customerMsgInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomerMsgInput("");
        fetchOrder();
      }
    } catch (e) {
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleUploadChatScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orderId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      try {
        await fetch(`/api/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upload_screenshot",
            paymentScreenshot: base64Image,
          }),
        });
        fetchOrder();
      } catch (err) {}
    };
    reader.readAsDataURL(file);
  };

  const parsedItems = order
    ? typeof order.items === "string"
      ? JSON.parse(order.items)
      : order.items
    : [];

  const parsedChat = order
    ? typeof order.chatMessages === "string"
      ? JSON.parse(order.chatMessages || "[]")
      : order.chatMessages || []
    : [];

  const getStatusStep = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "preparing") return 2;
    if (s === "ready" || s === "out_for_delivery") return 3;
    if (s === "completed" || s === "delivered") return 4;
    return 1; // Received
  };

  const currentStep = getStatusStep(order?.status || "Received");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans max-w-2xl mx-auto flex flex-col justify-between">
      {/* Floating Real-Time Chat Notification Toast */}
      {chatNotification && (
        <div
          onClick={() => {
            document.getElementById("cod-chat-box")?.scrollIntoView({ behavior: "smooth" });
            setChatNotification(null);
          }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-5 py-3 rounded-2xl font-black text-xs shadow-2xl border border-amber-300 animate-in slide-in-from-top duration-300 flex items-center gap-2 cursor-pointer hover:scale-105 transition"
        >
          <span>🔔</span>
          <span>{chatNotification}</span>
          <span className="ml-2 bg-slate-950 text-amber-400 font-extrabold px-2 py-0.5 rounded-lg text-[10px]">
            View Chat 👇
          </span>
        </div>
      )}

      <div className="space-y-6 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black uppercase px-2.5 py-1 rounded-full">
              🍽️ {order?.tableNumber || tableParam}
            </span>
            <h1 className="font-extrabold text-xl text-white mt-2">Dine-In Order Tracker</h1>
            <p className="text-xs text-slate-400">Order #{orderId.slice(-6).toUpperCase()}</p>
          </div>
          <Link
            href={`/dine-in?table=${encodeURIComponent(order?.tableNumber || tableParam)}`}
            className="bg-amber-500 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-amber-400 transition flex items-center gap-1 shadow"
          >
            <span>➕ Add More Items</span>
          </Link>
        </div>

        {/* Payment Verification Status Card */}
        {order && (
          <div className="rounded-2xl border p-4 shadow-xl space-y-2 text-xs transition">
            {order.status === "Awaiting Call Confirmation" || order.paymentStatus === "Pending COD Confirmation" || order.paymentMethod?.includes("Cash on Delivery") ? (
              <div className="bg-orange-500/10 border-orange-500/30 text-orange-300 p-3.5 rounded-xl border flex items-center gap-3">
                <span className="text-2xl animate-pulse">📞</span>
                <div>
                  <h4 className="font-bold text-orange-400 text-sm">⏳ Order Placed — Pending Staff Confirmation</h4>
                  <p className="text-[11px] text-slate-300">
                    Please wait while restaurant staff confirms your order details. You can chat with store staff below!
                  </p>
                </div>
              </div>
            ) : order.paymentStatus === "Paid via Paytm Gateway" || order.paymentStatus === "verified" ? (
              <div className="bg-emerald-500/10 border-emerald-500/30 text-emerald-300 p-3.5 rounded-xl border flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h4 className="font-bold text-emerald-400 text-sm">✅ Order Placed & Paid via Paytm Gateway</h4>
                  <p className="text-[11px] text-slate-300">
                    Kitchen staff has received your order & cooking starts now!
                  </p>
                </div>
              </div>
            ) : order.paymentStatus === "pending" ? (
              <div className="bg-amber-500/10 border-amber-500/30 text-amber-300 p-3.5 rounded-xl border flex items-center gap-3">
                <span className="text-2xl animate-spin">⏳</span>
                <div>
                  <h4 className="font-bold text-amber-400 text-sm">Payment Verification Pending</h4>
                  <p className="text-[11px] text-slate-300">
                    Store staff is verifying your payment. Cooking starts as soon as verified!
                  </p>
                </div>
              </div>
            ) : order.paymentStatus === "declined" ? (
              <div className="bg-red-500/15 border-red-500/40 text-red-300 p-3.5 rounded-xl border space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">❌</span>
                  <h4 className="font-bold text-red-400 text-sm">Order Declined</h4>
                </div>
                <p className="text-[11px] text-slate-200">
                  Reason: <strong>{order.declineReason || "Order details could not be confirmed."}</strong>
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Status Tracker Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-slate-300">Live Kitchen Status</h2>

          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
            <div className={`p-2 rounded-xl border ${currentStep >= 1 ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-slate-950 border-slate-800 text-slate-600"}`}>
              <div className="text-lg">
                {order?.paymentMethod?.includes("Cash on Delivery") ? "💵" : "⚡"}
              </div>
              <div>
                {order?.paymentMethod?.includes("Cash on Delivery") ? "COD Order" : "Paid Online"}
              </div>
            </div>
            <div className={`p-2 rounded-xl border ${currentStep >= 2 ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-slate-950 border-slate-800 text-slate-600"}`}>
              <div className="text-lg">👨‍🍳</div>
              <div>Preparing</div>
            </div>
            <div className={`p-2 rounded-xl border ${currentStep >= 3 ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-slate-950 border-slate-800 text-slate-600"}`}>
              <div className="text-lg">🍲</div>
              <div>Ready</div>
            </div>
            <div className={`p-2 rounded-xl border ${currentStep >= 4 ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-600"}`}>
              <div className="text-lg">🏁</div>
              <div>Served</div>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
            {currentStep === 1 && <p className="text-xs text-amber-300 font-semibold">⌛ Order received! Kitchen staff is preparing your order.</p>}
            {currentStep === 2 && <p className="text-xs text-amber-400 font-semibold">👨‍🍳 Chef is cooking your dishes hot & fresh!</p>}
            {currentStep === 3 && <p className="text-xs text-emerald-400 font-extrabold">🍲 Your food is ready! Table service incoming.</p>}
            {currentStep === 4 && <p className="text-xs text-emerald-300 font-extrabold">🎉 Served! Enjoy your meal at NA KIRRAAK ADDA!</p>}
          </div>
        </div>

        {/* Dedicated Live Chat Box for COD Orders */}
        {(order?.status === "Awaiting Call Confirmation" || order?.paymentStatus === "Pending COD Confirmation" || order?.paymentMethod?.includes("Cash on Delivery")) && (
          <div id="cod-chat-box" className="bg-slate-900 border border-orange-500/40 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-orange-400 flex items-center gap-1.5">
                  <span>💬</span> COD Order Staff & Customer Chat
                </h2>
                <p className="text-[10px] text-slate-400">Communicate with restaurant staff to confirm your COD order details</p>
              </div>
              <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/40 px-2.5 py-0.5 rounded-full font-black uppercase">
                Live Chat
              </span>
            </div>

            {/* Message Log */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              {parsedChat.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs italic">
                  No messages yet. Send a message below to chat with store staff!
                </div>
              ) : (
                parsedChat.map((msg: any, idx: number) => (
                  <div
                    key={msg.id || idx}
                    className={`flex flex-col ${msg.sender === "customer" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        msg.sender === "customer"
                          ? "bg-amber-500 text-slate-950 font-semibold rounded-br-none shadow"
                          : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700 font-medium"
                      }`}
                    >
                      <p>{msg.text}</p>
                      {(msg.imageUrl || (order?.paymentScreenshot && msg.text.includes("payment screenshot"))) && (
                        <div className="mt-2 pt-1 border-t border-white/20">
                          <img
                            src={msg.imageUrl || order?.paymentScreenshot}
                            alt="Receipt Screenshot"
                            className="max-w-full max-h-48 rounded-xl border border-white/30 object-cover cursor-pointer hover:opacity-90 transition shadow-lg"
                            onClick={() => setPreviewScreenshotUrl(msg.imageUrl || order?.paymentScreenshot)}
                          />
                          <p className="text-[10px] font-bold text-amber-300 mt-1 flex items-center gap-1 cursor-pointer" onClick={() => setPreviewScreenshotUrl(msg.imageUrl || order?.paymentScreenshot)}>
                            <span>🔍</span> Click image to view full screen
                          </p>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 px-1">
                      {msg.sender === "customer" ? "You" : "Store Staff"} •{" "}
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendCustomerMessage} className="space-y-2 pt-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type message to restaurant staff..."
                  value={customerMsgInput}
                  onChange={(e) => setCustomerMsgInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={isSendingMsg || !customerMsgInput.trim()}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow transition disabled:opacity-50"
                >
                  Send 📤
                </button>
              </div>

              {/* Upload Screenshot Option in Chat */}
              <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10 text-[11px]">
                <span className="text-slate-400 font-medium">📸 Need to send a receipt screenshot?</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadChatScreenshot}
                  className="hidden"
                  id="chat-screenshot-input"
                />
                <label
                  htmlFor="chat-screenshot-input"
                  className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-3 py-1 rounded-lg cursor-pointer text-[10px] border border-white/10 transition"
                >
                  Attach Image 📎
                </label>
              </div>
            </form>
          </div>
        )}

        {/* Order Items List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <h2 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">Order Items ({parsedItems.length})</h2>
          <div className="space-y-2 text-xs">
            {parsedItems.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-slate-200">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-bold text-amber-400">₹{(item.price || 0) * (item.quantity || 1)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-3 flex justify-between font-extrabold text-sm text-white">
            <span>Total Paid</span>
            <span className="text-amber-400">₹{order?.total || 0}</span>
          </div>
        </div>
      </div>

      {/* Post-Order Google Review Encouragement Card */}
      <div className="mt-6 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl p-5 text-center space-y-3 shadow-xl">
        <div className="flex items-center justify-center gap-1.5 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
          <span>⭐</span>
          <span>Loved Your Experience at NA KIRRAAK ADDA?</span>
        </div>
        <h3 className="text-base font-black text-white">Rate Your Experience with NA KIRRAAK ADDA</h3>
        <p className="text-xs text-slate-300">
          Your feedback helps us cook better! Scan the QR or tap below to review us directly on Google.
        </p>

        <div className="p-2 rounded-2xl max-w-[210px] mx-auto shadow-2xl">
          <img
            src="/images/google-review-badge.png"
            alt="NA KIRRAAK ADDA Google Review QR Code"
            className="w-full rounded-xl border border-white/20 shadow-lg object-contain hover:scale-105 transition"
          />
        </div>

        <a
          href="https://search.google.com/local/writereview?placeid=ChIJe3nifACZyzsRvxIWfLnfhgY"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg transition uppercase tracking-wider"
        >
          <span>⭐ Rate & Write a Review on Google →</span>
        </a>
      </div>

      {/* Quick Re-order Bar */}
      <div className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-2 shadow-xl">
        <p className="text-xs text-slate-400">Want extra rotis, drinks, or desserts for your table?</p>
        <Link
          href={`/dine-in?table=${encodeURIComponent(order?.tableNumber || tableParam)}`}
          className="inline-block w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm py-3 rounded-xl shadow-lg transition"
        >
          ➕ Add More Items to {order?.tableNumber || tableParam}
        </Link>
      </div>

      {/* In-App Star Rating & Review Popup Modal (Appears upon order confirmation) */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16120E] border border-amber-500/50 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto text-3xl">
              ⭐
            </div>

            <div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                ✅ Order Confirmed!
              </span>
              <h3 className="font-extrabold text-lg text-white mt-2">Rate Your Experience with NA KIRRAAK ADDA</h3>
              <p className="text-xs text-zinc-300 mt-1">
                Your order is confirmed & kitchen is cooking! How is your experience with NA KIRRAAK ADDA?
              </p>
            </div>

            {/* Interactive 5-Star Rating */}
            <div className="flex justify-center gap-2 text-2xl py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className={`transition transform hover:scale-125 ${star <= reviewRating ? "text-amber-400" : "text-zinc-600"}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us what you love about our food or service..."
              className="w-full rounded-xl border border-white/10 bg-black/60 p-3 text-xs text-white outline-none focus:border-amber-500 min-h-[70px]"
            />

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem(`reviewed_order_${orderId}`, "true");
                    window.open("https://search.google.com/local/writereview?placeid=ChIJe3nifACZyzsRvxIWfLnfhgY", "_blank");
                  }
                  setReviewSubmitted(true);
                  setShowReviewModal(false);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black py-3 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <span>Submit & Post Review on Google ⭐</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-zinc-400 hover:text-white text-xs font-semibold"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Image Lightbox Modal */}
      {previewScreenshotUrl && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setPreviewScreenshotUrl(null)}
            className="absolute top-4 right-4 text-white hover:text-amber-400 text-2xl font-black bg-slate-900/80 px-4 py-2 rounded-full border border-white/20 shadow-xl"
          >
            ✕ Close
          </button>
          <img
            src={previewScreenshotUrl}
            alt="Payment Screenshot / Receipt"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-white/20 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

export default function DineInStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-8 text-center">Loading Order Status...</div>}>
      <DineInStatusContent />
    </Suspense>
  );
}
