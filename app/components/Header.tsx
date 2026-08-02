"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Uppal, Hyderabad");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const userData = localStorage.getItem("user");
        const userObj = userData ? JSON.parse(userData) : null;
        const key = userObj && (userObj.id || userObj.username)
          ? `nakirraak_cart_${userObj.id || userObj.username}`
          : "nakirraak_cart_guest";
        const raw = localStorage.getItem(key);
        if (raw) {
          const items = JSON.parse(raw);
          if (Array.isArray(items)) {
            const totalQty = items.reduce((acc: number, item: any) => acc + (Number(item.qty) || 1), 0);
            setCartCount(totalQty);
            return;
          }
        }
        setCartCount(0);
      } catch (e) {
        setCartCount(0);
      }
    };

    updateCartCount();

    const handleCartEvent = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        const totalQty = e.detail.reduce((acc: number, item: any) => acc + (Number(item.qty) || 1), 0);
        setCartCount(totalQty);
      } else {
        updateCartCount();
      }
    };

    window.addEventListener("cart-updated", handleCartEvent);
    window.addEventListener("storage", updateCartCount);
    return () => {
      window.removeEventListener("cart-updated", handleCartEvent);
      window.removeEventListener("storage", updateCartCount);
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setShowUserDropdown(false);
    setMobileDrawerOpen(false);
    router.push("/");
  };

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
              const feeText = data.deliveryFee === 0 ? "FREE Delivery" : `₹${data.deliveryFee} Fee`;
              setSelectedLocation(`⚡ Live GPS (${data.distanceKm.toFixed(1)}km — ${feeText})`);
              setGpsActive(true);
              setLocationStatus(`Live Location Active: ${data.distanceKm.toFixed(1)} km from Uppal store ✓`);
              setTimeout(() => setLocationModalOpen(false), 1200);
            } else {
              setLocationStatus(`⚠️ You are ${data.distanceKm ? data.distanceKm.toFixed(1) : "3+"} km away from Uppal store (Out of Delivery Radius >3 km)`);
            }
          } catch (e) {
            setSelectedLocation(`⚡ Live GPS (Lat: ${latitude.toFixed(2)}, Lng: ${longitude.toFixed(2)})`);
            setGpsActive(true);
            setTimeout(() => setLocationModalOpen(false), 1000);
          }
        },
        () => {
          setLocationStatus("GPS permission denied by browser. Please pick your area below.");
        }
      );
    } else {
      setLocationStatus("GPS not supported by browser. Please pick your area below.");
    }
  };

  return (
    <>
      <header className="bg-black/90 border-b border-orange-500/30 backdrop-blur-md sticky top-0 z-50 px-3 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <img
              src="/logo/brand-image.jpeg"
              alt="NA KIRRAAK ADDA"
              className="h-9 sm:h-10 w-auto object-contain rounded-xl border border-orange-500/30 shadow-md group-hover:scale-105 transition"
            />
            <div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-none">NA KIRRAAK ADDA</h1>
              <p className="text-[9px] sm:text-[10px] text-orange-400 font-semibold tracking-wider uppercase mt-0.5">Uppal, Hyderabad</p>
            </div>
          </Link>

          {/* Desktop & Tablet Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-extrabold text-zinc-300">
            <Link
              href="/"
              className={`hover:text-orange-400 transition ${pathname === "/" ? "text-orange-400 border-b-2 border-orange-500 pb-0.5" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/dine-in"
              className={`hover:text-orange-400 transition flex items-center gap-1 ${pathname === "/dine-in" ? "text-orange-400 border-b-2 border-orange-500 pb-0.5" : ""}`}
            >
              <span>🍲</span>
              <span>Dine-In Menu</span>
            </Link>
            <Link
              href="/user/orders"
              className={`hover:text-orange-400 transition ${pathname.includes("/orders") ? "text-orange-400 border-b-2 border-orange-500 pb-0.5" : ""}`}
            >
              My Orders
            </Link>
          </nav>

          {/* Location Selector Button */}
          <button
            onClick={() => setLocationModalOpen(true)}
            className={`hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] sm:text-xs font-extrabold transition shadow truncate max-w-[150px] md:max-w-[220px] ${
              gpsActive
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                : "border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
            }`}
          >
            <span>{gpsActive ? "⚡" : "📍"}</span>
            <span className="truncate">{selectedLocation}</span>
            <span className="text-[9px]">▾</span>
          </button>

          {/* Action Buttons: Cart + Auth + Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Shopping Cart Button */}
            <button
              onClick={() => window.dispatchEvent(new Event("open-nakirraak-cart"))}
              className="relative flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/40 text-orange-400 px-3 py-1.5 rounded-full text-xs font-extrabold hover:bg-orange-500/20 transition shadow-md"
              title="View Shopping Cart"
            >
              <span>🛒</span>
              <span className="hidden sm:inline">Cart</span>
              <span className="bg-[#FF6B00] text-black text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {cartCount}
              </span>
            </button>

            {/* Desktop Auth Button */}
            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="bg-[#FF6B00] text-black px-3.5 py-1.5 rounded-full text-xs font-extrabold hover:bg-orange-400 transition"
                >
                  👤 {user.name} ▾
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#14100C] border border-orange-500/30 rounded-2xl shadow-2xl p-2 z-50 text-xs">
                    <Link
                      href="/user/profile"
                      className="block px-3 py-2 text-white hover:bg-orange-500/20 rounded-xl"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/user/orders"
                      className="block px-3 py-2 text-white hover:bg-orange-500/20 rounded-xl"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      My Orders
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin/dashboard"
                        className="block px-3 py-2 text-orange-400 font-bold hover:bg-orange-500/20 rounded-xl"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        ⚙️ Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex gap-2">
                <Link
                  href="/auth/login"
                  className="bg-[#FF6B00] text-black px-4 py-1.5 rounded-full text-xs font-extrabold hover:bg-orange-400 transition"
                >
                  Login
                </Link>
              </div>
            )}

            {/* Mobile / Tablet Hamburger Toggle */}
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="md:hidden flex items-center justify-center p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition"
              aria-label="Toggle Navigation Menu"
            >
              <span className="text-lg font-bold">{mobileDrawerOpen ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sliding Drawer Navigation */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md md:hidden flex flex-col justify-between p-5 space-y-6 overflow-y-auto">
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-orange-500/30 pb-4">
              <div className="flex items-center gap-2">
                <img src="/logo/brand-image.jpeg" alt="Logo" className="h-8 w-auto rounded-lg" />
                <span className="font-black text-white text-base">NA KIRRAAK ADDA</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="text-zinc-400 hover:text-white font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Location Picker Pill for Mobile */}
            <button
              onClick={() => {
                setMobileDrawerOpen(false);
                setLocationModalOpen(true);
              }}
              className="w-full flex items-center justify-between rounded-xl border border-orange-500/40 bg-orange-500/10 p-3 text-xs font-extrabold text-orange-400"
            >
              <div className="flex items-center gap-2 truncate">
                <span>📍</span>
                <span className="truncate">{selectedLocation}</span>
              </div>
              <span className="text-amber-400">Change ✏️</span>
            </button>

            {/* Navigation Links */}
            <div className="space-y-2">
              <Link
                href="/"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white font-bold text-sm hover:border-orange-500/50"
              >
                <span>🏠</span> Home
              </Link>
              <Link
                href="/dine-in"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-amber-400 font-bold text-sm hover:border-orange-500/50"
              >
                <span>🍲</span> Dine-In Digital Menu
              </Link>
              <Link
                href="/user/orders"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white font-bold text-sm hover:border-orange-500/50"
              >
                <span>📦</span> My Orders
              </Link>
              {user && (
                <Link
                  href="/user/profile"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white font-bold text-sm hover:border-orange-500/50"
                >
                  <span>👤</span> My Profile ({user.name})
                </Link>
              )}
              {user && user.role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-sm"
                >
                  <span>⚙️</span> Admin Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Drawer Auth Actions */}
          <div className="pt-4 border-t border-zinc-800 space-y-3">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-extrabold text-sm"
              >
                Logout Account
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="py-3 text-center rounded-xl bg-[#FF6B00] text-black font-extrabold text-xs"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="py-3 text-center rounded-xl border border-orange-500/40 text-orange-400 font-extrabold text-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delivery Location Modal */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#14100C] p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📍</span> Delivery & Live Location
              </h3>
              <button
                onClick={() => setLocationModalOpen(false)}
                className="text-zinc-400 hover:text-white font-bold text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Activate Live GPS to verify exact distance from our Uppal kitchen store (Free delivery within 1 km, delivery zone up to 3 km).
            </p>

            <button
              onClick={detectGPSLocation}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/50 bg-emerald-500/20 py-3 text-xs font-extrabold text-emerald-300 hover:bg-emerald-500/30 transition shadow-lg"
            >
              <span>⚡</span> Activate Live GPS Location
            </button>

            {locationStatus && (
              <p
                className={`text-xs text-center font-bold p-3 rounded-xl border transition ${
                  locationStatus.includes("Out of") || locationStatus.includes("away") || locationStatus.includes("denied")
                    ? "text-red-400 bg-red-500/15 border-red-500/40 shadow-lg shadow-red-500/10"
                    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                }`}
              >
                {locationStatus}
              </p>
            )}

            <div className="pt-2">
              <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Or Select Delivery Area</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {[
                  "Uppal",
                  "Ramanthapur",
                  "Nagole",
                  "Habsiguda",
                  "Boduppal",
                  "Nacharam",
                  "Tarnaka",
                  "Chiluka Nagar",
                  "Alkapuri X Roads",
                  "Sai Nagar",
                ].map((area) => (
                  <button
                    key={area}
                    onClick={() => {
                      setSelectedLocation(`${area}, Hyderabad`);
                      setGpsActive(false);
                      setLocationModalOpen(false);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition text-left ${
                      selectedLocation.includes(area)
                        ? "border-orange-500 bg-orange-500/20 text-orange-300"
                        : "border-white/10 bg-black/40 text-zinc-300 hover:border-white/20"
                    }`}
                  >
                    📍 {area}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
