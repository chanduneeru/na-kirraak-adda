"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  base_price?: number;
  category: string;
  image?: string;
  image_url?: string;
  is_veg: boolean | number;
  is_bestseller: boolean | number;
  is_active?: boolean | number;
}

function DineInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTableParam = searchParams.get("table") || searchParams.get("t") || "";
  const initialTable = rawTableParam
    ? rawTableParam.toLowerCase().startsWith("table")
      ? rawTableParam
      : `Table ${rawTableParam}`
    : "Table 1";

  const [tableNumber, setTableNumber] = useState<string>(initialTable);
  const [showTableSelector, setShowTableSelector] = useState<boolean>(false);
  const [customTableInput, setCustomTableInput] = useState<string>("");

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Customer Details & Payment State
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [utrReference, setUtrReference] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-App Custom Popup State (Replaces native browser alerts)
  const [popupMessage, setPopupMessage] = useState<{
    text: string;
    type?: "error" | "success" | "info";
    title?: string;
  } | null>(null);

  const showAlert = (text: string, type: "error" | "success" | "info" = "error", title?: string) => {
    setPopupMessage({ text, type, title });
  };

  // Payment Gateway State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"paytm" | "cod">("paytm");
  const [paymentStep, setPaymentStep] = useState<"details" | "gateway">("details");
  const [paymentGatewayData, setPaymentGatewayData] = useState<{
    txnId: string;
    upiId: string;
    upiUri: string;
    qrCodeSvg: string;
    bankDetails: string;
    merchantId: string;
    hasCredentials?: boolean;
  } | null>(null);

  // Dine-In Config & Admin Gateway Control
  const [dineInConfig, setDineInConfig] = useState({
    dineInGstRate: 0,
    dineInServiceCharge: 0,
    upiId: "",
    bankDetails: "",
    enableBank: false,
    enableUpi: false,
    enableCard: false,
    enableCod: false,
    paytmActive: false,
    paytmHasCredentials: false,
  });

  useEffect(() => {
    // Load cached table number if present
    const savedTable = localStorage.getItem("kirraak_dinein_table");
    if (savedTable && !rawTableParam) {
      setTableNumber(savedTable);
    }

    // Fetch Dine-In Config
    fetch("/api/dine-in/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDineInConfig({
            dineInGstRate: data.config?.dineInGstRate || 0,
            dineInServiceCharge: data.config?.dineInServiceCharge || 0,
            upiId: data.upiId || "",
            bankDetails: data.bankDetails || "",
            enableBank: Boolean(data.enableBank),
            enableUpi: Boolean(data.enableUpi),
            enableCard: Boolean(data.enableCard),
            enableCod: Boolean(data.enableCod),
            paytmActive: Boolean(data.paytmActive || data.paytmConfig?.isActive),
            paytmHasCredentials: Boolean(data.paytmHasCredentials || data.paytmConfig?.hasCredentials),
          });
        }
      })
      .catch(() => {});

    // Fetch Menu Products
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        const items: MenuItem[] = Array.isArray(data) ? data : data.products || [];
        setMenuItems(items);
        const uniqueCats = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
        setCategories(["All", ...uniqueCats]);
      })
      .catch(() => {});
  }, [rawTableParam]);

  const handleSelectTable = (tbl: string) => {
    setTableNumber(tbl);
    localStorage.setItem("kirraak_dinein_table", tbl);
    setShowTableSelector(false);
  };

  const handleCustomTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTableInput.trim()) {
      const formatted = customTableInput.toLowerCase().startsWith("table")
        ? customTableInput.trim()
        : `Table ${customTableInput.trim()}`;
      handleSelectTable(formatted);
      setCustomTableInput("");
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as { item: MenuItem; quantity: number }[];
    });
  };

  const cartSubtotal = cart.reduce((sum, c) => sum + (c.item.price || c.item.base_price || 0) * c.quantity, 0);
  const gstAmount = Math.round((cartSubtotal * dineInConfig.dineInGstRate) / 100);
  const serviceCharge = dineInConfig.dineInServiceCharge || 0;
  const grandTotal = cartSubtotal + gstAmount + serviceCharge;
  const totalItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
    const isVeg = Boolean(item.is_veg);
    if (vegFilter === "veg" && !isVeg) return false;
    if (vegFilter === "non-veg" && isVeg) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q));
    }
    return true;
  });

  // Direct COD Order Submission for Dine-In
  const handleCodOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) {
      showAlert("Please enter your Name and Mobile Number", "error", "Input Required");
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      showAlert("Mobile phone number must be exactly 10 digits (e.g. 9876543210)", "error", "Invalid Phone Number 📱");
      return;
    }
    if (cart.length === 0) {
      showAlert("Your cart is empty", "error", "Cart Empty");
      return;
    }
    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: `Dine-In (${tableNumber})`,
        tableNumber: tableNumber,
        orderType: "dine_in",
        items: cart.map((c) => ({
          id: c.item.id,
          name: c.item.name,
          price: c.item.price || c.item.base_price || 0,
          quantity: c.quantity,
        })),
        subtotal: cartSubtotal,
        gst: gstAmount,
        deliveryCharge: 0,
        grandTotal: grandTotal,
        paymentMethod: "Cash on Delivery [Pending COD Confirmation]",
        paymentStatus: "Pending COD Confirmation",
        status: "Awaiting Call Confirmation",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (data.success) {
        setCart([]);
        setIsCheckoutOpen(false);
        router.push(`/dine-in/status?orderId=${data.order?.id || ""}&table=${encodeURIComponent(tableNumber)}`);
      } else {
        showAlert(data.error || "Failed to place COD order", "error", "Order Error");
      }
    } catch (err: any) {
      showAlert("Order submission failed: " + err.message, "error", "Order Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Initiate Payment Gateway Transaction
  const handleInitiatePaymentGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) {
      showAlert("Please enter your Name and Mobile Number", "error", "Input Required");
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      showAlert("Mobile phone number must be exactly 10 digits (e.g. 9876543210)", "error", "Invalid Phone Number 📱");
      return;
    }
    if (cart.length === 0) {
      showAlert("Your cart is empty", "error", "Cart Empty");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: grandTotal,
          customerName: customerName.trim(),
          phone: phone.trim(),
          tableNumber: tableNumber,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPaymentGatewayData(data);
        setPaymentStep("gateway");
      } else {
        showAlert(data.error || "No payment gateway configured by the admin.", "error", "Payment Gateway Unavailable");
      }
    } catch (err: any) {
      showAlert("Payment gateway error: " + err.message, "error", "Connection Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Confirm Order after payment completion
  const handleFinalOrderSubmit = async () => {
    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: `Dine-In (${tableNumber})`,
        tableNumber: tableNumber,
        orderType: "dine_in",
        items: cart.map((c) => ({
          id: c.item.id,
          name: c.item.name,
          price: c.item.price || c.item.base_price || 0,
          quantity: c.quantity,
        })),
        subtotal: cartSubtotal,
        gst: gstAmount,
        deliveryCharge: 0,
        grandTotal: grandTotal,
        paymentMethod: `Paytm Business Gateway (Txn: ${paymentGatewayData?.txnId || "Paid"})`,
        paymentStatus: "Paid via Paytm Gateway",
        status: "Received",
        paymentScreenshot: paymentScreenshot,
        upiUtrInput: utrReference,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (data.success && data.orderId) {
        setCart([]);
        setIsCheckoutOpen(false);
        setPaymentStep("details");
        router.push(`/dine-in/status?orderId=${data.orderId}&table=${encodeURIComponent(tableNumber)}`);
      } else {
        showAlert(data.error || "Failed to place order. Please try again.", "error", "Order Failed");
      }
    } catch (err: any) {
      showAlert("Error placing order: " + err.message, "error", "Order Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayClick = (upiUri: string) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && upiUri) {
      window.location.href = upiUri;
    } else {
      const upiId = paymentGatewayData?.upiId || dineInConfig.upiId;
      if (upiId) {
        navigator.clipboard.writeText(upiId);
        showAlert(`Paytm Merchant VPA copied: "${upiId}"\n\nPlease scan the Paytm Business QR code on screen or open Paytm / GPay / PhonePe to pay ₹${grandTotal}, then click Confirm.`, "info", "Merchant UPI Copied");
      }
    }
  };

  const hasAnyPaymentMethod =
    (dineInConfig.paytmActive && dineInConfig.paytmHasCredentials) ||
    dineInConfig.enableUpi ||
    dineInConfig.enableBank ||
    dineInConfig.enableCard ||
    dineInConfig.enableCod;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-32">
      {/* Top Mobile Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 shadow-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🍔</span>
            <div>
              <h1 className="font-black text-base sm:text-lg tracking-wide text-amber-400">NA KIRRAAK ADDA</h1>
              <p className="text-[11px] text-slate-400 font-semibold">Digital Dine-In Menu</p>
            </div>
          </div>

          <button
            onClick={() => setShowTableSelector(true)}
            className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-extrabold px-3 py-1.5 rounded-full text-xs transition shadow-sm"
          >
            <span>🍽️</span>
            <span>{tableNumber}</span>
            <span className="text-[10px] text-amber-400">✏️</span>
          </button>
        </div>
      </header>

      {/* Table Change Modal */}
      {showTableSelector && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-amber-400">Select Your Table</h3>
              <button onClick={() => setShowTableSelector(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">Tap your table number below or enter a custom table number:</p>

            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {Array.from({ length: 20 }, (_, i) => `Table ${i + 1}`).map((tbl) => (
                <button
                  key={tbl}
                  onClick={() => handleSelectTable(tbl)}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    tableNumber === tbl
                      ? "bg-amber-500 text-slate-950 border-amber-400"
                      : "bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/50"
                  }`}
                >
                  {tbl.replace("Table ", "T-")}
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomTableSubmit} className="pt-2 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Or type custom table (e.g. Table 25)"
                value={customTableInput}
                onChange={(e) => setCustomTableInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button type="submit" className="bg-amber-500 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl">
                Set
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-3.5 sm:px-4 py-4 space-y-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-600/30 via-orange-600/20 to-red-600/30 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="inline-block bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md mb-1">
              Dine-In Special
            </span>
            <h2 className="font-extrabold text-sm sm:text-base text-white">Ordering for {tableNumber}</h2>
            <p className="text-[11px] sm:text-xs text-slate-300">⚡ Fast kitchen dispatch • Pay first, enjoy hot food!</p>
          </div>
          <span className="text-2xl sm:text-3xl">🍲</span>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search dishes, biryani, starters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">🔍</span>
          </div>

          {/* Veg / Non-Veg Pills */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setVegFilter("all")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  vegFilter === "all" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setVegFilter("veg")}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  vegFilter === "veg" ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Veg
              </button>
              <button
                onClick={() => setVegFilter("non-veg")}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  vegFilter === "non-veg" ? "bg-red-600/30 text-red-300 border border-red-500/40" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Non-Veg
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition ${
                  selectedCategory === cat
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid: Side-by-Side 2 Items Per Row on Mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3.5">
          {filteredItems.map((item) => {
            const isVeg = Boolean(item.is_veg);
            const isBestseller = Boolean(item.is_bestseller);
            const inCart = cart.find((c) => c.item.id === item.id);
            const price = item.price || item.base_price || 0;
            const imgSrc = item.image || item.image_url || "/icon.png";

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between h-full transition shadow-md group"
              >
                <div>
                  {/* Top Image Box */}
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-2">
                    <Image src={imgSrc} alt={item.name} fill className="object-cover group-hover:scale-105 transition duration-300" />
                    
                    {/* FSSAI Veg/Non-Veg Badge Top Left */}
                    <span
                      className={`absolute top-1.5 left-1.5 z-10 w-4 h-4 bg-slate-950/90 border flex items-center justify-center p-0.5 rounded ${
                        isVeg ? "border-emerald-500" : "border-red-500"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? "bg-emerald-500" : "bg-red-500"}`}></span>
                    </span>

                    {/* Bestseller Badge Top Right */}
                    {isBestseller && (
                      <span className="absolute top-1.5 right-1.5 z-10 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md shadow">
                        🔥 Top
                      </span>
                    )}
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="font-bold text-xs sm:text-sm text-slate-100 line-clamp-1 leading-snug">{item.name}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-1 sm:line-clamp-2 mt-0.5 leading-tight">{item.description}</p>
                </div>

                {/* Price & Add Action Button */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="font-black text-amber-400 text-xs sm:text-sm">₹{price}</span>

                  {inCart ? (
                    <div className="flex items-center bg-amber-500 text-slate-950 font-bold rounded-lg px-1.5 py-0.5 text-xs shadow">
                      <button onClick={() => handleQuantityChange(item.id, -1)} className="px-1 py-0.5 hover:bg-amber-600 rounded font-black">
                        -
                      </button>
                      <span className="px-1.5 font-extrabold">{inCart.quantity}</span>
                      <button onClick={() => handleQuantityChange(item.id, 1)} className="px-1 py-0.5 hover:bg-amber-600 rounded font-black">
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 text-amber-400 font-bold text-xs px-3 py-1 rounded-lg transition"
                    >
                      + ADD
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-3 sm:p-3.5 shadow-2xl shadow-amber-500/30 flex items-center justify-between text-slate-950">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider opacity-90">{totalItemCount} Items selected</p>
              <p className="font-black text-base sm:text-lg">₹{grandTotal}</p>
            </div>
            <button
              onClick={() => {
                setPaymentStep("details");
                setIsCheckoutOpen(true);
              }}
              className="bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <span>Pay & Place Order</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Custom In-App Alert Popup Modal (Replaces browser default alerts) */}
      {popupMessage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto text-2xl">
              {popupMessage.type === "error" ? "⚠️" : popupMessage.type === "success" ? "🎉" : "ℹ️"}
            </div>
            <div>
              <h4 className="font-black text-base text-amber-400">
                {popupMessage.title || (popupMessage.type === "error" ? "Notice" : "Success")}
              </h4>
              <p className="text-xs text-slate-300 mt-1.5 whitespace-pre-line leading-relaxed">
                {popupMessage.text}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPopupMessage(null)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Checkout & Payment Gateway Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-amber-400">
                  {paymentStep === "details" ? `Checkout — ${tableNumber}` : "💳 Paytm Business Gateway"}
                </h3>
                <p className="text-xs text-slate-400">
                  {paymentStep === "details"
                    ? "Enter customer details to generate payment"
                    : `Txn Ref: ${paymentGatewayData?.txnId || ""}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setPaymentStep("details");
                }}
                className="text-slate-400 hover:text-white font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Order Items Summary */}
            <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">Selected Dishes:</p>
              {cart.map((c) => (
                <div key={c.item.id} className="flex justify-between text-slate-300">
                  <span>
                    {c.quantity}x {c.item.name}
                  </span>
                  <span className="font-medium">₹{(c.item.price || c.item.base_price || 0) * c.quantity}</span>
                </div>
              ))}
              <div className="border-t border-slate-800 pt-2 space-y-1 font-semibold text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                {dineInConfig.dineInGstRate > 0 && (
                  <div className="flex justify-between">
                    <span>GST ({dineInConfig.dineInGstRate}%)</span>
                    <span>₹{gstAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-white text-sm font-black pt-1 border-t border-slate-800">
                  <span>Total Payable</span>
                  <span className="text-amber-400">₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Available Check */}
            {!dineInConfig.enableCod && (!dineInConfig.paytmActive || !dineInConfig.paytmHasCredentials) ? (
              <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-4 text-center space-y-2 shadow-lg">
                <span className="text-3xl">⚠️</span>
                <h4 className="font-extrabold text-amber-400 text-sm">No Active Payment Gateway</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  No payment methods or merchant gateways are currently enabled by the admin.
                </p>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-semibold">
                  Please contact restaurant staff to complete your order.
                </div>
              </div>
            ) : (
              <>
                {/* Step 1: Customer Details & Method Selection */}
                {paymentStep === "details" && (
                  <form
                    onSubmit={(e) => {
                      if (selectedPaymentMethod === "cod" || (!dineInConfig.paytmHasCredentials && dineInConfig.enableCod)) {
                        handleCodOrderSubmit(e);
                      } else {
                        handleInitiatePaymentGateway(e);
                      }
                    }}
                    className="space-y-3"
                  >
                    {/* Method Selector Pills if both are available */}
                    <div className="grid grid-cols-2 gap-2">
                      {dineInConfig.paytmActive && dineInConfig.paytmHasCredentials && (
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentMethod("paytm")}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            selectedPaymentMethod === "paytm"
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span>🔒</span> Paytm Gateway
                        </button>
                      )}
                      {dineInConfig.enableCod && (
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentMethod("cod")}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            selectedPaymentMethod === "cod" || !dineInConfig.paytmHasCredentials
                              ? "bg-amber-500/20 border-amber-500 text-amber-300 col-span-2"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span>💵</span> Pay at Table (COD)
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter your name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Phone Number (10 Digits)</label>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono tracking-wider"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                      {isSubmitting
                        ? "Processing..."
                        : selectedPaymentMethod === "cod" || (!dineInConfig.paytmHasCredentials && dineInConfig.enableCod)
                        ? "Submit Order (Pay at Table) 💵"
                        : `Pay ₹${grandTotal} via Paytm Gateway →`}
                    </button>
                  </form>
                )}

                {/* Step 2: Paytm Merchant Gateway Confirmation */}
                {paymentStep === "gateway" && paymentGatewayData && (
                  <div className="space-y-4">
                    {!paymentGatewayData.hasCredentials ? (
                      <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-5 text-center space-y-3 shadow-lg">
                        <span className="text-4xl">⚠️</span>
                        <h4 className="font-extrabold text-amber-400 text-base">No Active Payment Gateway</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          No payment methods or merchant gateways are currently enabled by the admin.
                        </p>
                        <p className="text-[11px] text-slate-400 font-semibold bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          Please contact restaurant staff to complete your order.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-3 shadow-xl">
                        <span className="inline-block bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                          🔒 Paytm Business Merchant Gateway
                        </span>
                        
                        <h4 className="text-2xl font-black text-amber-400">Total Payable: ₹{grandTotal}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">Txn Reference: {paymentGatewayData.txnId}</p>
                        <p className="text-xs text-slate-300">
                          Payment will be processed via NA KIRRAAK ADDA's Paytm Business Merchant Account.
                        </p>

                        {/* Mandatory Receipt Screenshot Upload */}
                        <div className="pt-2 border-t border-emerald-500/20 text-left space-y-2">
                          <label className="block text-xs font-bold text-amber-300 flex items-center justify-between">
                            <span>📸 Upload Payment Receipt Screenshot <span className="text-red-400 font-extrabold">*Mandatory</span></span>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setPaymentScreenshot(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                          />
                          {paymentScreenshot ? (
                            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 p-2 rounded-xl text-emerald-300 text-xs font-bold">
                              <span>✅</span>
                              <span>Payment Receipt Uploaded!</span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-amber-400 italic">
                              ⚠️ Please attach a screenshot of your payment receipt for admin verification.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentStep("details")}
                        className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs"
                      >
                        ← Back
                      </button>
                      {paymentGatewayData.hasCredentials && (
                        <button
                          type="button"
                          onClick={handleFinalOrderSubmit}
                          disabled={isSubmitting}
                          className="w-2/3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black py-3 rounded-xl text-xs shadow-lg transition"
                        >
                          {isSubmitting ? "Processing Gateway..." : "Confirm & Pay via Paytm Gateway ⚡"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DineInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-8 text-center">Loading Dine-In Menu...</div>}>
      <DineInContent />
    </Suspense>
  );
}
