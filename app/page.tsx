"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LocationPickerModal from "./components/LocationPickerModal";

type MenuItem = {
  name: string;
  description: string;
  price: string;
  image?: string | null;
  isVeg?: boolean;
  isBestseller?: boolean;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type CustomerReview = {
  id: string;
  name: string;
  rating: number;
  review: string;
  photo: string | null;
  createdAt: string;
};

const reviews = [
  {
    name: "Mahesh Tammadi (Local Guide)",
    text: "If you're looking for the ultimate smash burger, absolutely nails it. The patties have those perfect, ultra-crispy, lacy edges but somehow stay incredibly juicy on the inside. Melted American cheese binds it all together in a pillowy potato bun that doesn't get soggy. Simple, executed flawlessly, and zero gimmicks. Easily a 10/10. ❤️ #LoveNAKirraakAdda",
  },
  {
    name: "Gorentla Hemanth",
    text: "The sandwich was very tasty and fresh. I really enjoyed it. The quality and flavor were excellent. Keep up the good work!",
  },
  {
    name: "Vidhi Kokate",
    text: "Really enjoyed the Veg Cheese Burger! 🍔🧀 It was perfectly cooked, loaded with cheese, and tasted amazing. The quality and flavor were excellent. Had a wonderful experience.",
  },
];

const paymentOptions = ["UPI", "Paytm / GPay / PhonePe", "Cash on Delivery"];

function MenuSection({
  title,
  subtitle,
  items,
  onAddToCart,
}: {
  title: string;
  subtitle: string;
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}) {
  if (!items || items.length === 0) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-black/70 p-4 sm:p-6 shadow-2xl shadow-orange-500/10 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-400">
          {subtitle}
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white tracking-tight">{title}</h2>
      </div>

      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-3 sm:grid sm:overflow-visible sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 scrollbar-none">
        {items.map((item) => {
          const isVeg = item.isVeg !== undefined ? item.isVeg : !item.name.toLowerCase().includes("chicken");
          const isBestseller = item.isBestseller;

          return (
            <article
              key={item.name}
              className="w-[270px] sm:w-auto shrink-0 snap-start rounded-[1.75rem] border border-white/10 bg-[#14100C] p-4 flex flex-col justify-between hover:border-orange-500/30 transition shadow-xl group"
            >
              {/* Top Image Container matching Image 2 */}
              <div className="rounded-2xl bg-[#0D0A08] p-3 relative flex items-center justify-center min-h-[190px] overflow-hidden">
                {/* FSSAI Badge Top-Left */}
                {isVeg ? (
                  <span className="absolute top-3 left-3 flex h-5 w-5 items-center justify-center rounded border border-emerald-500 bg-black/80 p-0.5 shadow z-10">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                ) : (
                  <span className="absolute top-3 left-3 flex h-5 w-5 items-center justify-center rounded border border-red-700 bg-black/80 p-0.5 shadow z-10">
                    <span className="h-2 w-2 rounded-full bg-red-700" />
                  </span>
                )}

                {/* Bestseller Badge Top-Right */}
                {isBestseller && (
                  <span className="absolute top-3 right-3 rounded-full bg-[#FF6B00] px-2.5 py-0.5 text-[11px] font-extrabold text-black shadow z-10">
                    Bestseller
                  </span>
                )}

                {/* Image or Emoji */}
                {item.image && (item.image.startsWith("http") || item.image.startsWith("data:")) ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-44 w-full object-cover rounded-xl group-hover:scale-105 transition transform duration-300"
                  />
                ) : (
                  <span className="text-7xl drop-shadow select-none group-hover:scale-110 transition transform duration-300 py-4">
                    {item.name.toLowerCase().includes("pizza") ? "🍕" :
                     item.name.toLowerCase().includes("burger") ? "🍔" :
                     item.name.toLowerCase().includes("sandwich") ? "🥪" :
                     item.name.toLowerCase().includes("fries") || item.name.toLowerCase().includes("momos") ? "🍟" :
                     item.name.toLowerCase().includes("coffee") || item.name.toLowerCase().includes("tea") ? "☕" : "🥤"}
                  </span>
                )}
              </div>

              {/* Bottom details matching Image 2 */}
              <div className="mt-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{item.name}</h3>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-lg font-black text-white">{item.price}</span>
                  <button
                    onClick={() => onAddToCart(item)}
                    className="rounded-full bg-[#FF6B00] px-5 py-1.5 text-sm font-extrabold text-black transition hover:bg-orange-400 hover:scale-105 shadow-md shadow-orange-500/20"
                  >
                    Add +
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [customerNameInput, setCustomerNameInput] = useState("");
  const [customerRating, setCustomerRating] = useState(5);
  const [customerReview, setCustomerReview] = useState("");
  const [customerPhoto, setCustomerPhoto] = useState<string | null>(null);
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([]);
  const [activeOfferSlide, setActiveOfferSlide] = useState(1);
  const [dynamicProducts, setDynamicProducts] = useState<any[]>([]);

  const [selectedLocation, setSelectedLocation] = useState("Uppal, Hyderabad");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // Customer Menu Filter states
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "nonveg">("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // User session & Organization total completed orders count
  const [totalCompletedOrders, setTotalCompletedOrders] = useState(200);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  // Online UPI & Card Pre-Payment Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [upiUtrInput, setUpiUtrInput] = useState("");
  const [cardNumberInput, setCardNumberInput] = useState("");
  const [cardExpiryInput, setCardExpiryInput] = useState("");
  const [cardCvvInput, setCardCvvInput] = useState("");
  const [cardHolderInput, setCardHolderInput] = useState("");

  // Dynamic Payment Gateway Toggles state
  const [gatewaySettings, setGatewaySettings] = useState<any>({
    enableUpi: true,
    enableBank: true,
    enableCod: true,
    bankDetails: "",
  });

  // Custom In-App Alert Popup State (Replaces native browser alerts)
  const [popupMessage, setPopupMessage] = useState<{
    text: string;
    type?: "error" | "success" | "info";
    title?: string;
  } | null>(null);

  const paymentOptions = useMemo(() => {
    const opts: string[] = [];
    if (gatewaySettings && gatewaySettings.enableUpi === true) opts.push("UPI");
    if (gatewaySettings && gatewaySettings.enableBank === true) opts.push("Bank Transfer");
    if (gatewaySettings && gatewaySettings.enableCard !== false) opts.push("Card (Credit/Debit)");
    if (gatewaySettings && gatewaySettings.enableCod !== false) opts.push("Cash on Delivery");
    return opts;
  }, [gatewaySettings]);

  useEffect(() => {
    if (paymentOptions.length > 0 && !paymentOptions.includes(paymentMethod)) {
      setPaymentMethod(paymentOptions[0]);
    }
  }, [paymentOptions, paymentMethod]);

  const detectGPSLocation = () => {
    if ("geolocation" in navigator) {
      setLocationStatus("Detecting your live GPS location...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch("/api/delivery/validate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userLat: latitude, userLng: longitude }),
            });
            const data = await res.json();
            if (data.allowed) {
              const feeText = data.deliveryFee === 0 ? "FREE Delivery" : `₹${data.deliveryFee} Delivery Fee`;
              setSelectedLocation(`GPS (${data.distanceKm.toFixed(1)}km — ${feeText})`);
              setDeliveryArea("Uppal");
              setLocationStatus(`Location verified: ${data.distanceKm.toFixed(1)} km from store ✓`);
              setTimeout(() => setLocationModalOpen(false), 1200);
            } else {
              setLocationStatus(`⚠️ You are ${data.distanceKm ? data.distanceKm.toFixed(1) : "3+"} km away from Uppal store (Out of Delivery Radius >3 km)`);
            }
          } catch (e) {
            setSelectedLocation(`GPS (Lat: ${latitude.toFixed(2)}, Lng: ${longitude.toFixed(2)})`);
            setTimeout(() => setLocationModalOpen(false), 1000);
          }
        },
        () => {
          setLocationStatus("GPS permission denied. Please pick your area below.");
        }
      );
    } else {
      setLocationStatus("GPS not supported. Please pick your area below.");
    }
  };

  const loadDynamicProducts = async () => {
    try {
      const [resProd, resCat] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      if (resProd.ok) {
        const data = await resProd.json();
        setDynamicProducts(data);
      }
      if (resCat.ok) {
        const cats = await resCat.json();
        setAvailableCategories(cats);
      }
    } catch (e) {
      console.error("Error loading menu data:", e);
    }
  };

  const [promoOffers, setPromoOffers] = useState<any[]>([
    {
      title: "Kirrak Combo Offer — Save 15%",
      subtitle: "Add any 2 items to unlock special Adda discount",
      icon: "🍔",
      code: "KIRRAAK15",
    },
    {
      title: "Free delivery above ₹499",
      subtitle: "No coupon needed — auto-applied at checkout",
      icon: "🛵",
      code: "FREEDEL",
    },
    {
      title: "Adda Pe Swagat Hai! ₹50 Off",
      subtitle: "Use code KIRRAAK50 on orders above ₹299",
      icon: "🔥",
      code: "KIRRAAK50",
    },
  ]);

  // Device ID & Coupon Redemption state
  const [deviceId, setDeviceId] = useState("");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    let dev = typeof window !== "undefined" ? localStorage.getItem("deviceId") : null;
    if (!dev) {
      dev = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      if (typeof window !== "undefined") localStorage.setItem("deviceId", dev);
    }
    setDeviceId(dev);

    // Fetch dynamic active offers for homepage slider
    fetch("/api/offers")
      .then((r) => r.json())
      .then((offers) => {
        if (Array.isArray(offers) && offers.length > 0) {
          setPromoOffers(offers);
        }
      })
      .catch(() => {});

    loadDynamicProducts();

    // Auto pre-fill user account info if logged in
    try {
      const userDataStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (userDataStr) {
        const u = JSON.parse(userDataStr);
        setLoggedInUser(u);
        if (u.name) setCustomerName(u.name);
        if (u.phone) setPhone(u.phone);
      }
    } catch (e) {}

    // Fetch total organization completed orders count
    fetch("/api/orders")
      .then((r) => r.json())
      .then((orders) => {
        if (Array.isArray(orders)) {
          setTotalCompletedOrders(200 + orders.length);
        }
      })
      .catch(() => {});

    // Fetch dynamic payment gateway settings (UPI, Bank Transfer, COD toggles)
    fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getPaytmConfig" }),
    })
      .then((r) => r.json())
      .then((config) => {
        if (config) setGatewaySettings(config);
      })
      .catch(() => {});

    // Auto-advance offer slide every 4 seconds
    const slideTimer = setInterval(() => {
      setActiveOfferSlide((prev) => (promoOffers.length > 0 ? (prev + 1) % promoOffers.length : 0));
    }, 4000);

  }, [promoOffers.length]);

  // Sync delivery area from top header location selector
  useEffect(() => {
    if (selectedLocation) {
      const area = selectedLocation.split(",")[0].replace("📍", "").replace("⚡ Live GPS (", "").trim();
      if (area && area.length < 20) {
        setDeliveryArea(area);
      } else {
        setDeliveryArea("Uppal");
      }
    }
  }, [selectedLocation]);

  // User-Isolated Cart key generator
  const getCartStorageKey = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const u = JSON.parse(userData);
        if (u && (u.id || u.username)) {
          return `nakirraak_cart_${u.id || u.username}`;
        }
      }
    } catch (e) {}
    return "nakirraak_cart_guest";
  };

  // Load cart based on active isolated user session
  useEffect(() => {
    const key = getCartStorageKey();
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCartItems(parsed);
        else setCartItems([]);
      } else {
        setCartItems([]);
      }
    } catch (e) {
      setCartItems([]);
    }
  }, [loggedInUser]);

  // Sync cart changes to isolated localStorage key and notify Header badge
  useEffect(() => {
    const key = getCartStorageKey();
    try {
      localStorage.setItem(key, JSON.stringify(cartItems));
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: cartItems }));
    } catch (e) {}
  }, [cartItems]);

  // Listen to open-nakirraak-cart event dispatched from Header Cart button
  useEffect(() => {
    const handleOpenCart = () => {
      setCheckoutOpen(true);
    };
    window.addEventListener("open-nakirraak-cart", handleOpenCart);
    return () => {
      window.removeEventListener("open-nakirraak-cart", handleOpenCart);
    };
  }, []);

  const groupedCategories = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const p of dynamicProducts) {
      if (p.isActive === false || p.isActive === 0) continue;
      const isVeg = p.isVeg === true || p.isVeg === 1;

      // Filter 1: Veg / Non-Veg
      if (vegFilter === "veg" && !isVeg) continue;
      if (vegFilter === "nonveg" && isVeg) continue;

      // Filter 2: Category Filter
      const cat = p.category || "Menu Items";
      if (selectedCategoryFilter !== "all" && cat.toLowerCase() !== selectedCategoryFilter.toLowerCase()) continue;

      const item: MenuItem = {
        name: p.name,
        description: p.description,
        price: `₹${p.price}`,
        image: p.image,
        isVeg: isVeg,
        isBestseller: p.isBestseller === true || p.isBestseller === 1,
      };
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(item);
    }
    return Array.from(map.entries());
  }, [dynamicProducts, vegFilter, selectedCategoryFilter]);

  const bestsellersList = useMemo(() => {
    return dynamicProducts
      .filter((p) => (p.isActive !== false && p.isActive !== 0) && (p.isBestseller === true || p.isBestseller === 1))
      .map((p) => ({
        name: p.name,
        description: p.description,
        price: `₹${p.price}`,
        image: p.image,
        isVeg: p.isVeg === true || p.isVeg === 1,
        isBestseller: true,
      }));
  }, [dynamicProducts]);

  const addToCart = (item: MenuItem) => {
    const price = Number(item.price.replace(/[^\d]/g, ""));
    setCartItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.name);
      if (existing) {
        return prev.map((entry) =>
          entry.id === item.name ? { ...entry, qty: entry.qty + 1 } : entry,
        );
      }
      return [...prev, { id: item.name, name: item.name, price, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev.flatMap((item) => {
        if (item.id !== id) return [item];
        const nextQty = item.qty + delta;
        return nextQty > 0 ? [{ ...item, qty: nextQty }] : [];
      }),
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setCouponLoading(true);
    setCouponMsg("");
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validateCoupon",
          code: couponCodeInput,
          phone: phone,
          deviceId: deviceId,
          cartTotal: subtotal,
        }),
      });
      const data = await res.json();
      if (data.valid && data.offer) {
        setAppliedCoupon(data.offer);
        let disc = 0;
        if (data.offer.discountType === "percent") {
          disc = (subtotal * data.offer.discountValue) / 100;
        } else {
          disc = data.offer.discountValue;
        }
        setDiscountAmount(disc);
        setCouponMsg(`✓ Coupon "${data.offer.code}" applied! You saved ₹${disc.toFixed(0)}`);
      } else {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponMsg(data.message || "Invalid coupon code");
      }
    } catch (e) {
      setCouponMsg("Error validating coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const gst = Math.max(0, subtotal - discountAmount) * 0.05;
  const deliveryCharge = subtotal > 499 || subtotal === 0 ? 0 : 40;
  const grandTotal = Math.max(0, subtotal - discountAmount) + gst + deliveryCharge;

  const handleProceedToCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address) {
      setPopupMessage({ text: "Please fill in your name, mobile number, and house address.", type: "error", title: "Missing Information" });
      return;
    }

    if (paymentMethod !== "Cash on Delivery" && !paymentModalOpen) {
      setPaymentModalOpen(true);
    } else {
      placeOrder();
    }
  };

  const placeOrder = async () => {
    try {
      const finalPaymentStatus = paymentMethod === "Cash on Delivery"
        ? "Pending COD"
        : `Paid via UPI (Ref UTR: ${upiUtrInput || "Online Payment"})`;

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          address: `${address} (${deliveryArea})`,
          items: cartItems,
          subtotal,
          discountAmount,
          gst,
          deliveryCharge,
          grandTotal,
          couponCode: appliedCoupon?.code || "",
          deviceId: deviceId,
          paymentMethod: `${paymentMethod} [${finalPaymentStatus}]`,
        }),
      });

      if (response.ok) {
        setPopupMessage({ text: "Order placed successfully! NA KIRRAAK ADDA team will confirm your order shortly. 🎉", type: "success", title: "Order Placed 🎉" });
        setCartItems([]);
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponCodeInput("");
        setCouponMsg("");
        setCheckoutOpen(false);
        setPaymentModalOpen(false);
        setUpiUtrInput("");
      } else {
        setPopupMessage({ text: "Failed to place order. Please try again.", type: "error", title: "Order Failed" });
      }
    } catch (e) {
      setPopupMessage({ text: "Error placing order. Please try again.", type: "error", title: "Order Error" });
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomerPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReview = (event: React.FormEvent) => {
    event.preventDefault();
    if (!customerNameInput || !customerReview) return;

    const newReview: CustomerReview = {
      id: Date.now().toString(),
      name: customerNameInput,
      rating: customerRating,
      review: customerReview,
      photo: customerPhoto,
      createdAt: new Date().toLocaleDateString(),
    };

    setCustomerReviews([newReview, ...customerReviews]);
    setCustomerNameInput("");
    setCustomerRating(5);
    setCustomerReview("");
    setCustomerPhoto(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0806] text-white">
      {/* Page 1: Full Screen Hero Image, 8 Named Badges & Extra Icon-Only Floating Badges */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-500/10 via-black to-[#0A0806] min-h-[calc(100vh-64px)] flex flex-col items-center justify-between py-8 px-4 text-center">
        {/* Outer Icon-Only Floating Badges (No Text) */}
        <div className="hidden xl:block absolute left-8 top-12 animate-float-slow select-none z-20 pointer-events-none">
          <div className="rounded-2xl border border-orange-500/30 bg-black/80 p-3 text-3xl shadow-2xl backdrop-blur-md">
            🍿
          </div>
        </div>

        <div className="hidden xl:block absolute left-16 bottom-20 animate-float-reverse select-none z-20 pointer-events-none">
          <div className="rounded-2xl border border-orange-500/30 bg-black/80 p-3 text-3xl shadow-2xl backdrop-blur-md">
            🍩
          </div>
        </div>

        <div className="hidden xl:block absolute right-8 top-12 animate-float-reverse select-none z-20 pointer-events-none">
          <div className="rounded-2xl border border-orange-500/30 bg-black/80 p-3 text-3xl shadow-2xl backdrop-blur-md">
            🌮
          </div>
        </div>

        <div className="hidden xl:block absolute right-16 bottom-20 animate-float-slow select-none z-20 pointer-events-none">
          <div className="rounded-2xl border border-orange-500/30 bg-black/80 p-3 text-3xl shadow-2xl backdrop-blur-md">
            🌭
          </div>
        </div>

        <div className="hidden 2xl:block absolute left-24 top-1/2 -translate-y-1/2 animate-float-fast select-none z-20 pointer-events-none">
          <div className="rounded-2xl border border-orange-500/30 bg-black/80 p-3 text-3xl shadow-2xl backdrop-blur-md">
            🧋
          </div>
        </div>

        <div className="hidden 2xl:block absolute right-24 top-1/2 -translate-y-1/2 animate-float-fast select-none z-20 pointer-events-none">
          <div className="rounded-2xl border border-orange-500/30 bg-black/80 p-3 text-3xl shadow-2xl backdrop-blur-md">
            🍨
          </div>
        </div>

        <div className="w-full max-w-6xl my-auto relative z-10 flex items-center justify-center">
          {/* Centered Hero Logo Image with 4 floating badges on each side */}
          <div className="relative inline-block mx-auto">
            {/* Left 4 Attached Badges */}
            <div className="hidden lg:flex flex-col gap-6 absolute -left-40 xl:-left-52 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <div className="animate-float-slow flex items-center gap-2.5 rounded-2xl border border-orange-500/40 bg-black/90 px-3.5 py-2 shadow-2xl backdrop-blur-md">
                <span className="text-2xl">🍕</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-none">Cheese Pizza</p>
                  <p className="text-[10px] text-orange-400 font-semibold mt-0.5">Loaded 8 Inches</p>
                </div>
              </div>

              <div className="animate-float-reverse flex items-center gap-2.5 rounded-2xl border border-orange-500/40 bg-black/90 px-3.5 py-2 shadow-2xl backdrop-blur-md">
                <span className="text-2xl">🍔</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-none">Smokey Burgers</p>
                  <p className="text-[10px] text-orange-400 font-semibold mt-0.5">Juicy Patties</p>
                </div>
              </div>

              <div className="animate-float-fast flex items-center gap-2.5 rounded-2xl border border-orange-500/40 bg-black/90 px-3.5 py-2 shadow-2xl backdrop-blur-md">
                <span className="text-2xl">🍗</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-none">Crispy Chicken</p>
                  <p className="text-[10px] text-orange-400 font-semibold mt-0.5">Hot & Crunchy</p>
                </div>
              </div>

              <div className="animate-float-slow flex items-center gap-2.5 rounded-2xl border border-orange-500/40 bg-black/90 px-3.5 py-2 shadow-2xl backdrop-blur-md">
                <span className="text-2xl">☕</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-none">Masala Chai</p>
                  <p className="text-[10px] text-orange-400 font-semibold mt-0.5">Hyderabadi Special</p>
                </div>
              </div>
            </div>

            {/* Central Brand Image */}
            <img
              src="/logo/brand-image.jpeg"
              alt="NA KIRRAAK ADDA"
              className="w-full max-w-xs sm:max-w-md md:max-w-lg h-auto object-contain rounded-3xl border-2 border-orange-500/50 shadow-2xl shadow-orange-500/30 hover:scale-[1.02] transition transform duration-300"
            />

            {/* Right 4 Attached Badges */}
            <div className="hidden lg:flex flex-col gap-6 absolute -right-40 xl:-right-52 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <div className="animate-float-reverse flex items-center gap-2.5 rounded-2xl border border-orange-500/40 bg-black/90 px-3.5 py-2 shadow-2xl backdrop-blur-md">
                <span className="text-2xl">🥪</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-none">Grill Sandwich</p>
                  <p className="text-[10px] text-orange-400 font-semibold mt-0.5">Paneer & Cheese</p>
                </div>
              </div>

              <div className="animate-float-slow flex items-center gap-2.5 rounded-2xl border border-orange-500/40 bg-black/90 px-3.5 py-2 shadow-2xl backdrop-blur-md">
                <span className="text-2xl">🥤</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-none">Cold Beverages</p>
                  <p className="text-[10px] text-orange-400 font-semibold mt-0.5">Chilled Mojitos</p>
                </div>
              </div>

              <div className="animate-float-fast flex items-center gap-2.5 rounded-2xl border border-orange-500/40 bg-black/90 px-3.5 py-2 shadow-2xl backdrop-blur-md">
                <span className="text-2xl">🥟</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-none">Fried Momos</p>
                  <p className="text-[10px] text-orange-400 font-semibold mt-0.5">Schezwan Dip</p>
                </div>
              </div>

              <div className="animate-float-reverse flex items-center gap-2.5 rounded-2xl border border-orange-500/40 bg-black/90 px-3.5 py-2 shadow-2xl backdrop-blur-md">
                <span className="text-2xl">🍟</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-none">Peri Peri Fries</p>
                  <p className="text-[10px] text-orange-400 font-semibold mt-0.5">Crispy & Spicy</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Opening Hours & Total Organization Orders Delivered Banner */}
        <div className="z-20 my-4 flex flex-wrap items-center justify-center gap-3 rounded-full border border-orange-500/30 bg-black/80 px-6 py-2.5 shadow-2xl backdrop-blur-md max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-base">🕙</span>
            <span className="font-extrabold text-orange-400">OPENING HOURS</span>
            <span className="text-zinc-500">|</span>
            <span className="font-black text-white">3:00 PM – 12:00 AM</span>
            <span className="text-zinc-500 hidden sm:inline">|</span>
            <span className="text-zinc-400">Everyday</span>
          </div>

          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 rounded-full">
            🎉 {totalCompletedOrders}+ Orders Delivered by NA KIRRAAK ADDA
          </span>

          <Link
            href="/user/orders"
            className="flex items-center gap-1.5 rounded-full bg-[#FF6B00] px-4 py-1.5 text-xs font-extrabold text-black hover:bg-orange-400 transition shadow-lg shrink-0"
          >
            {loggedInUser ? (
              <><span>🛵</span> Track My Orders ({loggedInUser.name.split(" ")[0]})</>
            ) : (
              <><span>🛵</span> Track Order Live</>
            )}
          </Link>
        </div>

        {/* Scroll down indicator */}
        <a
          href="#explore-section"
          className="animate-bounce flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-5 py-2 text-xs font-extrabold text-orange-400 hover:bg-orange-500/20 transition mb-2 z-20"
        >
          <span>↓</span> Scroll for Kirrak Menu
        </a>
      </section>

      {/* Page 2: Next Section on Scroll */}
      <section id="explore-section" className="py-16 px-4 text-center bg-[#0A0806] border-t border-white/5">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-xs font-bold text-orange-400">
            <span>🔥</span> Authentic Hyderabadi Fast Food Adda
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Craving Kirrak Food? <br />
            <span className="text-orange-500">We Delivered Fast & Fresh.</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            From loaded cheese pizzas & juicy burgers to refreshing drinks and snacks — order directly from Uppal center!
          </p>

          {/* Image 1 Promo Banner Slider */}
          <div className="mt-8 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 shadow-2xl relative max-w-xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-2xl">{promoOffers[activeOfferSlide].icon}</span>
                <h3 className="text-lg font-bold text-white mt-1">{promoOffers[activeOfferSlide].title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{promoOffers[activeOfferSlide].subtitle}</p>
              </div>
              <span className="rounded-full bg-[#FF6B00] px-3 py-1 text-xs font-extrabold text-black shrink-0">
                ACTIVE
              </span>
            </div>
            {/* Pagination Dots matching Image 1 */}
            <div className="flex justify-center gap-1.5 mt-4">
              {promoOffers.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveOfferSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeOfferSlide === idx ? "w-6 bg-[#FF6B00]" : "w-2 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cart Drawer Float Button / Quick Cart */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setCheckoutOpen(true)}
            className="flex items-center gap-3 rounded-full bg-[#FF6B00] px-6 py-3 font-extrabold text-black shadow-2xl shadow-orange-500/40 hover:bg-orange-400 transition transform hover:scale-105"
          >
            <span>🛒 {cartItems.reduce((a, b) => a + b.qty, 0)} Items</span>
            <span className="border-l border-black/20 pl-3">₹{grandTotal.toFixed(0)}</span>
          </button>
        </div>
      )}

      {/* Customer Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#14100C] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Checkout</h3>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Cart Summary */}
            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Your Items</h4>
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm py-1 border-b border-white/5">
                  <div>
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-xs text-zinc-400">₹{item.price} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -1)} className="h-6 w-6 rounded bg-zinc-800 font-bold text-white text-xs hover:bg-zinc-700">-</button>
                    <span className="text-xs font-bold text-white">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="h-6 w-6 rounded bg-zinc-800 font-bold text-white text-xs hover:bg-zinc-700">+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon / Promo Code Input Box */}
            <div className="mt-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3 space-y-2">
              <label className="block text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                🎟️ Have a Coupon Code / Promo Offer?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter Code (e.g. KIRRAAK50)"
                  className="w-full rounded-xl border border-white/10 bg-black/80 px-3 py-2 text-xs text-white uppercase outline-none focus:border-orange-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                  className="rounded-xl bg-[#FF6B00] px-4 py-2 text-xs font-extrabold text-black hover:bg-orange-400 shrink-0 transition disabled:opacity-50"
                >
                  {couponLoading ? "Checking..." : "Apply"}
                </button>
              </div>
              {couponMsg && (
                <p className={`text-[11px] font-semibold ${couponMsg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
                  {couponMsg}
                </p>
              )}
            </div>

            {/* Price breakdown */}
            <div className="mt-4 space-y-1.5 text-xs text-zinc-300 pt-3 border-t border-white/10">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between"><span>GST (5%)</span><span>₹{gst.toFixed(0)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{deliveryCharge === 0 ? "FREE 🎉" : `₹${deliveryCharge}`}</span></div>
              <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-white/10"><span>Grand Total</span><span className="text-orange-400">₹{grandTotal.toFixed(0)}</span></div>
            </div>

            {/* User details form */}
            <form onSubmit={handleProceedToCheckoutSubmit} className="mt-5 space-y-3">
              {/* If Name and Phone are prefilled, display summary box instead of re-asking */}
              {customerName && phone && !showEditDetails ? (
                <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400">Order Contact Details</span>
                    <button
                      type="button"
                      onClick={() => setShowEditDetails(true)}
                      className="text-[11px] font-bold text-zinc-400 hover:text-white underline"
                    >
                      ✏️ Edit Info
                    </button>
                  </div>
                  <div className="text-xs text-white space-y-1">
                    <p>👤 <strong>Name:</strong> {customerName}</p>
                    <p>📱 <strong>Mobile:</strong> {phone}</p>
                    <p>📍 <strong>Area:</strong> {deliveryArea || "Uppal"}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-zinc-400">House Address / Landmark</label>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/30 transition shadow-sm"
                  >
                    <span>🗺️</span>
                    <span>Pin House on Live Map</span>
                  </button>
                </div>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 min-h-[60px]"
                  placeholder="Flat No., House Name, Street (or pin location on map above)"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPaymentMethod(opt)}
                      className={`py-2 rounded-xl text-[11px] font-bold border transition ${
                        paymentMethod === opt ? "border-orange-500 bg-orange-500/20 text-orange-400" : "border-white/10 bg-black/40 text-zinc-400"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-3 rounded-full bg-[#FF6B00] py-3 font-extrabold text-black hover:bg-orange-400 transition text-sm shadow-lg shadow-orange-500/20"
              >
                {paymentMethod === "Cash on Delivery"
                  ? `Place Order (COD) — ₹${grandTotal.toFixed(0)}`
                  : `Proceed to Pay & Place Order — ₹${grandTotal.toFixed(0)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Online UPI Pre-Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-orange-500/40 bg-[#16120E] p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400">Scan & Pay Before Order</p>
                <h3 className="text-xl font-black text-white">Complete Online Payment</h3>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Total Amount Badge */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <span className="text-xs text-zinc-300">Amount Payable</span>
              <p className="text-3xl font-black text-emerald-400 mt-0.5">₹{grandTotal.toFixed(0)}</p>
              {paymentMethod === "Bank Transfer" ? (
                <p className="text-[11px] text-zinc-300 mt-1">Direct Bank Deposit Details Below</p>
              ) : paymentMethod === "Card (Credit/Debit)" ? (
                <p className="text-[11px] text-zinc-300 mt-1">Secure Credit / Debit Card Gateway</p>
              ) : (
                <p className="text-[11px] text-zinc-400 mt-1">Store UPI: <strong className="text-orange-400 font-bold">{gatewaySettings.upiId || "9966533466@ybl"}</strong> (NA KIRRAAK ADDA)</p>
              )}
            </div>

            {paymentMethod === "Bank Transfer" ? (
              <div className="rounded-2xl border border-orange-500/40 bg-black/80 p-4 space-y-2 text-left">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">🏦 Bank Transfer Details</p>
                <div className="text-xs text-zinc-300 space-y-1 font-mono">
                  {gatewaySettings.bankDetails ? (
                    gatewaySettings.bankDetails.split("|").map((line: string, i: number) => (
                      <p key={i}>• {line.trim()}</p>
                    ))
                  ) : (
                    <>
                      <p>• Bank: State Bank of India</p>
                      <p>• A/C: 1234567890</p>
                      <p>• IFSC: SBIN0001234</p>
                      <p>• Name: NA KIRRAAK ADDA</p>
                    </>
                  )}
                </div>
              </div>
            ) : paymentMethod === "Card (Credit/Debit)" ? (
              <div className="rounded-2xl border border-orange-500/40 bg-black/80 p-4 space-y-3 text-left">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>💳</span> Enter Card Details
                </p>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardHolderInput}
                    onChange={(e) => setCardHolderInput(e.target.value)}
                    placeholder="Name on Card"
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">16-Digit Card Number</label>
                  <input
                    type="text"
                    maxLength={19}
                    value={cardNumberInput}
                    onChange={(e) => setCardNumberInput(e.target.value)}
                    placeholder="4532 •••• •••• 8912"
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono tracking-widest"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cardExpiryInput}
                      onChange={(e) => setCardExpiryInput(e.target.value)}
                      placeholder="08/28"
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">CVV / CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvvInput}
                      onChange={(e) => setCardCvvInput(e.target.value)}
                      placeholder="•••"
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono text-center"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Dynamic UPI QR Code Image */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-center shadow-2xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=${encodeURIComponent(gatewaySettings.upiId || "9966533466@ybl")}%26pn=NA%20KIRRAAK%20ADDA%26am=${grandTotal.toFixed(0)}%26cu=INR`}
                    alt="UPI Payment QR Code"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                  <p className="text-[11px] font-bold text-black mt-2">Scan with GPay, PhonePe, Paytm, or BHIM</p>
                </div>

                {/* Direct Pay Buttons for Mobile */}
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(gatewaySettings.upiId || "9966533466@ybl")}&pn=NA%20KIRRAAK%20ADDA&am=${grandTotal.toFixed(0)}&cu=INR`}
                    className="p-2.5 rounded-xl border border-white/10 bg-black/60 text-center text-xs font-bold text-white hover:border-orange-500"
                  >
                    📱 GPay / PhonePe
                  </a>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(gatewaySettings.upiId || "9966533466@ybl")}&pn=NA%20KIRRAAK%20ADDA&am=${grandTotal.toFixed(0)}&cu=INR`}
                    className="p-2.5 rounded-xl border border-white/10 bg-black/60 text-center text-xs font-bold text-white hover:border-orange-500"
                  >
                    📲 Paytm UPI
                  </a>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(gatewaySettings.upiId || "9966533466@ybl")}&pn=NA%20KIRRAAK%20ADDA&am=${grandTotal.toFixed(0)}&cu=INR`}
                    className="p-2.5 rounded-xl border border-white/10 bg-black/60 text-center text-xs font-bold text-white hover:border-orange-500"
                  >
                    💳 BHIM UPI
                  </a>
                </div>
              </>
            )}

            {/* Enter 12-digit UTR Ref Number */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <label className="block text-xs font-semibold text-zinc-300">
                Enter Payment Reference / UTR Number
              </label>
              <input
                type="text"
                value={upiUtrInput}
                onChange={(e) => setUpiUtrInput(e.target.value)}
                placeholder="e.g. 123456789012 (from receipt or bank reference)"
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-xs text-white outline-none focus:border-orange-500 font-mono"
              />
              <p className="text-[10px] text-zinc-400">Entering your UTR ensures instant payment verification by kitchen staff.</p>
            </div>

            <button
              onClick={placeOrder}
              className="w-full rounded-full bg-[#FF6B00] py-3 text-xs font-extrabold text-black hover:bg-orange-400 transition shadow-lg shadow-orange-500/20"
            >
              Confirm Payment & Submit Order — ₹{grandTotal.toFixed(0)}
            </button>
          </div>
        </div>
      )}

      {/* Main Customer Menu Section */}
      <main id="menu" className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Customer Interactive Menu Filter Bar */}
        <div className="rounded-3xl border border-white/10 bg-[#14100C] p-5 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>🍽️</span> Explore Adda Menu
            </h3>

            {/* Veg / Non-Veg Toggle Pills */}
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/60 p-1">
              <button
                onClick={() => setVegFilter("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition ${
                  vegFilter === "all" ? "bg-[#FF6B00] text-black shadow" : "text-zinc-400 hover:text-white"
                }`}
              >
                All Menu
              </button>
              <button
                onClick={() => setVegFilter("veg")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition ${
                  vegFilter === "veg" ? "bg-emerald-500 text-black shadow" : "text-emerald-400 hover:bg-emerald-500/10"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Pure Veg
              </button>
              <button
                onClick={() => setVegFilter("nonveg")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition ${
                  vegFilter === "nonveg" ? "bg-red-600 text-white shadow" : "text-red-400 hover:bg-red-600/10"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-red-600" /> Non-Veg
              </button>
            </div>
          </div>

          {/* Category Filter Horizontal Scroll Pills */}
          {availableCategories.length > 0 && (
            <div className="flex overflow-x-auto gap-2 pt-2 pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategoryFilter("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold shrink-0 border transition ${
                  selectedCategoryFilter === "all"
                    ? "border-orange-500 bg-orange-500/20 text-orange-300"
                    : "border-white/10 bg-black/40 text-zinc-400 hover:border-white/20"
                }`}
              >
                All Categories
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold shrink-0 border transition ${
                    selectedCategoryFilter.toLowerCase() === cat.toLowerCase()
                      ? "border-orange-500 bg-orange-500/20 text-orange-300"
                      : "border-white/10 bg-black/40 text-zinc-400 hover:border-white/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Top Bestsellers Section */}
        {bestsellersList.length > 0 && selectedCategoryFilter === "all" && vegFilter === "all" && (
          <MenuSection
            title="Kirrak Bestsellers"
            subtitle="Adda Favorites"
            items={bestsellersList}
            onAddToCart={addToCart}
          />
        )}

        {/* Dynamic Categories Render */}
        {groupedCategories.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-black/60 p-12 text-center text-zinc-400">
            <p className="text-4xl mb-3">🍽️</p>
            <h3 className="text-xl font-bold text-white mb-2">Loading Kirrak Menu...</h3>
            <p className="text-sm text-zinc-400">Please wait a moment while we fetch fresh menu items.</p>
          </div>
        ) : (
          groupedCategories.map(([categoryName, items]) => (
            <MenuSection
              key={categoryName}
              title={categoryName}
              subtitle="Fresh & Fast"
              items={items}
              onAddToCart={addToCart}
            />
          ))
        )}
      </main>

      {/* Bottom Section 1: Visit Our Location & Map */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-[#14100C] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-orange-400">Find Us</p>
              <h2 className="mt-2 text-3xl font-black text-white">Visit our location</h2>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                Stop by for a fresh slice or place a quick order for pickup and fast delivery across Uppal.
              </p>
              <div className="mt-6 space-y-3 text-xs text-zinc-300">
                <p className="flex items-start gap-2">
                  <span className="text-base">📍</span>
                  <span><strong>NA KIRRAAK ADDA</strong>, Venkateswara Colony, Vijayapuri Colony, Uppal, Hyderabad, Telangana 500039</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-base">📞</span>
                  <span>+91 9966533466</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-base">✉️</span>
                  <span>nakirraakadda2026@gmail.com</span>
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl h-[280px]">
              <iframe
                src="https://www.google.com/maps?q=NA%20KIRRAAK%20ADDA%20Uppal&output=embed"
                className="h-full w-full border-0"
                loading="lazy"
                title="Google Map for NA KIRRAAK ADDA"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section 2: Loved By Customers Reviews */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-[#14100C] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-orange-400">Reviews</p>
              <h2 className="mt-2 text-3xl font-black text-white">Loved by customers</h2>
            </div>
            <span className="rounded-full bg-orange-500/20 border border-orange-500/30 px-4 py-1.5 text-xs font-extrabold text-orange-400">
              ⭐ 4.9 / 5 Rated
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((rev, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-black/60 p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex text-orange-400 text-sm mb-3">⭐⭐⭐⭐⭐</div>
                  <p className="text-xs text-zinc-300 italic leading-relaxed font-normal">"{rev.text}"</p>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                  <div className="h-9 w-9 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center font-bold text-orange-400 text-xs">
                    {rev.name[0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-none">{rev.name}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Section 3: Share Your Experience Form */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-[#14100C] p-6 sm:p-8 shadow-2xl space-y-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-orange-400">Customer Reviews</p>
            <h2 className="mt-2 text-3xl font-black text-white">Share your experience</h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Form */}
            <form onSubmit={handleSubmitReview} className="space-y-4 rounded-2xl border border-white/10 bg-black/60 p-6">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Upload Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-300 outline-none file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#FF6B00] file:text-black hover:file:bg-orange-400"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Rating (1–5 stars)</label>
                <select
                  value={customerRating}
                  onChange={(e) => setCustomerRating(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                  <option value={3}>⭐⭐⭐ (3 Stars)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">One-line Review</label>
                <textarea
                  value={customerReview}
                  onChange={(e) => setCustomerReview(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500 min-h-[70px]"
                  placeholder="Share your favorite moment at NA KIRRAAK ADDA..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#FF6B00] py-3 text-xs font-extrabold text-black transition hover:bg-orange-400 shadow-lg shadow-orange-500/20"
              >
                Submit Review
              </button>
            </form>

            {/* Submitted reviews list */}
            <div className="space-y-4">
              {customerReviews.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-8 text-center text-zinc-400">
                  <p className="text-xs">No reviews submitted yet. Be the first to share your experience!</p>
                </div>
              ) : (
                customerReviews.map((rev) => (
                  <div key={rev.id} className="rounded-2xl border border-white/10 bg-black/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{rev.name}</h4>
                      <span className="text-xs text-orange-400">{"⭐".repeat(rev.rating)}</span>
                    </div>
                    <p className="text-xs text-zinc-300">{rev.review}</p>
                    {rev.photo && (
                      <img src={rev.photo} alt="Customer photo" className="h-20 w-auto rounded-xl object-cover mt-2 border border-white/10" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section 4: Contact Footer ("Order now for the ultimate bite") */}
      <footer className="border-t border-white/10 bg-black/90 py-12 px-4 mt-8">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-orange-400">Contact</p>
            <h2 className="mt-2 text-3xl font-black text-white">Order now for the ultimate bite</h2>
            <p className="mt-2 text-xs text-zinc-400 max-w-md mx-auto">
              Craving something hot and delicious? Reach out anytime for dine-in, pickup or fast delivery.
            </p>
          </div>

          <div className="flex justify-center gap-4 pt-2">
            <a
              href="tel:+919966533466"
              className="rounded-full bg-[#FF6B00] px-6 py-2.5 text-xs font-extrabold text-black hover:bg-orange-400 transition shadow-lg"
            >
              📞 Call Now
            </a>
            <a
              href="https://wa.me/919966533466?text=Hi%20NA%20KIRRAAK%20ADDA%2C%20I%20want%20to%20place%20an%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-emerald-500/50 bg-emerald-500/20 px-6 py-2.5 text-xs font-extrabold text-emerald-300 hover:bg-emerald-500/30 transition shadow-lg"
            >
              💬 WhatsApp Order
            </a>
          </div>

          <div className="space-y-1.5 text-xs text-zinc-300 pt-4 border-t border-white/10 max-w-md mx-auto">
            <p><strong>Restaurant Name:</strong> NA KIRRAAK ADDA</p>
            <p><strong>Address:</strong> Venkateswara Colony, Vijayapuri Colony, Uppal, Hyderabad, Telangana 500039</p>
            <p><strong>Phone 1:</strong> <a href="tel:9966533466" className="text-orange-400 hover:underline">9966533466</a></p>
            <p><strong>Phone 2:</strong> <a href="tel:8885422211" className="text-orange-400 hover:underline">8885422211</a></p>
            <p><strong>WhatsApp:</strong> <a href="https://wa.me/919966533466" className="text-emerald-400 hover:underline">Chat on WhatsApp</a></p>
            <p><strong>Google Maps:</strong> <a href="https://maps.google.com/?q=NA+KIRRAAK+ADDA+Uppal" target="_blank" className="text-orange-400 hover:underline">View Location</a></p>
            <p><strong>Instagram:</strong> <span className="text-orange-400">@nakirraakadda</span></p>
          </div>

          <p className="text-xs text-zinc-400 pt-6 border-t border-white/10">
            © 2026 <strong>NA KIRRAAK ADDA</strong>. All rights reserved. • Website Created by{" "}
            <a
              href="https://www.instagram.com/chandu_reddy_vlog?igsh=MXdoMXRmMWRxZm8zYw%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-orange-400 hover:underline"
            >
              Chandu Creations
            </a>{" "}
            &amp;{" "}
            <a
              href="https://nexzen.me"
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-orange-400 hover:underline"
            >
              Nexzen.me
            </a>
          </p>
        </div>
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

      {/* Interactive Leaflet + OpenStreetMap Live Location Pin Picker Modal */}
      <LocationPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onSelectAddress={(data) => setAddress(data.address)}
      />
      </footer>
    </div>
  );
}
