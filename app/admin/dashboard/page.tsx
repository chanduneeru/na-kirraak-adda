"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateQRCodeSVG } from "@/lib/qr-generator";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string | null;
  isVeg?: boolean;
  isBestseller?: boolean;
  isActive?: boolean;
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  total: number;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [adminName, setAdminName] = useState("Admin");
  const [adminRole, setAdminRole] = useState("Super Admin");
  const [isSuperAdmin, setIsSuperAdmin] = useState(true);
  const [permissions, setPermissions] = useState({
    canEditMenu: true,
    canManageOrders: true,
    canManageRoles: true,
    canViewAnalytics: true,
  });

  const [activeTab, setActiveTab] = useState<"products" | "orders" | "dinein" | "settings">("products");
  const [settingsSubTab, setSettingsSubTab] = useState<"categories" | "sound" | "paytm" | "employees" | "delivery" | "offers" | "email">("categories");
  const [copiedMasterUrl, setCopiedMasterUrl] = useState(false);

  // Dine-In & Table State
  const [dineInConfig, setDineInConfig] = useState({
    tableCount: 20,
    dineInGstRate: 0,
    dineInServiceCharge: 0,
    enableDineInCod: false,
    dineInUpiId: "",
  });
  const [tablesStatus, setTablesStatus] = useState<any[]>([]);
  const [dineInSaveMsg, setDineInSaveMsg] = useState("");
  const [orderFilter, setOrderFilter] = useState<"all" | "dine_in" | "online" | "unconfirmed">("all");
  const [selectedOrderModal, setSelectedOrderModal] = useState<any | null>(null);

  const loadDineInConfig = async () => {
    try {
      const res = await fetch("/api/dine-in/tables");
      const data = await res.json();
      if (data.success) {
        setDineInConfig(data.config || {});
        setTablesStatus(data.tables || []);
      }
    } catch (e) {}
  };

  const handleSaveDineInConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setDineInSaveMsg("");
    try {
      const res = await fetch("/api/dine-in/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dineInConfig),
      });
      const data = await res.json();
      if (data.success) {
        setDineInSaveMsg("Dine-In settings updated successfully! 🎉");
        loadDineInConfig();
      }
    } catch (e) {
      setDineInSaveMsg("Failed to save Dine-In settings.");
    }
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Offers & Coupon Banner state
  const [offers, setOffers] = useState<any[]>([]);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState<any>({
    id: "",
    code: "",
    title: "",
    subtitle: "",
    discountType: "flat",
    discountValue: "50",
    minOrderValue: "299",
    icon: "🔥",
    isActive: true,
    oneTimePerUser: true,
  });

  // Category Management state
  const [categories, setCategories] = useState<string[]>([]);
  const [newCatInput, setNewCatInput] = useState("");
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [editCatInput, setEditCatInput] = useState("");

  // Custom Sound state
  const [soundType, setSoundType] = useState<"siren" | "bell" | "beep" | "custom">("siren");
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);

  // Paytm & Payment Gateway Config state
  const [paytmConfig, setPaytmConfig] = useState<any>({
    merchantId: "",
    merchantKey: "",
    website: "DEFAULT",
    upiId: "9966533466@ybl",
    isActive: false,
    enableUpi: true,
    enableBank: true,
    enableCod: true,
    bankDetails: "State Bank of India | A/C: 1234567890 | IFSC: SBIN0001234 | Name: NA KIRRAAK ADDA",
  });
  const [paytmSaveMsg, setPaytmSaveMsg] = useState("");

  // Employee Staff Management state
  const [employees, setEmployees] = useState<any[]>([]);
  const [empForm, setEmpForm] = useState({
    name: "",
    role: "Kitchen Staff",
    phone: "",
    passcode: "",
  });

  // Daily Dashboard Metrics Manual Override state
  const [showDailyEditor, setShowDailyEditor] = useState(false);
  const [dailyOffsets, setDailyOffsets] = useState({
    totalOrdersOffset: 0,
    completedOrdersOffset: 0,
    cancelledOrdersOffset: 0,
    revenueOffset: 0,
  });

  // Roles & Permissions state
  const [roles, setRoles] = useState<any[]>([]);
  const [roleForm, setRoleForm] = useState({
    name: "",
    canEditMenu: false,
    canManageOrders: true,
    canManageRoles: false,
    canViewAnalytics: false,
  });

  // Delivery Config state
  const [deliveryConfig, setDeliveryConfig] = useState<{
    storeLocation: { lat: number; lng: number; address: string };
    freeRadiusKm: number;
    chargeableRadiusStartKm: number;
    chargeableRadiusEndKm: number;
    gstRate: number;
    packagingFee: number;
    minOrderValue: number;
    deliveryFees: Record<string, number>;
  }>({
    storeLocation: { lat: 17.3998, lng: 78.5630, address: "NA KIRRAAK ADDA, Uppal, Hyderabad" },
    freeRadiusKm: 1,
    chargeableRadiusStartKm: 1,
    chargeableRadiusEndKm: 3,
    gstRate: 18,
    packagingFee: 20,
    minOrderValue: 100,
    deliveryFees: { "1-1.5": 40, "1.5-2": 50, "2-3": 60 },
  });
  const [deliverySaveMsg, setDeliverySaveMsg] = useState("");
  const [mapLinkInput, setMapLinkInput] = useState("");

  // Payment Verification & Live Chat States
  const [activeChatOrder, setActiveChatOrder] = useState<any>(null);
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [declineModalOrder, setDeclineModalOrder] = useState<any>(null);
  const [declineReasonInput, setDeclineReasonInput] = useState<string>("");
  const [adminChatMessage, setAdminChatMessage] = useState<string>("");

  const handleVerifyPayment = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_payment" }),
      });
      const data = await res.json();
      if (data.success) {
        loadOrders();
        if (activeChatOrder && activeChatOrder.id === orderId) {
          fetchOrderChat(orderId);
        }
      }
    } catch (e) {}
  };

  const handleDeclinePaymentSubmit = async () => {
    if (!declineModalOrder) return;
    try {
      const res = await fetch(`/api/orders/${declineModalOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline_payment", reason: declineReasonInput || "Incorrect payment amount or unclear screenshot" }),
      });
      const data = await res.json();
      if (data.success) {
        setDeclineModalOrder(null);
        setDeclineReasonInput("");
        loadOrders();
      }
    } catch (e) {}
  };

  const handleSendAdminChat = async (orderId: string) => {
    if (!adminChatMessage.trim()) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_chat_message", sender: "admin", text: adminChatMessage.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminChatMessage("");
        fetchOrderChat(orderId);
        loadOrders();
      }
    } catch (e) {}
  };

  const fetchOrderChat = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.order) {
        setActiveChatOrder(data.order);
      }
    } catch (e) {}
  };

  function parseLocationInput(input: string): { lat: number; lng: number } | null {
    if (!input || !input.trim()) return null;
    const str = input.trim();

    // 1. Direct decimal coordinates e.g. "17.3998, 78.5630"
    const decMatch = str.match(/(-?\d+\.\d+)\s*[\s,]\s*(-?\d+\.\d+)/);
    if (decMatch) {
      const lat = parseFloat(decMatch[1]);
      const lng = parseFloat(decMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    // 2. Google Maps URL with @lat,lng
    const urlAtMatch = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (urlAtMatch) {
      const lat = parseFloat(urlAtMatch[1]);
      const lng = parseFloat(urlAtMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    // 3. Google Maps q=lat,lng or ll=lat,lng
    const qMatch = str.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      const lat = parseFloat(qMatch[1]);
      const lng = parseFloat(qMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    // 4. DMS Integer format like 172359.4 and 783346.8
    const dmsIntMatch = str.match(/^(\d{2})(\d{2})(\d{2}(?:\.\d+)?)\s*[\s,]\s*(\d{2,3})(\d{2})(\d{2}(?:\.\d+)?)$/);
    if (dmsIntMatch) {
      const lat = parseInt(dmsIntMatch[1]) + parseInt(dmsIntMatch[2]) / 60 + parseFloat(dmsIntMatch[3]) / 3600;
      const lng = parseInt(dmsIntMatch[4]) + parseInt(dmsIntMatch[5]) / 60 + parseFloat(dmsIntMatch[6]) / 3600;
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }

    return null;
  }

  function convertDmsToDecimal(val: number): number {
    if (!val || Math.abs(val) <= 180) return val;
    const s = Math.abs(val).toString();
    if (s.length >= 6) {
      const deg = parseInt(s.slice(0, s.length >= 7 ? 3 : 2));
      const min = parseInt(s.slice(s.length >= 7 ? 3 : 2, s.length >= 7 ? 5 : 4));
      const sec = parseFloat(s.slice(s.length >= 7 ? 5 : 4)) || 0;
      const dec = deg + min / 60 + sec / 3600;
      return Number((val < 0 ? -dec : dec).toFixed(6));
    }
    return val;
  }

  // Form states matching Image 3
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Veg Pizza",
    image: "",
    isVeg: true,
    isBestseller: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Audio alarm player for new unconfirmed orders (Default: zomato_sms.mp3)
  const playAlertSound = () => {
    try {
      const targetSound = customAudioUrl || "/sound/zomato_sms.mp3";
      const audio = new Audio(targetSound);
      audio.play().catch(() => {
        // Fallback tone if browser restricts autoplay before user interaction
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch (e2) {}
      });
    } catch (e) {}
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data);
      }
    } catch (e) {
      console.error("Error loading categories:", e);
    }
  };

  const loadPaytmConfig = async () => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getPaytmConfig" }),
      });
      if (res.ok) {
        const data = await res.json();
        setPaytmConfig(data);
      }
    } catch (e) {}
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getEmployees" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setEmployees(data);
      }
    } catch (e) {}
  };

  const loadRoles = async () => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getRoles" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setRoles(data);
      }
    } catch (e) {}
  };

  const [emailForm, setEmailForm] = useState({
    adminEmail: "nakirraakadda2026@gmail.com",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "nakirraakadda2026@gmail.com",
    smtpPass: "",
    senderName: "NA KIRRAAK ADDA",
  });
  const [emailMsg, setEmailMsg] = useState("");

  const loadEmailConfig = async () => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getEmailConfig" }),
      });
      if (res.ok) {
        const config = await res.json();
        if (config && !config.error) setEmailForm(config);
      }
    } catch (e) {}
  };

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg("");
    const savedToken = localStorage.getItem("adminToken");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveEmailConfig",
          token: savedToken,
          emailData: emailForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailForm(data.config);
        setEmailMsg("✓ Admin Email & Mail Server Settings saved successfully!");
      }
    } catch (e) {
      setEmailMsg("Error saving email configuration.");
    }
  };

  const loadOffers = async () => {
    try {
      const savedToken = localStorage.getItem("adminToken");
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getAdminOffers", token: savedToken }),
      });
      if (res.status === 401) {
        localStorage.removeItem("adminToken");
        router.push("/admin/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setOffers(data);
      }
    } catch (e) {}
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.code || !offerForm.title) return;
    const savedToken = localStorage.getItem("adminToken");
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveOffer",
          token: savedToken,
          ...offerForm,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOffers(updated);
        setEditingOfferId(null);
        setOfferForm({
          id: "",
          code: "",
          title: "",
          subtitle: "",
          discountType: "flat",
          discountValue: "50",
          minOrderValue: "299",
          icon: "🔥",
          isActive: true,
          oneTimePerUser: true,
        });
      }
    } catch (e) {}
  };

  const handleToggleOffer = async (id: string) => {
    const savedToken = localStorage.getItem("adminToken");
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleOffer", token: savedToken, id }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOffers(updated);
      }
    } catch (e) {}
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer banner?")) return;
    const savedToken = localStorage.getItem("adminToken");
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteOffer", token: savedToken, id }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOffers(updated);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("adminToken");
    const savedName = localStorage.getItem("adminName");
    const savedRole = localStorage.getItem("adminRole");
    const savedPerms = localStorage.getItem("adminPermissions");
    const savedSuper = localStorage.getItem("isSuperAdmin");

    if (!savedToken) {
      router.push("/admin/login");
      return;
    }

    setToken(savedToken);
    if (savedName) setAdminName(savedName);
    if (savedRole) setAdminRole(savedRole);
    if (savedSuper !== null) setIsSuperAdmin(savedSuper === "true");

    let userPerms = {
      canEditMenu: true,
      canManageOrders: true,
      canManageRoles: true,
      canViewAnalytics: true,
    };

    if (savedPerms) {
      try {
        userPerms = JSON.parse(savedPerms);
        setPermissions(userPerms);
      } catch (e) {}
    }

    // Set default active tab based on employee restrictions
    if (savedSuper !== "true") {
      if (!userPerms.canEditMenu && userPerms.canManageOrders) {
        setActiveTab("orders");
      } else if (!userPerms.canEditMenu && !userPerms.canManageOrders && (userPerms.canManageRoles || userPerms.canEditMenu)) {
        setActiveTab("settings");
      }
    }

    // Verify token with backend for real-time permissions check
    fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", token: savedToken }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.admin) {
          if (data.admin.name) setAdminName(data.admin.name);
          if (data.admin.role) setAdminRole(data.admin.role);
          if (data.admin.isSuperAdmin !== undefined) setIsSuperAdmin(Boolean(data.admin.isSuperAdmin));
          if (data.admin.permissions) {
            setPermissions(data.admin.permissions);
            if (!data.admin.isSuperAdmin && !data.admin.permissions.canEditMenu && data.admin.permissions.canManageOrders) {
              setActiveTab("orders");
            }
          }
        }
      })
      .catch(() => {});

    loadProducts();
    loadOrders();
    loadDeliveryConfig();
    loadCategories();
    loadPaytmConfig();
    loadEmployees();
    loadRoles();
    loadOffers();
    loadEmailConfig();

    // Auto-poll orders every 3 seconds for immediate notifications
    const pollTimer = setInterval(loadOrders, 3000);
    return () => clearInterval(pollTimer);
  }, [router]);

  const exportOrdersToExcel = () => {
    if (orders.length === 0) {
      return;
    }

    const headers = [
      "Order ID",
      "Customer Name",
      "Phone Number",
      "Delivery Address",
      "Ordered Items",
      "Subtotal (₹)",
      "GST (₹)",
      "Delivery Charge (₹)",
      "Grand Total (₹)",
      "Payment Method",
      "Order Status",
      "Assigned Staff",
      "Date & Time",
    ];

    const rows = orders.map((o: any) => {
      let itemsText = "";
      try {
        const parsedItems = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
        if (Array.isArray(parsedItems)) {
          itemsText = parsedItems.map((i: any) => `${i.name} x${i.qty}`).join(" | ");
        }
      } catch (e) {
        itemsText = String(o.items || "");
      }

      const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString("en-IN") : "";

      return [
        `"${o.id || ""}"`,
        `"${(o.customerName || "").replace(/"/g, '""')}"`,
        `"${(o.phone || "").replace(/"/g, '""')}"`,
        `"${(o.address || "").replace(/"/g, '""')}"`,
        `"${itemsText.replace(/"/g, '""')}"`,
        o.subtotal || 0,
        o.gst || 0,
        o.deliveryCharge || 0,
        o.total || 0,
        `"${(o.paymentMethod || "").replace(/"/g, '""')}"`,
        `"${(o.status || "").replace(/"/g, '""')}"`,
        `"${(o.assignedStaff || "Unassigned").replace(/"/g, '""')}"`,
        `"${dateStr}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `NA_KIRRAAK_ADDA_Orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addRole", token, roleData: roleForm }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
        setRoleForm({
          name: "",
          canEditMenu: false,
          canManageOrders: true,
          canManageRoles: false,
          canViewAnalytics: false,
        });
      }
    } catch (e) {}
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Role / Designation?")) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteRole", token, roleId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch (e) {}
  };

  const handleSavePaytmConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaytmSaveMsg("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "savePaytmConfig", token, paytmData: paytmConfig }),
      });
      if (res.ok) {
        setPaytmSaveMsg("Paytm Business credentials updated successfully! 🎉");
      }
    } catch (e) {
      setPaytmSaveMsg("Error saving Paytm credentials.");
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.name || !empForm.phone) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createEmployee", token, employeeData: empForm }),
      });
      if (res.ok) {
        setEmpForm({ name: "", role: "Kitchen Chef", phone: "", passcode: "" });
        loadEmployees();
      }
    } catch (e) {}
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteEmployee", token, employeeId: id }),
      });
      if (res.ok) {
        loadEmployees();
      }
    } catch (e) {}
  };

  const handleAssignStaff = async (orderId: string, staffName: string) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assignStaff", token, orderId, staffName }),
      });
      if (res.ok) {
        loadOrders();
      }
    } catch (e) {}
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatInput.trim() }),
      });
      if (res.ok) {
        setNewCatInput("");
        loadCategories();
      }
    } catch (e) {}
  };

  const handleEditCategory = async (oldName: string) => {
    if (!editCatInput.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName: editCatInput.trim() }),
      });
      if (res.ok) {
        setEditingCatName(null);
        setEditCatInput("");
        loadCategories();
        loadProducts();
      }
    } catch (e) {}
  };

  const handleDeleteCategory = async (name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      const res = await fetch(`/api/categories?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadCategories();
        loadProducts();
      }
    } catch (e) {}
  };

  // Continuously trigger alert sound if any unconfirmed order exists
  const unconfirmedOrders = (Array.isArray(orders) ? orders : []).filter((o) => o && o.status && o.status.toLowerCase().includes("received"));

  useEffect(() => {
    if (unconfirmedOrders.length > 0) {
      playAlertSound();
    }
  }, [orders]);

  const loadDeliveryConfig = async () => {
    try {
      const res = await fetch("/api/delivery/config");
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) setDeliveryConfig(data);
      }
    } catch (e) {
      console.error("Error loading delivery config:", e);
    }
  };

  const handleSaveDeliveryConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDeliverySaveMsg("");
    try {
      const savedToken = localStorage.getItem("adminToken");
      const res = await fetch("/api/delivery/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify(deliveryConfig),
      });
      if (res.ok) {
        setDeliverySaveMsg("Delivery settings updated successfully! 🎉");
      } else {
        const err = await res.json();
        setDeliverySaveMsg(`Error: ${err.error || "Failed to update settings"}`);
      }
    } catch (e) {
      setDeliverySaveMsg("Error connecting to server");
    }
    setLoading(false);
  };

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products?includeDisabled=true");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setProducts(data);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstOrderLoadRef = useRef<boolean>(true);
  const [kitchenSoundEnabled, setKitchenSoundEnabled] = useState<boolean>(true);

  const playOrderChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Two-tone cheerful restaurant kitchen bell chime (E5 -> A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.setValueAtTime(880, now + 0.15);

      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.8);
    } catch (e) {}
  };

  const loadOrders = async () => {
    const savedToken = localStorage.getItem("adminToken");
    if (!savedToken) return;

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getOrders", token: savedToken }),
      });
      if (response.status === 401) {
        localStorage.removeItem("adminToken");
        router.push("/admin/login");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setOrders(data);

          // Trigger Kitchen Alert Sound when a new order arrives
          const currentIds = new Set(data.map((o: any) => o.id));
          if (!isFirstOrderLoadRef.current && kitchenSoundEnabled) {
            let hasNewOrder = false;
            currentIds.forEach((id) => {
              if (!prevOrderIdsRef.current.has(id)) {
                hasNewOrder = true;
              }
            });
            if (hasNewOrder) {
              playOrderChimeSound();
            }
          }
          prevOrderIdsRef.current = currentIds;
          isFirstOrderLoadRef.current = false;
        }
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { id: editingId, ...formData, price: parseFloat(formData.price) }
        : { ...formData, price: parseFloat(formData.price) };

      const response = await fetch("/api/products", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setFormData({
          name: "",
          description: "",
          price: "",
          category: "Veg Pizza",
          image: "",
          isVeg: true,
          isBestseller: false,
        });
        setEditingId(null);
        loadProducts();
      }
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProductStatus = async (product: Product) => {
    try {
      await fetch("/api/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: product.id,
          isActive: !product.isActive,
        }),
      });
      loadProducts();
    } catch (error) {
      console.error("Error toggling product status:", error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image: product.image || "",
      isVeg: product.isVeg ?? true,
      isBestseller: product.isBestseller ?? false,
    });
    setEditingId(product.id);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadProducts();
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateOrderStatus",
          token,
          orderId,
          status,
        }),
      });

      if (response.ok) {
        loadOrders();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#0D0A08] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">NA KIRRAAK ADDA</h1>
              <p className="text-xs text-orange-400 font-extrabold mt-0.5">👤 {adminName} <span className="text-zinc-400">({adminRole})</span></p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Unconfirmed Orders Sound Alert Banner */}
      {unconfirmedOrders.length > 0 && (
        <div className="bg-[#FF6B00] text-black px-6 py-3 font-extrabold flex items-center justify-between shadow-2xl animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔔</span>
            <span className="text-sm">
              ATTENTION: {unconfirmedOrders.length} NEW UNCONFIRMED ORDER({unconfirmedOrders.length > 1 ? "S" : ""}) RECEIVED! (Playing Sound Alert)
            </span>
          </div>
          <button
            onClick={() => {
              setActiveTab("orders");
              setOrderFilter("unconfirmed");
              setTimeout(() => {
                document.getElementById("orders-queue-container")?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            className="rounded-full bg-black text-white px-4 py-1 text-xs font-bold hover:bg-zinc-800 transition shadow-lg cursor-pointer"
          >
            View Orders Now →
          </button>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Admin Order & Sales Analytics Metric Bar + Download Excel Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>📊</span> Business Overview & Analytics
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {(isSuperAdmin || permissions.canViewAnalytics) && (
              <button
                onClick={() => setShowDailyEditor(!showDailyEditor)}
                className="flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-xs font-bold text-orange-400 hover:bg-orange-500/20 transition"
              >
                <span>✏️</span> Daily Dashboard Edit
              </button>
            )}
            <button
              onClick={exportOrdersToExcel}
              className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-xs font-black text-black hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
            >
              <span>📥</span> Download Orders Excel (.xlsx / .csv)
            </button>
          </div>
        </div>

        {/* Daily Dashboard Manual Override Form Modal */}
        {showDailyEditor && (isSuperAdmin || permissions.canViewAnalytics) && (
          <div className="mb-6 rounded-2xl border border-orange-500/30 bg-[#19140F] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>✏️</span> Daily Metric Manual Override / Starting Offsets
              </h3>
              <button onClick={() => setShowDailyEditor(false)} className="text-xs text-zinc-500 hover:text-white">✕ Close</button>
            </div>
            <p className="text-xs text-zinc-400">
              Admin can edit or add custom starting figures daily for Total Orders, Completed Orders, Cancelled Orders, and Sales Revenue!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Total Orders Offset</label>
                <input
                  type="number"
                  value={dailyOffsets.totalOrdersOffset}
                  onChange={(e) => setDailyOffsets({ ...dailyOffsets, totalOrdersOffset: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Completed Orders Offset</label>
                <input
                  type="number"
                  value={dailyOffsets.completedOrdersOffset}
                  onChange={(e) => setDailyOffsets({ ...dailyOffsets, completedOrdersOffset: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Cancelled Orders Offset</label>
                <input
                  type="number"
                  value={dailyOffsets.cancelledOrdersOffset}
                  onChange={(e) => setDailyOffsets({ ...dailyOffsets, cancelledOrdersOffset: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Sales Revenue Offset (₹)</label>
                <input
                  type="number"
                  value={dailyOffsets.revenueOffset}
                  onChange={(e) => setDailyOffsets({ ...dailyOffsets, revenueOffset: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.setItem("adminDailyOffsets", JSON.stringify(dailyOffsets));
                setShowDailyEditor(false);
              }}
              className="rounded-full bg-[#FF6B00] px-5 py-2 text-xs font-bold text-black hover:bg-orange-400 transition"
            >
              ✓ Save Daily Offsets
            </button>
          </div>
        )}

        <div className={`grid gap-4 mb-8 ${isSuperAdmin || permissions.canViewAnalytics ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
          <div className="rounded-2xl border border-white/10 bg-[#16120E] p-4 text-center space-y-1 shadow-xl">
            <span className="text-xl">📦</span>
            <p className="text-2xl font-black text-white">{orders.length + dailyOffsets.totalOrdersOffset}</p>
            <p className="text-[11px] font-extrabold uppercase text-zinc-400">Total Orders</p>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-1 shadow-xl">
            <span className="text-xl">✅</span>
            <p className="text-2xl font-black text-emerald-300">
              {orders.filter((o) => o.status.toLowerCase().includes("complete") || o.status.toLowerCase().includes("deliver")).length + dailyOffsets.completedOrdersOffset}
            </p>
            <p className="text-[11px] font-extrabold uppercase text-emerald-400">Completed Orders</p>
          </div>

          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center space-y-1 shadow-xl">
            <span className="text-xl">❌</span>
            <p className="text-2xl font-black text-red-400">
              {orders.filter((o) => o.status.toLowerCase().includes("cancel")).length + dailyOffsets.cancelledOrdersOffset}
            </p>
            <p className="text-[11px] font-extrabold uppercase text-red-400">Cancelled Orders</p>
          </div>

          {(isSuperAdmin || permissions.canViewAnalytics) && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-1 shadow-xl">
              <span className="text-xl">💰</span>
              <p className="text-2xl font-black text-emerald-400">
                ₹{(orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0) + dailyOffsets.revenueOffset).toFixed(0)}
              </p>
              <p className="text-[11px] font-extrabold uppercase text-emerald-300">Total Sales (Revenue)</p>
            </div>
          )}
        </div>

        {/* Clean Main Navigation Tabs */}
        <div className="mb-8 flex flex-wrap border-b border-white/10 gap-3 pb-1">
          {(isSuperAdmin || permissions.canEditMenu) && (
            <button
              onClick={() => setActiveTab("products")}
              className={`px-6 py-3 text-sm font-extrabold border-b-2 transition flex items-center gap-2 ${
                activeTab === "products"
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <span>🍕</span> Product Management
            </button>
          )}

          {(isSuperAdmin || permissions.canManageOrders) && (
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-3 text-sm font-extrabold border-b-2 transition flex items-center gap-2 ${
                activeTab === "orders"
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <span>📦</span> Order Management
            </button>
          )}

          {(isSuperAdmin || permissions.canEditMenu || permissions.canManageRoles) && (
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-6 py-3 text-sm font-extrabold border-b-2 transition flex items-center gap-2 ${
                activeTab === "settings"
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <span>⚙️</span> Settings & Administration
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab("dinein");
              loadDineInConfig();
            }}
            className={`px-6 py-3 text-sm font-extrabold border-b-2 transition flex items-center gap-2 ${
              activeTab === "dinein"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <span>🍽️</span> Dine-In & Tables
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Add product form matching Image 3 */}
            <div className="rounded-[1.75rem] border border-white/10 bg-[#16120E] p-6 lg:p-8 space-y-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>➕</span> {editingId ? "Edit Item" : "Add a new item"}
              </h2>

              <form onSubmit={handleAddProduct} className="space-y-5">
                {/* Item Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Item name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-white text-sm outline-none focus:border-orange-500"
                    placeholder="e.g. Peri Peri Pizza"
                    required
                  />
                </div>

                {/* Price & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-white text-sm outline-none focus:border-orange-500"
                      placeholder="249"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-white text-sm outline-none focus:border-orange-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-white text-sm outline-none focus:border-orange-500"
                    placeholder="Short, kirrak description"
                    required
                  />
                </div>

                {/* Veg / Non-veg */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Veg / Non-veg</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isVeg: true })}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition ${
                        formData.isVeg
                          ? "border-emerald-500/80 bg-emerald-500/10 text-emerald-400"
                          : "border-white/10 bg-black/40 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span>🟢</span> Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isVeg: false })}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition ${
                        !formData.isVeg
                          ? "border-amber-700/80 bg-amber-900/20 text-amber-500"
                          : "border-white/10 bg-black/40 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span>🔴</span> Non-veg
                    </button>
                  </div>
                </div>

                {/* Item Image & Bestseller Toggle */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-zinc-400">Item image</label>

                  {/* Clickable Image Upload Box */}
                  <div
                    onClick={() => document.getElementById("product-image-file-input")?.click()}
                    className="w-full cursor-pointer rounded-xl border border-dashed border-orange-500/40 bg-black/60 px-4 py-3 text-center text-zinc-300 transition hover:border-orange-500 hover:bg-black/80 flex flex-col items-center justify-center gap-2"
                  >
                    {formData.image ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          {formData.image.startsWith("data:") || formData.image.startsWith("http") ? (
                            <img src={formData.image} alt="Preview" className="h-10 w-10 rounded-lg object-cover border border-white/10 shrink-0" />
                          ) : (
                            <span className="text-xl">📷</span>
                          )}
                          <span className="text-xs text-emerald-400 font-semibold truncate max-w-[200px]">Image selected ✓</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, image: "" });
                          }}
                          className="text-xs text-red-400 hover:underline px-2 py-1"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-1">
                        <span className="text-lg">📷</span>
                        <span className="text-xs text-zinc-400">Click to upload image file from device (or skip for emoji)</span>
                      </div>
                    )}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    id="product-image-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  {/* Optional Image URL Input */}
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-zinc-400 outline-none focus:border-orange-500"
                    placeholder="Or paste image URL (e.g. https://...)"
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="bestseller-check"
                      checked={formData.isBestseller}
                      onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                      className="rounded border-white/10 accent-orange-500 h-4 w-4"
                    />
                    <label htmlFor="bestseller-check" className="text-xs text-zinc-300 cursor-pointer select-none">
                      Mark as Bestseller ⭐
                    </label>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-orange-500 py-3 font-bold text-black hover:bg-orange-400 transition text-sm shadow-lg shadow-orange-500/20 disabled:opacity-50"
                  >
                    {loading ? "Saving..." : editingId ? "Update Item" : "Add Item to Menu"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          name: "",
                          description: "",
                          price: "",
                          category: "Veg Pizza",
                          image: "",
                          isVeg: true,
                          isBestseller: false,
                        });
                      }}
                      className="px-6 rounded-xl border border-white/20 text-zinc-300 text-sm font-semibold hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Current Menu matching Image 3 */}
            <div className="rounded-[1.75rem] border border-white/10 bg-[#16120E] p-6 lg:p-8 space-y-4 shadow-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🍽️</span> Current menu
              </h2>

              <div className="space-y-3 pt-2 max-h-[600px] overflow-y-auto pr-1">
                {products.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic">No products added yet.</p>
                ) : (
                  <>
                    {/* Active Products */}
                    <div className="space-y-3">
                      {products.filter((p) => p.isActive !== false).map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/40 p-4 transition hover:border-white/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-3xl flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-white/5 shrink-0 overflow-hidden">
                              {product.image && (product.image.startsWith("http") || product.image.startsWith("data:")) ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                product.category.toLowerCase().includes("pizza") ? "🍕" :
                                product.category.toLowerCase().includes("burger") ? "🍔" :
                                product.category.toLowerCase().includes("sandwich") ? "🥪" :
                                product.category.toLowerCase().includes("beverage") ? "☕" : "🍟"
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white text-sm">{product.name}</h3>
                                <span className="text-xs">{product.isVeg ? "🟢" : "🔴"}</span>
                                {product.isBestseller && (
                                  <span className="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                    Bestseller
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                ₹{product.price} · <span className="text-zinc-500">{product.category}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Toggle active switch */}
                            <button
                              onClick={() => handleToggleProductStatus(product)}
                              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-emerald-500"
                              title="Click to Disable Item"
                            >
                              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                            </button>

                            <button
                              onClick={() => handleEditProduct(product)}
                              className="px-3 py-1.5 rounded-lg border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 text-xs font-semibold"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Disabled Products Section — Stored at Bottom */}
                    {products.some((p) => p.isActive === false) && (
                      <div className="pt-6 border-t border-dashed border-red-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
                            <span>🔻</span> Disabled / Inactive Products ({products.filter((p) => p.isActive === false).length}) — Stored at Bottom
                          </h4>
                          <span className="text-[11px] text-zinc-500">Toggle switch to re-activate items anytime</span>
                        </div>

                        {products.filter((p) => p.isActive === false).map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-red-500/30 bg-red-950/20 p-4 opacity-80 transition hover:opacity-100"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-3xl flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-white/5 shrink-0 overflow-hidden opacity-60">
                                {product.image && (product.image.startsWith("http") || product.image.startsWith("data:")) ? (
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                  product.category.toLowerCase().includes("pizza") ? "🍕" :
                                  product.category.toLowerCase().includes("burger") ? "🍔" :
                                  product.category.toLowerCase().includes("sandwich") ? "🥪" :
                                  product.category.toLowerCase().includes("beverage") ? "☕" : "🍟"
                                )}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-zinc-300 text-sm line-through decoration-red-500/70">{product.name}</h3>
                                  <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase">
                                    Disabled
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  ₹{product.price} · <span>{product.category}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Re-activate Switch */}
                              <button
                                onClick={() => handleToggleProductStatus(product)}
                                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-zinc-700 hover:bg-emerald-600"
                                title="Click to Re-Activate Item"
                              >
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                              </button>

                              <button
                                onClick={() => handleEditProduct(product)}
                                className="px-3 py-1.5 rounded-lg border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 text-xs font-semibold"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Incoming Orders Section matching Image 3 */}
            <div className="rounded-[1.75rem] border border-white/10 bg-[#16120E] p-6 lg:p-8 space-y-4 shadow-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🔔</span> Incoming orders
              </h2>
              <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl bg-black/20">
                <p className="text-sm text-zinc-400">
                  {orders.length > 0
                    ? `You have ${orders.length} orders in queue. Switch to Order Management tab to manage.`
                    : "No orders yet — place one from the Customer App."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (isSuperAdmin || permissions.canManageOrders) && (
          <div id="orders-queue-container" className="space-y-4 max-w-4xl mx-auto">
            {/* Dine-In vs Online vs Unconfirmed Filter Pills & Sound Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-zinc-950/90 border border-white/10 rounded-2xl p-3 shadow-lg gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-zinc-300">Filter Queue:</span>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setOrderFilter("all")}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      orderFilter === "all" ? "bg-orange-500 text-black" : "bg-black/60 text-zinc-400 hover:text-white"
                    }`}
                  >
                    All ({orders.length})
                  </button>
                  {unconfirmedOrders.length > 0 && (
                    <button
                      onClick={() => setOrderFilter("unconfirmed")}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition animate-bounce ${
                        orderFilter === "unconfirmed" ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-red-500/20 text-red-300 border border-red-500/40"
                      }`}
                    >
                      🔔 New Unconfirmed ({unconfirmedOrders.length})
                    </button>
                  )}
                  <button
                    onClick={() => setOrderFilter("dine_in")}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      orderFilter === "dine_in" ? "bg-amber-500 text-black" : "bg-black/60 text-zinc-400 hover:text-white"
                    }`}
                  >
                    🍽️ Dine-In ({orders.filter((o) => (o as any).orderType === "dine_in" || o.address.startsWith("Dine-In") || (o as any).tableNumber).length})
                  </button>
                  <button
                    onClick={() => setOrderFilter("online")}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      orderFilter === "online" ? "bg-blue-500 text-white" : "bg-black/60 text-zinc-400 hover:text-white"
                    }`}
                  >
                    🛵 Online ({orders.filter((o) => (o as any).orderType !== "dine_in" && !o.address.startsWith("Dine-In") && !(o as any).tableNumber).length})
                  </button>
                </div>
              </div>

              {/* Kitchen Order Alert Chime Sound Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const nextState = !kitchenSoundEnabled;
                    setKitchenSoundEnabled(nextState);
                    if (nextState) playOrderChimeSound();
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${
                    kitchenSoundEnabled
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-black/60 border-white/10 text-zinc-400"
                  }`}
                >
                  <span>{kitchenSoundEnabled ? "🔔 Order Sound ON" : "🔕 Sound OFF"}</span>
                </button>
                <button
                  onClick={playOrderChimeSound}
                  className="bg-black/60 hover:bg-black border border-white/10 text-xs font-bold text-amber-300 px-3 py-1 rounded-xl flex items-center gap-1"
                >
                  🔊 Test Sound
                </button>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-950/90 p-8 text-center text-zinc-400">
                No orders yet.
              </div>
            ) : (
              orders
                .filter((order) => {
                  const isDineIn = (order as any).orderType === "dine_in" || order.address.startsWith("Dine-In") || (order as any).tableNumber;
                  const isUnconfirmed = order.status === "Received" || order.status === "Pending";
                  if (orderFilter === "unconfirmed" && !isUnconfirmed) return false;
                  if (orderFilter === "dine_in" && !isDineIn) return false;
                  if (orderFilter === "online" && isDineIn) return false;
                  return true;
                })
                .map((order) => {
                  const isDineIn = (order as any).orderType === "dine_in" || order.address.startsWith("Dine-In") || (order as any).tableNumber;
                  const isUnconfirmed = order.status === "Received" || order.status === "Pending";
                  let parsedItems: any[] = [];
                  try {
                    parsedItems = typeof (order as any).items === "string" ? JSON.parse((order as any).items) : (order as any).items || [];
                  } catch (e) {}

                  return (
                    <div
                      key={order.id}
                      className={`rounded-2xl border p-6 transition ${
                        isUnconfirmed
                          ? "border-2 border-amber-400 shadow-xl shadow-amber-500/20 bg-amber-950/20 animate-pulse"
                          : isDineIn
                          ? "border-amber-500/40 bg-zinc-950/90"
                          : "border-white/10 bg-zinc-950/90"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {isUnconfirmed && (
                              <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-bounce">
                                🔥 NEW UNCONFIRMED
                              </span>
                            )}
                            {isDineIn ? (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 text-xs font-black uppercase px-2.5 py-0.5 rounded-full">
                                🍽️ DINE-IN ({(order as any).tableNumber || order.address})
                              </span>
                            ) : (
                              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-black uppercase px-2 py-0.5 rounded-full">
                                🛵 ONLINE DELIVERY
                              </span>
                            )}
                            <span className="text-xs text-zinc-500 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                          </div>

                          <h3 className="font-bold text-white text-base">{order.customerName}</h3>
                          <p className="text-xs text-zinc-400">📞 {order.phone}</p>
                          <p className="text-xs text-zinc-400">📍 {order.address}</p>

                          {/* Itemized Dishes List */}
                          {parsedItems.length > 0 && (
                            <div className="mt-3 bg-black/60 p-3 rounded-xl border border-white/10 text-xs space-y-1">
                              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Dishes to Prepare:</p>
                              {parsedItems.map((it: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-zinc-200 font-semibold border-b border-white/5 pb-0.5">
                                  <span>
                                    <strong className="text-amber-400 text-sm font-black mr-1">{it.quantity}x</strong> {it.name}
                                  </span>
                                  <span className="text-zinc-400">₹{(it.price || 0) * (it.quantity || 1)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between">
                            <p className="font-extrabold text-orange-400 text-sm">
                              Total Paid: ₹{order.total} <span className="text-xs text-zinc-400 font-normal">({(order as any).paymentMethod || 'Paid'})</span>
                            </p>
                            <button
                              onClick={() => setSelectedOrderModal(order)}
                              className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-extrabold px-3 py-1 rounded-xl transition"
                            >
                              🔍 View Full Details
                            </button>
                          </div>

                          {/* Payment Verification & Customer Chat Action Bar */}
                          <div className="mt-3 bg-black/60 p-2.5 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400 text-[11px]">Payment Verification:</span>
                              {order.status === "Awaiting Call Confirmation" || ((order as any).paymentMethod === "Cash on Delivery" && order.status !== "Preparing" && order.status !== "Ready" && order.status !== "Completed") ? (
                                <span className="bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1">
                                  📞 Call Confirmation Required
                                </span>
                              ) : (order as any).paymentStatus === "pending" || ((order as any).paymentScreenshot && (order as any).paymentStatus !== "verified" && (order as any).paymentStatus !== "declined") ? (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                  🟡 Verification Pending
                                </span>
                              ) : (order as any).paymentStatus === "verified" || order.status === "Preparing" || order.status === "Ready" || order.status === "Completed" ? (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-full">
                                  ✅ Order Confirmed
                                </span>
                              ) : (order as any).paymentStatus === "declined" ? (
                                <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-black px-2 py-0.5 rounded-full">
                                  ❌ Declined {(order as any).declineReason ? `(${ (order as any).declineReason })` : ""}
                                </span>
                              ) : (
                                <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  ✓ Completed
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {(order as any).paymentScreenshot && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewScreenshotUrl((order as any).paymentScreenshot)}
                                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                                >
                                  <span>📸 View Receipt Screenshot</span>
                                </button>
                              )}



                              {(order as any).paymentStatus !== "verified" && (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyPayment(order.id)}
                                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-black px-2.5 py-1 rounded-lg transition"
                                >
                                  ✅ Confirm
                                </button>
                              )}

                              {(order as any).paymentStatus !== "declined" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeclineModalOrder(order);
                                    setDeclineReasonInput("");
                                  }}
                                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] font-black px-2.5 py-1 rounded-lg transition"
                                >
                                  ❌ Decline
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400">Status:</span>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 font-bold"
                            >
                              <option value="Received">Received 🟡</option>
                              <option value="Preparing">Preparing 👨‍🍳</option>
                              <option value="Ready">Ready / Served 🍲</option>
                              <option value="Out for Delivery">Out for Delivery 🛵</option>
                              <option value="Completed">Completed ✅</option>
                              <option value="Cancelled">Cancelled ❌</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-400">Assign Staff:</span>
                            <select
                              value={(order as any).assignedStaff || ""}
                              onChange={(e) => handleAssignStaff(order.id, e.target.value)}
                              className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-orange-300 outline-none"
                            >
                              <option value="">-- Unassigned --</option>
                              {employees.map((emp) => (
                                <option key={emp.id} value={`${emp.name} (${emp.role})`}>
                                  {emp.name} ({emp.role})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}

        {/* Settings Tab (Grouping Categories, Sound, Paytm, Staff, Delivery under Settings) */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Settings Sub-Tab Navigation Bar */}
            <div className="rounded-2xl border border-white/10 bg-[#16120E] p-2 flex flex-wrap gap-2 shadow-xl mb-6">
              {(isSuperAdmin || permissions.canEditMenu) && (
                <button
                  onClick={() => setSettingsSubTab("categories")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                    settingsSubTab === "categories"
                      ? "bg-[#FF6B00] text-black shadow-lg shadow-orange-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-black/40"
                  }`}
                >
                  <span>📁</span> Food Categories
                </button>
              )}

              {(isSuperAdmin || permissions.canManageOrders) && (
                <button
                  onClick={() => setSettingsSubTab("sound")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                    settingsSubTab === "sound"
                      ? "bg-[#FF6B00] text-black shadow-lg shadow-orange-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-black/40"
                  }`}
                >
                  <span>🔔</span> Sound Alert Settings
                </button>
              )}

              {(isSuperAdmin || permissions.canManageRoles) && (
                <button
                  onClick={() => setSettingsSubTab("paytm")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                    settingsSubTab === "paytm"
                      ? "bg-[#FF6B00] text-black shadow-lg shadow-orange-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-black/40"
                  }`}
                >
                  <span>💳</span> Paytm & Payment Gateways
                </button>
              )}

              {(isSuperAdmin || permissions.canManageRoles) && (
                <button
                  onClick={() => setSettingsSubTab("employees")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                    settingsSubTab === "employees"
                      ? "bg-[#FF6B00] text-black shadow-lg shadow-orange-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-black/40"
                  }`}
                >
                  <span>👥</span> Staff & Role Permissions
                </button>
              )}

              {(isSuperAdmin || permissions.canManageRoles) && (
                <button
                  onClick={() => setSettingsSubTab("delivery")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                    settingsSubTab === "delivery"
                      ? "bg-[#FF6B00] text-black shadow-lg shadow-orange-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-black/40"
                  }`}
                >
                  <span>🛵</span> Delivery Settings
                </button>
              )}

              {(isSuperAdmin || permissions.canEditMenu || permissions.canManageRoles) && (
                <button
                  onClick={() => setSettingsSubTab("offers")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                    settingsSubTab === "offers"
                      ? "bg-[#FF6B00] text-black shadow-lg shadow-orange-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-black/40"
                  }`}
                >
                  <span>🎟️</span> Offers & Coupons
                </button>
              )}

              {(isSuperAdmin || permissions.canManageRoles) && (
                <button
                  onClick={() => setSettingsSubTab("email")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                    settingsSubTab === "email"
                      ? "bg-[#FF6B00] text-black shadow-lg shadow-orange-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-black/40"
                  }`}
                >
                  <span>📧</span> Admin Email & Mail Server
                </button>
              )}
            </div>

            {/* Email & Mail Server Sub-Tab */}
            {settingsSubTab === "email" && (isSuperAdmin || permissions.canManageRoles) && (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="rounded-[1.75rem] border border-white/10 bg-[#16120E] p-6 lg:p-8 space-y-6 shadow-2xl">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>📧</span> Admin Email Alerts & SMTP Mail Server Settings
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Configure the Admin recipient email address where all order alerts & status updates are sent, along with SMTP credentials to dispatch user password reset verification emails!
                  </p>

                  <form onSubmit={handleSaveEmailConfig} className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-orange-400 mb-1">
                          Admin Recipient Email Address (Receives all new order alerts & status updates)
                        </label>
                        <input
                          type="email"
                          value={emailForm.adminEmail}
                          onChange={(e) => setEmailForm({ ...emailForm, adminEmail: e.target.value })}
                          placeholder="e.g. nakirraakadda2026@gmail.com"
                          className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500 font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Sender Name (Shown on outgoing emails)</label>
                        <input
                          type="text"
                          value={emailForm.senderName}
                          onChange={(e) => setEmailForm({ ...emailForm, senderName: e.target.value })}
                          placeholder="NA KIRRAAK ADDA"
                          className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">SMTP Server Host</label>
                        <input
                          type="text"
                          value={emailForm.smtpHost}
                          onChange={(e) => setEmailForm({ ...emailForm, smtpHost: e.target.value })}
                          placeholder="smtp.gmail.com"
                          className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">SMTP Port (587 TLS or 465 SSL)</label>
                        <input
                          type="number"
                          value={emailForm.smtpPort}
                          onChange={(e) => setEmailForm({ ...emailForm, smtpPort: Number(e.target.value) })}
                          placeholder="587"
                          className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">SMTP Username / Email</label>
                        <input
                          type="text"
                          value={emailForm.smtpUser}
                          onChange={(e) => setEmailForm({ ...emailForm, smtpUser: e.target.value })}
                          placeholder="nakirraakadda2026@gmail.com"
                          className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs text-zinc-400 mb-1">
                          SMTP App Password (e.g. Gmail 16-character App Password)
                        </label>
                        <input
                          type="password"
                          value={emailForm.smtpPass}
                          onChange={(e) => setEmailForm({ ...emailForm, smtpPass: e.target.value })}
                          placeholder="Enter Gmail App Password"
                          className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono"
                        />
                        <p className="text-[10px] text-zinc-500 mt-1">
                          💡 Tip for Gmail: Go to Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords to generate a 16-character app password.
                        </p>
                      </div>
                    </div>

                    {emailMsg && (
                      <p className={`text-xs font-semibold ${emailMsg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
                        {emailMsg}
                      </p>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="rounded-full bg-[#FF6B00] px-6 py-2 text-xs font-extrabold text-black hover:bg-orange-400 transition shadow-lg"
                      >
                        ✓ Save Admin Email & Mail Server Settings
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Offers & Coupon Banners Sub-Tab */}
            {settingsSubTab === "offers" && (isSuperAdmin || permissions.canEditMenu || permissions.canManageRoles) && (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="rounded-[1.75rem] border border-white/10 bg-[#16120E] p-6 lg:p-8 space-y-6 shadow-2xl">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>🎟️</span> Manage Homepage Offer Banners & Coupons
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Create and manage special discounts & coupon codes. Offers added here automatically scroll on the customer homepage slider and are locked to 1-time redemption per phone/device!
                  </p>

                  {/* Add / Edit Offer Form */}
                  <form onSubmit={handleSaveOffer} className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
                    <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                      {editingOfferId ? "✏️ Edit Offer Banner" : "➕ Create New Offer / Coupon"}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Coupon Code (e.g. KIRRAAK50)</label>
                        <input
                          type="text"
                          value={offerForm.code}
                          onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })}
                          placeholder="e.g. KIRRAAK50"
                          className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white uppercase outline-none focus:border-orange-500 font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Icon / Emoji</label>
                        <input
                          type="text"
                          value={offerForm.icon}
                          onChange={(e) => setOfferForm({ ...offerForm, icon: e.target.value })}
                          placeholder="🔥 or 🍔 or 🛵"
                          className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs text-zinc-400 mb-1">Title (Displayed on Homepage Slider)</label>
                        <input
                          type="text"
                          value={offerForm.title}
                          onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                          placeholder="e.g. Adda Pe Swagat Hai! ₹50 Off"
                          className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs text-zinc-400 mb-1">Subtitle / Description</label>
                        <input
                          type="text"
                          value={offerForm.subtitle}
                          onChange={(e) => setOfferForm({ ...offerForm, subtitle: e.target.value })}
                          placeholder="e.g. Use code KIRRAAK50 on orders above ₹299"
                          className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Discount Type</label>
                        <select
                          value={offerForm.discountType}
                          onChange={(e) => setOfferForm({ ...offerForm, discountType: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500 font-semibold"
                        >
                          <option value="flat">Flat Amount (₹ Off)</option>
                          <option value="percent">Percentage (% Off)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Discount Value ({offerForm.discountType === "flat" ? "₹" : "%"})</label>
                        <input
                          type="number"
                          value={offerForm.discountValue}
                          onChange={(e) => setOfferForm({ ...offerForm, discountValue: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Minimum Order Value (₹)</label>
                        <input
                          type="number"
                          value={offerForm.minOrderValue}
                          onChange={(e) => setOfferForm({ ...offerForm, minOrderValue: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-black/40">
                        <div>
                          <label className="text-xs font-bold text-orange-300 block">Strict 1-Time Limit Per Device/Mobile</label>
                          <span className="text-[10px] text-zinc-400">Blocks duplicate coupon redemption on same phone or browser</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={offerForm.oneTimePerUser}
                          onChange={(e) => setOfferForm({ ...offerForm, oneTimePerUser: e.target.checked })}
                          className="h-4 w-4 accent-orange-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="rounded-full bg-[#FF6B00] px-6 py-2 text-xs font-extrabold text-black hover:bg-orange-400 transition shadow-lg"
                      >
                        {editingOfferId ? "✓ Update Offer Banner" : "+ Add Offer Banner"}
                      </button>
                      {editingOfferId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOfferId(null);
                            setOfferForm({
                              id: "",
                              code: "",
                              title: "",
                              subtitle: "",
                              discountType: "flat",
                              discountValue: "50",
                              minOrderValue: "299",
                              icon: "🔥",
                              isActive: true,
                              oneTimePerUser: true,
                            });
                          }}
                          className="rounded-full bg-zinc-800 px-4 py-2 text-xs text-zinc-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Active Offers List */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Homepage Banner Offers ({offers.length})</h3>
                    {offers.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">No offer banners added yet.</p>
                    ) : (
                      offers.map((off) => (
                        <div key={off.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/40 p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{off.icon || "🔥"}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-white">{off.title}</h4>
                                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                                  {off.code}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 mt-0.5">{off.subtitle}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-emerald-400 font-bold">
                                  {off.discountType === "flat" ? `₹${off.discountValue} Flat Off` : `${off.discountValue}% Percentage Off`}
                                </span>
                                <span className="text-[10px] text-zinc-500">Min Order: ₹{off.minOrderValue}</span>
                                {off.oneTimePerUser && (
                                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                                    🔒 1-Time Limit
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <button
                              onClick={() => handleToggleOffer(off.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                off.isActive ? "bg-emerald-500" : "bg-zinc-700"
                              }`}
                              title={off.isActive ? "Active on Homepage Slider (Click to Hide)" : "Inactive (Click to Activate)"}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  off.isActive ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>

                            <button
                              onClick={() => {
                                setEditingOfferId(off.id);
                                setOfferForm(off);
                              }}
                              className="px-3 py-1.5 rounded-lg border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 text-xs font-semibold"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteOffer(off.id)}
                              className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Categories Sub-Tab */}
            {settingsSubTab === "categories" && (isSuperAdmin || permissions.canEditMenu) && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#16120E] p-6 lg:p-8 space-y-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📂</span> Manage Food Categories
              </h2>
              <p className="text-xs text-zinc-400">
                Add, rename, or delete categories. Newly added categories will automatically appear on your customer food menu and filtering bar!
              </p>

              {/* Add New Category Form */}
              <form onSubmit={handleAddCategory} className="flex gap-3">
                <input
                  type="text"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  placeholder="Enter new category name (e.g. Momos, Desserts, Ice Creams)..."
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-white text-sm outline-none focus:border-orange-500"
                  required
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#FF6B00] px-6 py-2.5 text-xs font-extrabold text-black hover:bg-orange-400 transition shrink-0"
                >
                  + Add Category
                </button>
              </form>

              {/* Category List */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Existing Categories ({categories.length})</h3>
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/40 p-4">
                    {editingCatName === cat ? (
                      <div className="flex gap-2 w-full">
                        <input
                          type="text"
                          value={editCatInput}
                          onChange={(e) => setEditCatInput(e.target.value)}
                          className="w-full rounded-lg border border-white/20 bg-black px-3 py-1.5 text-xs text-white outline-none"
                        />
                        <button
                          onClick={() => handleEditCategory(cat)}
                          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-emerald-400"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCatName(null)}
                          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold text-white text-sm">📁 {cat}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingCatName(cat); setEditCatInput(cat); }}
                            className="px-3 py-1.5 rounded-lg border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 text-xs font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Roles, Designations & Access Restrictions Manager */}
            <div className="rounded-[1.75rem] border border-white/10 bg-[#16120E] p-6 lg:p-8 space-y-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🛡️</span> Roles, Designations & Access Restrictions
              </h2>
              <p className="text-xs text-zinc-400">
                Add new staff roles (e.g. Kitchen Chef, Rider, Manager) and define specific feature restrictions and permissions for each role.
              </p>

              {/* Add New Role Form */}
              <form onSubmit={handleAddRole} className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
                <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">➕ Create New Role / Designation</h3>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Role Title / Designation</label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    placeholder="e.g. 👨‍🍳 Kitchen Chef, 🛵 Delivery Rider, 🧹 Store Helper..."
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-white text-xs outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="block text-xs font-bold text-zinc-300">Set Access Permissions & Restrictions:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={roleForm.canEditMenu}
                        onChange={(e) => setRoleForm({ ...roleForm, canEditMenu: e.target.checked })}
                        className="rounded accent-orange-500"
                      />
                      <span>🍔 Can Edit Menu & Prices</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={roleForm.canManageOrders}
                        onChange={(e) => setRoleForm({ ...roleForm, canManageOrders: e.target.checked })}
                        className="rounded accent-orange-500"
                      />
                      <span>📦 Can View & Update Orders</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={roleForm.canManageRoles}
                        onChange={(e) => setRoleForm({ ...roleForm, canManageRoles: e.target.checked })}
                        className="rounded accent-orange-500"
                      />
                      <span>⚙️ Can Manage Staff & Roles</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={roleForm.canViewAnalytics}
                        onChange={(e) => setRoleForm({ ...roleForm, canViewAnalytics: e.target.checked })}
                        className="rounded accent-orange-500"
                      />
                      <span>💰 Can View Revenue & Sales Analytics</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-[#FF6B00] px-6 py-2 text-xs font-extrabold text-black hover:bg-orange-400 transition"
                >
                  + Save New Role & Permissions
                </button>
              </form>

              {/* Roles List */}
              <div className="space-y-3 pt-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Staff Roles ({roles.length})</h3>
                {roles.map((r) => (
                  <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 p-4">
                    <div>
                      <h4 className="font-bold text-sm text-white">{r.name}</h4>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${r.canEditMenu ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                          {r.canEditMenu ? '✓ Edit Menu' : '✕ Edit Menu'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${r.canManageOrders ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                          {r.canManageOrders ? '✓ Update Orders' : '✕ Update Orders'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${r.canManageRoles ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                          {r.canManageRoles ? '✓ Manage Staff' : '✕ Manage Staff'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${r.canViewAnalytics ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                          {r.canViewAnalytics ? '✓ View Sales' : '✕ View Sales'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteRole(r.id)}
                      className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold shrink-0 self-start sm:self-center"
                    >
                      Delete Role
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sound Alarm Settings Sub-Tab */}
        {settingsSubTab === "sound" && (isSuperAdmin || permissions.canManageOrders) && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#16120E] p-6 lg:p-8 space-y-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🔔</span> Sound & Notification Settings
              </h2>
              <p className="text-xs text-zinc-400">
                Choose the alarm chime sound that plays when new orders arrive, or upload a custom audio ringtone directly from your mobile/laptop!
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">Select Preset Sound Alarm</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "siren", title: "🚨 Loud Siren Sweep", desc: "High pitch dual sweep alarm" },
                      { id: "bell", title: "🔔 Classic Bell Chime", desc: "Clean C6 bell tone" },
                      { id: "beep", title: "🔊 Standard Beep", desc: "880Hz alert chime" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSoundType(st.id as any)}
                        className={`p-4 rounded-xl border text-left transition ${
                          soundType === st.id ? "border-orange-500 bg-orange-500/10 text-white" : "border-white/10 bg-black/40 text-zinc-400"
                        }`}
                      >
                        <h4 className="font-bold text-sm text-white">{st.title}</h4>
                        <p className="text-[11px] text-zinc-400 mt-1">{st.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Custom Audio File */}
                <div className="pt-4 border-t border-white/10">
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">Upload Custom Audio File (.mp3, .wav)</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setCustomAudioUrl(url);
                        setSoundType("custom");
                      }
                    }}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-300 outline-none file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#FF6B00] file:text-black hover:file:bg-orange-400"
                  />
                  {customAudioUrl && (
                    <p className="text-xs text-emerald-400 font-bold mt-2">✓ Custom Audio loaded! Sound mode set to Custom Audio.</p>
                  )}
                </div>

                {/* Test Sound Button */}
                <div className="pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={playAlertSound}
                    className="rounded-full bg-[#FF6B00] px-6 py-3 text-xs font-extrabold text-black hover:bg-orange-400 transition shadow-lg flex items-center gap-2"
                  >
                    <span>🔊</span> Test Alarm Sound Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paytm Business Gateway Sub-Tab */}
        {settingsSubTab === "paytm" && (isSuperAdmin || permissions.canManageRoles) && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#16120E] p-6 lg:p-8 space-y-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>💳</span> Paytm Business Account Credentials
              </h2>
              <p className="text-xs text-zinc-400">
                Configure your official Paytm Merchant Business details (MID & Secret Key) and enable/disable Cash on Delivery for customers.
              </p>

              {paytmSaveMsg && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 p-3 text-xs font-bold text-emerald-300">
                  {paytmSaveMsg}
                </div>
              )}

              <form onSubmit={handleSavePaytmConfig} className="space-y-4">
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-orange-500/20 text-orange-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">Paytm Merchant</span>
                    <h4 className="text-xs font-bold text-white">Paytm Business Account API Credentials</h4>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Paytm Merchant ID (MID)</label>
                    <input
                      type="text"
                      value={paytmConfig.merchantId}
                      onChange={(e) => setPaytmConfig({ ...paytmConfig, merchantId: e.target.value })}
                      placeholder="Enter your Paytm Merchant ID (e.g. NA_KIRRAAK_MID_123)"
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-xs text-white outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Paytm Merchant Key (Secret Key)</label>
                    <input
                      type="password"
                      value={paytmConfig.merchantKey}
                      onChange={(e) => setPaytmConfig({ ...paytmConfig, merchantKey: e.target.value })}
                      placeholder="Enter your Paytm Secret Merchant Key"
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-xs text-white outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Paytm Website Mode</label>
                    <select
                      value={paytmConfig.website}
                      onChange={(e) => setPaytmConfig({ ...paytmConfig, website: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                    >
                      <option value="DEFAULT">DEFAULT (Production Live)</option>
                      <option value="WEBSTAGING">WEBSTAGING (Sandbox Testing)</option>
                    </select>
                  </div>
                </div>

                {/* Gateways & Payment Switches */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">💳 Customer Payment Methods Control</h3>
                  
                  {/* Enable Cash on Delivery */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-black/40">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>💵</span> Cash on Delivery (COD)
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Pay cash upon delivery arrival or at dine-in table</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaytmConfig({ ...paytmConfig, enableCod: !paytmConfig.enableCod })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        paytmConfig.enableCod ? "bg-emerald-500" : "bg-zinc-700"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${paytmConfig.enableCod ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  {/* Enable Paytm Business Gateway */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-black/40">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>🔒</span> Paytm Business Gateway for Customers
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Requires Paytm MID & Secret Key entered above</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaytmConfig({ ...paytmConfig, isActive: !paytmConfig.isActive })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        paytmConfig.isActive ? "bg-emerald-500" : "bg-zinc-700"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${paytmConfig.isActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-[#FF6B00] py-3.5 text-xs font-extrabold text-black hover:bg-orange-400 transition shadow-lg shadow-orange-500/20 uppercase tracking-wider"
                >
                  Save Paytm Business Credentials & Gateway Settings
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Staff & Employee Management Sub-Tab */}
        {settingsSubTab === "employees" && (isSuperAdmin || permissions.canManageRoles) && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#16120E] p-6 lg:p-8 space-y-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>👥</span> Staff & Employee Management
              </h2>
              <p className="text-xs text-zinc-400">
                Create employee accounts (Chefs, Delivery Riders, Managers) and assign customer orders to them!
              </p>

              {/* Add New Employee Form */}
              <form onSubmit={handleCreateEmployee} className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
                <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">➕ Create New Employee Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Employee Name</label>
                    <input
                      type="text"
                      value={empForm.name}
                      onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                      placeholder="e.g. Ramesh (Chef) / Suresh (Rider)"
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Role / Designation</label>
                    <select
                      value={empForm.role}
                      onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500 font-semibold"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={empForm.phone}
                      onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Passcode / PIN</label>
                    <input
                      type="text"
                      value={empForm.passcode}
                      onChange={(e) => setEmpForm({ ...empForm, passcode: e.target.value })}
                      placeholder="4-digit access pin"
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-[#FF6B00] px-6 py-2.5 text-xs font-extrabold text-black hover:bg-orange-400 transition"
                >
                  + Add Employee Account
                </button>
              </form>

              {/* Employee List */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Organization Staff ({employees.length})</h3>
                {employees.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No employees added yet.</p>
                ) : (
                  employees.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/40 p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{emp.name}</h4>
                          <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                            {emp.role}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">📞 {emp.phone} · PIN: <span className="font-mono">{emp.passcode}</span></p>
                      </div>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}



        {/* Delivery Settings Sub-Tab */}
        {settingsSubTab === "delivery" && (isSuperAdmin || permissions.canManageRoles) && (
          <div className="max-w-3xl mx-auto rounded-[2rem] border border-orange-500/20 bg-zinc-950/90 p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Delivery & Radius Settings</h2>
              <p className="text-sm text-zinc-400">
                Configure your kitchen center coordinates, free delivery distance, maximum delivery radius, and distance charges.
              </p>
            </div>

            {deliverySaveMsg && (
              <div className={`p-4 rounded-xl text-sm font-semibold ${deliverySaveMsg.startsWith("Error") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                {deliverySaveMsg}
              </div>
            )}

            <form onSubmit={handleSaveDeliveryConfig} className="space-y-6">
              {/* Center Location */}
              <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                <h3 className="font-semibold text-orange-400 flex items-center justify-between">
                  <span>📍 Store / Kitchen Center Location</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Auto-detects Google Maps URLs & Coordinates</span>
                </h3>

                {/* Google Maps Link / Raw Coordinates Auto-Parser Box */}
                <div className="p-3.5 rounded-xl border border-orange-500/30 bg-orange-500/10 space-y-1.5">
                  <label className="block text-xs font-bold text-orange-300">
                    🔗 Paste Google Maps Location Link or Coordinates
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mapLinkInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMapLinkInput(val);
                        const parsed = parseLocationInput(val);
                        if (parsed) {
                          setDeliveryConfig((prev) => ({
                            ...prev,
                            storeLocation: {
                              ...prev.storeLocation,
                              lat: parsed.lat,
                              lng: parsed.lng,
                            },
                          }));
                        }
                      }}
                      placeholder="Paste Google Maps URL (e.g. https://maps.google.com/... or 17.3998, 78.5630 or 172359.4, 783346.8)"
                      className="w-full rounded-xl border border-white/10 bg-black/80 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-300 italic">
                    💡 Tip: You can paste any Google Maps share link, coordinates, or DMS values. Latitude & Longitude will be extracted and converted automatically!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Latitude (Decimal Degrees e.g. 17.3998)</label>
                    <input
                      type="number"
                      step="any"
                      value={deliveryConfig.storeLocation.lat}
                      onChange={(e) => {
                        const raw = parseFloat(e.target.value) || 0;
                        const finalLat = convertDmsToDecimal(raw);
                        setDeliveryConfig({
                          ...deliveryConfig,
                          storeLocation: { ...deliveryConfig.storeLocation, lat: finalLat },
                        });
                      }}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-white text-sm font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Longitude (Decimal Degrees e.g. 78.5630)</label>
                    <input
                      type="number"
                      step="any"
                      value={deliveryConfig.storeLocation.lng}
                      onChange={(e) => {
                        const raw = parseFloat(e.target.value) || 0;
                        const finalLng = convertDmsToDecimal(raw);
                        setDeliveryConfig({
                          ...deliveryConfig,
                          storeLocation: { ...deliveryConfig.storeLocation, lng: finalLng },
                        });
                      }}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-white text-sm font-mono"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Address Label</label>
                  <input
                    type="text"
                    value={deliveryConfig.storeLocation.address}
                    onChange={(e) =>
                      setDeliveryConfig({
                        ...deliveryConfig,
                        storeLocation: { ...deliveryConfig.storeLocation, address: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
              </div>

              {/* Radius Tiers */}
              <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                <h3 className="font-semibold text-orange-400">Delivery Limits & Fees</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Free Delivery Radius (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={deliveryConfig.freeRadiusKm}
                      onChange={(e) =>
                        setDeliveryConfig({ ...deliveryConfig, freeRadiusKm: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-white text-sm"
                      required
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Orders within this radius get FREE delivery.</p>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Maximum Delivery Radius (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={deliveryConfig.chargeableRadiusEndKm}
                      onChange={(e) =>
                        setDeliveryConfig({ ...deliveryConfig, chargeableRadiusEndKm: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-white text-sm"
                      required
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Addresses beyond this distance are blocked.</p>
                  </div>
                </div>

                {/* Distance fee tiers */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Chargeable Distance Tiers (JSON format)</label>
                  <textarea
                    rows={4}
                    value={JSON.stringify(deliveryConfig.deliveryFees, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setDeliveryConfig({ ...deliveryConfig, deliveryFees: parsed });
                      } catch {
                        // user typing invalid JSON temporarily
                      }
                    }}
                    className="w-full font-mono text-xs rounded-xl border border-white/10 bg-black/80 px-3 py-2 text-orange-300"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Example: {`{ "1-1.5": 40, "1.5-2": 50, "2-3": 60 }`} (range in km to fee in ₹)
                  </p>
                </div>
              </div>

              {/* Taxes & Charges */}
              <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                <h3 className="font-semibold text-orange-400">GST & Packaging Charges</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">GST Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={deliveryConfig.gstRate}
                      onChange={(e) =>
                        setDeliveryConfig({ ...deliveryConfig, gstRate: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Packaging Fee (₹)</label>
                    <input
                      type="number"
                      value={deliveryConfig.packagingFee}
                      onChange={(e) =>
                        setDeliveryConfig({ ...deliveryConfig, packagingFee: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Min Order Value (₹)</label>
                    <input
                      type="number"
                      value={deliveryConfig.minOrderValue}
                      onChange={(e) =>
                        setDeliveryConfig({ ...deliveryConfig, minOrderValue: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-orange-500 py-3 font-semibold text-black hover:bg-orange-400 disabled:opacity-50 transition"
              >
                {loading ? "Saving..." : "Save Delivery Settings"}
              </button>
            </form>
          </div>
        )}
          </div>
        )}

        {/* Dine-In & Tables Tab View */}
        {activeTab === "dinein" && (
          <div className="space-y-8 max-w-5xl mx-auto">
            {/* Action Banner */}
            <div className="rounded-[1.75rem] border border-amber-500/30 bg-[#16120E] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
                  🍽️ Dine-In Feature A
                </span>
                <h2 className="text-xl font-bold text-white mt-2">Dine-In & Table Manager</h2>
                <p className="text-xs text-zinc-400">Print QR codes for tables, monitor active tables live, and configure Dine-In payment settings.</p>
              </div>

              <div className="flex gap-2">
                <a
                  href="/admin/kot"
                  target="_blank"
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <span>🍳</span> Open KOT Kitchen Screen ↗
                </a>
              </div>
            </div>

            {/* Live Table Grid */}
            <div className="rounded-[1.75rem] border border-white/10 bg-[#16120E] p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>🪑</span> Live Table Status ({tablesStatus.length} Tables)
                  </h3>
                  <p className="text-xs text-zinc-400">Monitors live orders per table. Scanned QR codes auto-link to table numbers.</p>
                </div>
                <button
                  onClick={loadDineInConfig}
                  className="bg-black/60 hover:bg-black border border-white/10 text-xs font-semibold text-zinc-300 px-3 py-1.5 rounded-lg"
                >
                  🔄 Refresh Tables
                </button>
              </div>

              {/* Master Single Dine-In QR Code Section */}
              <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-black to-slate-950 p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
                  <div>
                    <span className="inline-block bg-amber-500 text-black text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full mb-1">
                      ⭐ Permanent QR Code
                    </span>
                    <h4 className="text-xl font-black text-amber-400">Master Dine-In QR Code</h4>
                    <p className="text-xs text-zinc-400">Single permanent QR code for your entire restaurant. Place this QR on all tables.</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const masterUrl = `${window.location.origin}/dine-in`;
                        navigator.clipboard.writeText(masterUrl);
                        setCopiedMasterUrl(true);
                        setTimeout(() => setCopiedMasterUrl(false), 3000);
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/10 transition"
                    >
                      {copiedMasterUrl ? "✅ Copied!" : "📋 Copy URL"}
                    </button>
                    <a
                      href="/dine-in"
                      target="_blank"
                      rel="noreferrer"
                      className="bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs px-3.5 py-2 rounded-xl border border-white/10 transition flex items-center gap-1"
                    >
                      👁️ Test Menu
                    </a>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                  <div className="bg-white p-3 rounded-2xl shadow-lg border-2 border-amber-500/50 flex-shrink-0">
                    <div dangerouslySetInnerHTML={{ __html: generateQRCodeSVG(`${typeof window !== "undefined" ? window.location.origin : ""}/dine-in`, 180) }} />
                  </div>

                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div>
                      <p className="text-xs text-zinc-400 font-medium">Target Destination URL:</p>
                      <p className="text-sm font-bold text-amber-300 font-mono break-all">
                        {typeof window !== "undefined" ? window.location.origin : ""}/dine-in
                      </p>
                    </div>

                    <p className="text-xs text-zinc-300">
                      Customers scan this single QR code to open the mobile-optimized Dine-In menu on their phone, select their table, choose dishes, pay via UPI, and send orders directly to your kitchen!
                    </p>

                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/dine-in`;
                        const w = window.open("", "_blank");
                        if (w) {
                          const qrHtml = generateQRCodeSVG(url, 300);
                          w.document.write(`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <title>Master Dine-In QR — NA KIRRAAK ADDA</title>
                                <style>
                                  body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; background: #f8fafc; margin: 0; }
                                  .card { border: 4px solid #f59e0b; display: inline-block; padding: 40px; border-radius: 28px; background: #ffffff; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-width: 400px; }
                                  h1 { margin: 0; font-size: 28px; color: #0f172a; font-weight: 900; tracking: wide; }
                                  .sub { margin: 6px 0 24px; color: #d97706; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
                                  .scan-box { background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 20px; padding: 20px; margin: 20px 0; }
                                  .instructions { margin: 15px 0 0; font-size: 16px; color: #1e293b; font-weight: 800; }
                                  .desc { margin: 5px 0 0; color: #64748b; font-size: 13px; }
                                  .badge { margin-top: 24px; background: #0f172a; color: #fbbf24; padding: 10px 16px; border-radius: 14px; font-size: 13px; font-weight: 800; display: inline-block; }
                                </style>
                              </head>
                              <body>
                                <div class="card">
                                  <h1>🍔 NA KIRRAAK ADDA</h1>
                                  <div class="sub">Digital Dine-In Menu</div>
                                  <div class="scan-box">
                                    ${qrHtml}
                                    <div class="instructions">📱 SCAN TO ORDER & PAY</div>
                                    <div class="desc">Scan with any Mobile Camera or UPI App (GPay, PhonePe, Paytm)</div>
                                  </div>
                                  <div class="badge">⚡ Single Master Dine-In QR Code</div>
                                </div>
                                <script>window.onload = () => { setTimeout(() => window.print(), 500); };</script>
                              </body>
                            </html>
                          `);
                        }
                      }}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center justify-center sm:justify-start gap-2"
                    >
                      <span>🖨️</span>
                      <span>Print Master Dine-In QR Code</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dine-In Payment & Tax Settings */}
            <div className="rounded-[1.75rem] border border-white/10 bg-[#16120E] p-6 lg:p-8 space-y-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>⚙️</span> Dine-In Payment & Tax Configuration
              </h3>
              <p className="text-xs text-zinc-400">Configure Dine-In tax rates (default 0%), service charges, and UPI gateway parameters.</p>

              {dineInSaveMsg && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-semibold">
                  {dineInSaveMsg}
                </div>
              )}

              <form onSubmit={handleSaveDineInConfig} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Total Tables Count</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={dineInConfig.tableCount}
                      onChange={(e) => setDineInConfig({ ...dineInConfig, tableCount: parseInt(e.target.value) || 20 })}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Dine-In GST Rate (%) [Default 0%]</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={dineInConfig.dineInGstRate}
                      onChange={(e) => setDineInConfig({ ...dineInConfig, dineInGstRate: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Dine-In Service Charge (₹) [Default ₹0]</label>
                    <input
                      type="number"
                      min="0"
                      value={dineInConfig.dineInServiceCharge}
                      onChange={(e) => setDineInConfig({ ...dineInConfig, dineInServiceCharge: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Dine-In Specific UPI ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 9966533466@ybl"
                      value={dineInConfig.dineInUpiId}
                      onChange={(e) => setDineInConfig({ ...dineInConfig, dineInUpiId: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/10">
                  <input
                    type="checkbox"
                    id="enableDineInCod"
                    checked={dineInConfig.enableDineInCod}
                    onChange={(e) => setDineInConfig({ ...dineInConfig, enableDineInCod: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded bg-slate-900 border-slate-700 focus:ring-amber-500"
                  />
                  <label htmlFor="enableDineInCod" className="text-xs text-zinc-300 font-semibold cursor-pointer">
                    Allow "Pay Cash at Table" option (By default, Pay-First online is enforced)
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-extrabold py-3 rounded-full shadow-lg transition"
                >
                  Save Dine-In Configuration
                </button>
              </form>
            </div>
          </div>
        )}
      {/* Order Details Popup Modal */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16120E] border border-amber-500/40 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  {(selectedOrderModal.orderType === "dine_in" || selectedOrderModal.address?.startsWith("Dine-In") || selectedOrderModal.tableNumber) ? `🍽️ ${selectedOrderModal.tableNumber || selectedOrderModal.address}` : "🛵 Online Delivery"}
                </span>
                <h3 className="font-extrabold text-lg text-white mt-1">Order #{selectedOrderModal.id.slice(-6).toUpperCase()}</h3>
              </div>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="text-zinc-400 hover:text-white font-bold text-xl px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-black/60 p-4 rounded-xl border border-white/10 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Customer Name:</span>
                <span className="font-bold text-white text-sm">{selectedOrderModal.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Phone Number:</span>
                <span className="font-semibold text-amber-400">📞 {selectedOrderModal.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Address / Table:</span>
                <span className="font-semibold text-white">📍 {selectedOrderModal.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Payment Method:</span>
                <span className="font-semibold text-emerald-400">💳 {selectedOrderModal.paymentMethod || "UPI"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Order Placed At:</span>
                <span className="font-medium text-zinc-300">
                  {selectedOrderModal.createdAt ? new Date(selectedOrderModal.createdAt).toLocaleString("en-IN") : "Just Now"}
                </span>
              </div>
            </div>

            {/* Itemized Receipt */}
            <div className="space-y-2 bg-black/60 p-4 rounded-xl border border-white/10 text-xs">
              <p className="font-extrabold text-amber-400 uppercase tracking-wider mb-2">Ordered Dishes Receipt:</p>
              {(typeof selectedOrderModal.items === "string" ? JSON.parse(selectedOrderModal.items) : selectedOrderModal.items || []).map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-1.5 text-sm">
                  <span className="text-white font-semibold">
                    <strong className="text-amber-400 font-black mr-1">{it.quantity}x</strong> {it.name}
                  </span>
                  <span className="font-bold text-amber-300">₹{(it.price || 0) * (it.quantity || 1)}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-base text-white pt-2 border-t border-white/10">
                <span>Grand Total</span>
                <span className="text-amber-400">₹{selectedOrderModal.total}</span>
              </div>
            </div>

            {/* Quick Status Update inside Modal */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="block text-xs font-semibold text-zinc-400">Update Order Status:</label>
              <div className="grid grid-cols-3 gap-2">
                {["Received", "Preparing", "Ready", "Completed", "Cancelled"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      handleUpdateOrderStatus(selectedOrderModal.id, st);
                      setSelectedOrderModal({ ...selectedOrderModal, status: st });
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      selectedOrderModal.status === st
                        ? "bg-amber-500 text-black border-amber-500"
                        : "bg-black/60 text-zinc-300 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Payment Screenshot Fullscreen Lightbox Modal */}
      {previewScreenshotUrl && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-2xl overflow-hidden flex flex-col items-center text-center">
            <div className="flex items-center justify-between w-full border-b border-slate-800 pb-3 px-2">
              <h3 className="font-extrabold text-base text-amber-400 flex items-center gap-2">
                <span>📸</span> Customer Payment Receipt / Screenshot
              </h3>
              <button
                type="button"
                onClick={() => setPreviewScreenshotUrl(null)}
                className="text-slate-400 hover:text-white font-bold text-xl px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-800 bg-black p-2 w-full flex items-center justify-center">
              <img
                src={previewScreenshotUrl}
                alt="Payment Screenshot Receipt"
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>

            <button
              type="button"
              onClick={() => setPreviewScreenshotUrl(null)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs shadow-lg transition"
            >
              Close Receipt Lightbox
            </button>
          </div>
        </div>
      )}

      {/* 2. Decline Payment Reason Input Modal */}
      {declineModalOrder && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16120E] border border-red-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-base text-red-400 flex items-center gap-2">
                <span>❌</span> Decline Payment Verification
              </h3>
              <button
                type="button"
                onClick={() => setDeclineModalOrder(null)}
                className="text-zinc-400 hover:text-white font-bold text-xl px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Please enter the reason for declining payment for order <strong>#{declineModalOrder.id.slice(-6).toUpperCase()}</strong> ({declineModalOrder.customerName}):
            </p>

            <textarea
              value={declineReasonInput}
              onChange={(e) => setDeclineReasonInput(e.target.value)}
              placeholder="e.g. Incorrect transaction amount, fake screenshot, or UTR mismatch..."
              className="w-full rounded-xl border border-white/10 bg-black/60 p-3 text-xs text-white outline-none focus:border-red-500 min-h-[80px]"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeclineModalOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclinePaymentSubmit}
                className="px-5 py-2 rounded-xl text-xs font-black bg-red-600 hover:bg-red-500 text-white shadow-lg"
              >
                Confirm Decline ❌
              </button>
            </div>
          </div>
        </div>
      )}


      </div>
    </div>
  );
}
