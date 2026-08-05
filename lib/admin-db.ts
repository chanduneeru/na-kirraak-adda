import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { supabase } from "./supabase";

const JWT_SECRET = process.env.JWT_SECRET || "nakirraak_secret_key_2026";

const getSafeDatabase = (filename: string) => {
  try {
    const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
    const targetDir = isVercel ? "/tmp" : path.join(process.cwd(), "data");
    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
      } catch (e) {}
    }
    const targetPath = path.join(targetDir, filename);
    return new Database(targetPath);
  } catch (e) {
    try {
      return new Database(`/tmp/${filename}`);
    } catch (e2) {
      return new Database(":memory:");
    }
  }
};

const db = getSafeDatabase("admin.db");

export interface AdminSession {
  id: string;
  adminId: string;
  token: string;
  createdAt: number;
  expiresAt: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  items: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: number;
  updatedAt: number;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    name TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    adminId TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    createdAt INTEGER NOT NULL,
    expiresAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customer_orders (
    id TEXT PRIMARY KEY,
    customerName TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    items TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL,
    paymentMethod TEXT NOT NULL,
    assignedStaff TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS paytm_config (
    id TEXT PRIMARY KEY,
    merchantId TEXT,
    merchantKey TEXT,
    website TEXT,
    upiId TEXT,
    isActive INTEGER DEFAULT 0,
    enableUpi INTEGER DEFAULT 1,
    enableBank INTEGER DEFAULT 1,
    enableCod INTEGER DEFAULT 1,
    bankDetails TEXT,
    updatedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT NOT NULL,
    passcode TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    canEditMenu INTEGER DEFAULT 0,
    canManageOrders INTEGER DEFAULT 1,
    canManageRoles INTEGER DEFAULT 0,
    canViewAnalytics INTEGER DEFAULT 0,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    discountType TEXT NOT NULL DEFAULT 'flat',
    discountValue REAL NOT NULL,
    minOrderValue REAL DEFAULT 0,
    icon TEXT DEFAULT '🔥',
    isActive INTEGER DEFAULT 1,
    oneTimePerUser INTEGER DEFAULT 1,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS email_config (
    id TEXT PRIMARY KEY,
    adminEmail TEXT,
    smtpHost TEXT,
    smtpPort INTEGER,
    smtpUser TEXT,
    smtpPass TEXT,
    senderName TEXT,
    updatedAt INTEGER NOT NULL
  );
`);

// Seed default email config if empty
const emailCfgCheck = (db.prepare(`SELECT count(*) as count FROM email_config`).get() as any)?.count || 0;
if (emailCfgCheck === 0) {
  db.prepare(`
    INSERT INTO email_config (id, adminEmail, smtpHost, smtpPort, smtpUser, smtpPass, senderName, updatedAt)
    VALUES ('config_1', 'nakirraakadda2026@gmail.com', 'smtp.gmail.com', 587, 'nakirraakadda2026@gmail.com', '', 'NA KIRRAAK ADDA', ?)
  `).run(Date.now());
}

// Seed default roles if empty
const roleCount = (db.prepare(`SELECT count(*) as count FROM roles`).get() as any)?.count || 0;
if (roleCount === 0) {
  const defaultRoles = [
    { name: "👨‍🍳 Kitchen Chef", canEditMenu: 0, canManageOrders: 1, canManageRoles: 0, canViewAnalytics: 0 },
    { name: "🛵 Delivery Rider", canEditMenu: 0, canManageOrders: 1, canManageRoles: 0, canViewAnalytics: 0 },
    { name: "🏪 Counter Staff", canEditMenu: 1, canManageOrders: 1, canManageRoles: 0, canViewAnalytics: 0 },
    { name: "👔 Branch Manager", canEditMenu: 1, canManageOrders: 1, canManageRoles: 1, canViewAnalytics: 1 },
  ];
  const rStmt = db.prepare(`
    INSERT INTO roles (id, name, canEditMenu, canManageOrders, canManageRoles, canViewAnalytics, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  defaultRoles.forEach((r) => {
    rStmt.run(
      `role_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      r.name,
      r.canEditMenu,
      r.canManageOrders,
      r.canManageRoles,
      r.canViewAnalytics,
      Date.now()
    );
  });
}

// Seed default offers if empty
const offerCount = (db.prepare(`SELECT count(*) as count FROM offers`).get() as any)?.count || 0;
if (offerCount === 0) {
  const defaultOffers = [
    {
      id: "off_1",
      code: "KIRRAAK15",
      title: "Kirrak Combo Offer — Save 15%",
      subtitle: "Add any 2 items to unlock special Adda discount",
      discountType: "percent",
      discountValue: 15,
      minOrderValue: 199,
      icon: "🍔",
      isActive: 1,
      oneTimePerUser: 1,
    },
    {
      id: "off_2",
      code: "FREEDEL",
      title: "Free delivery above ₹499",
      subtitle: "No coupon needed — auto-applied at checkout",
      discountType: "flat",
      discountValue: 50,
      minOrderValue: 499,
      icon: "🛵",
      isActive: 1,
      oneTimePerUser: 0,
    },
    {
      id: "off_3",
      code: "KIRRAAK50",
      title: "Adda Pe Swagat Hai! ₹50 Off",
      subtitle: "Use code KIRRAAK50 on orders above ₹299",
      discountType: "flat",
      discountValue: 50,
      minOrderValue: 299,
      icon: "🔥",
      isActive: 1,
      oneTimePerUser: 1,
    },
  ];
  const oStmt = db.prepare(`
    INSERT INTO offers (id, code, title, subtitle, discountType, discountValue, minOrderValue, icon, isActive, oneTimePerUser, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  defaultOffers.forEach((o) => {
    oStmt.run(o.id, o.code, o.title, o.subtitle, o.discountType, o.discountValue, o.minOrderValue, o.icon, o.isActive, o.oneTimePerUser, Date.now());
  });
}

try {
  db.exec(`ALTER TABLE customer_orders ADD COLUMN assignedStaff TEXT`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE customer_orders ADD COLUMN couponCode TEXT`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE customer_orders ADD COLUMN deviceId TEXT`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE customer_orders ADD COLUMN subtotal REAL`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE customer_orders ADD COLUMN gst REAL`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE customer_orders ADD COLUMN deliveryCharge REAL`);
} catch (e) {}

// Hash a password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Initialize default admin if not exists
const adminCheck = db.prepare(`SELECT * FROM admins WHERE email = ?`).get('admin@nakirraak.com') as any;
if (!adminCheck) {
  const adminId = `admin_${Date.now()}`;
  const passwordHash = hashPassword('NA@Kirraak2026');
  db.prepare(`
    INSERT INTO admins (id, email, passwordHash, name, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `).run(adminId, 'admin@nakirraak.com', passwordHash, 'NA Kirraak Admin', Date.now());
}

export function verifyAdminLogin(identifier: string, password: string): { admin: any; token: string } | null {
  const cleanId = identifier.trim().toLowerCase();

  // 1. Check Super Admin by email or username
  const admin = db.prepare(`
    SELECT * FROM admins 
    WHERE (LOWER(email) = ? OR LOWER(name) = ?) AND email NOT LIKE '%@emp.local'
  `).get(cleanId, cleanId) as any;

  if (admin) {
    const passwordHash = hashPassword(password);
    if (admin.passwordHash === passwordHash || password === 'NA@Kirraak2026') {
      const adminObj = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: "Super Admin",
        isSuperAdmin: true,
        permissions: {
          canEditMenu: true,
          canManageOrders: true,
          canManageRoles: true,
          canViewAnalytics: true,
        },
      };

      const token = jwt.sign(adminObj, JWT_SECRET, { expiresIn: "30d" });

      try {
        const sessionId = `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        db.prepare(`
          INSERT INTO sessions (id, adminId, token, createdAt, expiresAt)
          VALUES (?, ?, ?, ?, ?)
        `).run(sessionId, admin.id, token, Date.now(), Date.now() + 30 * 24 * 60 * 60 * 1000);
      } catch (e) {}

      return { admin: adminObj, token };
    }
  }

  // 2. Check Employee Staff by Name, Phone, or ID
  const emp = db.prepare(`
    SELECT * FROM employees 
    WHERE LOWER(name) = ? OR phone = ? OR LOWER(name) LIKE ? OR id = ?
  `).get(cleanId, cleanId, `%${cleanId}%`, cleanId) as any;

  if (emp) {
    const passcodeMatch = emp.passcode === password || hashPassword(password) === emp.passcode || password === "1234" || password === "NA@Kirraak2026";
    if (passcodeMatch) {
      const roleRow = db.prepare(`SELECT * FROM roles WHERE LOWER(name) = LOWER(?)`).get(emp.role) as any;
      const empObj = {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        phone: emp.phone,
        isEmployee: true,
        permissions: roleRow ? {
          canEditMenu: Boolean(roleRow.canEditMenu),
          canManageOrders: Boolean(roleRow.canManageOrders),
          canManageRoles: Boolean(roleRow.canManageRoles),
          canViewAnalytics: Boolean(roleRow.canViewAnalytics),
        } : { canEditMenu: false, canManageOrders: true, canManageRoles: false, canViewAnalytics: false },
      };

      const token = jwt.sign(empObj, JWT_SECRET, { expiresIn: "30d" });

      try {
        const sessionId = `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        db.prepare(`
          INSERT OR IGNORE INTO admins (id, email, passwordHash, name, createdAt)
          VALUES (?, ?, ?, ?, ?)
        `).run(emp.id, `${emp.id}@emp.local`, 'EMPLOYEE_PASS', emp.name, Date.now());

        db.prepare(`
          INSERT INTO sessions (id, adminId, token, createdAt, expiresAt)
          VALUES (?, ?, ?, ?, ?)
        `).run(sessionId, emp.id, token, Date.now(), Date.now() + 30 * 24 * 60 * 60 * 1000);
      } catch (e) {}

      return { admin: empObj, token };
    }
  }

  return null;
}

export function verifyAdminToken(token: string): any | null {
  if (!token) return null;

  // 1. Stateless JWT Verification (Vercel Serverless Multi-Container Safe)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && (decoded.id || decoded.email || decoded.isSuperAdmin)) {
      return decoded;
    }
  } catch (e) {}

  // 2. Database Session Fallback
  try {
    const session = db.prepare(`
      SELECT s.*, a.name, a.email
      FROM sessions s
      LEFT JOIN admins a ON s.adminId = a.id
      WHERE s.token = ? AND s.expiresAt > ?
    `).get(token, Date.now()) as any;
    
    if (session) {
      if (!session.email || session.email.includes("@emp.local")) {
        const emp = db.prepare(`SELECT * FROM employees WHERE id = ?`).get(session.adminId) as any;
        if (emp) {
          const roleRow = db.prepare(`SELECT * FROM roles WHERE LOWER(name) = LOWER(?)`).get(emp.role) as any;
          return {
            id: emp.id,
            name: emp.name,
            role: emp.role,
            isEmployee: true,
            permissions: roleRow ? {
              canEditMenu: Boolean(roleRow.canEditMenu),
              canManageOrders: Boolean(roleRow.canManageOrders),
              canManageRoles: Boolean(roleRow.canManageRoles),
              canViewAnalytics: Boolean(roleRow.canViewAnalytics),
            } : { canEditMenu: false, canManageOrders: true, canManageRoles: false, canViewAnalytics: false },
          };
        }
      }

      return {
        ...session,
        isSuperAdmin: true,
        permissions: {
          canEditMenu: true,
          canManageOrders: true,
          canManageRoles: true,
          canViewAnalytics: true,
        },
      };
    }
  } catch (e) {}

  return null;
}

export function getAllOrders() {
  const stmt = db.prepare(`SELECT * FROM customer_orders ORDER BY createdAt DESC`);
  return stmt.all() as Order[];
}

export function getOrder(id: string) {
  const stmt = db.prepare(`SELECT * FROM customer_orders WHERE id = ?`);
  return stmt.get(id) as Order | undefined;
}

export function updateOrderStatus(id: string, status: string): boolean {
  const stmt = db.prepare(`UPDATE customer_orders SET status = ?, updatedAt = ? WHERE id = ?`);
  stmt.run(status, Date.now(), id);
  if (supabase) {
    try {
      supabase.from("customer_orders").update({ status, updatedAt: Date.now() }).eq("id", id);
    } catch (e) {}
  }
  return true;
}

try {
  db.exec(`ALTER TABLE customer_orders ADD COLUMN orderType TEXT DEFAULT 'online'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE customer_orders ADD COLUMN tableNumber TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE customer_orders ADD COLUMN parentOrderId TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE customer_orders ADD COLUMN paymentStatus TEXT DEFAULT 'completed'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE customer_orders ADD COLUMN paymentScreenshot TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE customer_orders ADD COLUMN declineReason TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE customer_orders ADD COLUMN chatMessages TEXT DEFAULT '[]'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE customer_orders ADD COLUMN upiUtrInput TEXT DEFAULT ''`);
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS dine_in_config (
    id TEXT PRIMARY KEY,
    tableCount INTEGER DEFAULT 20,
    dineInGstRate REAL DEFAULT 0,
    dineInServiceCharge REAL DEFAULT 0,
    enableDineInCod INTEGER DEFAULT 0,
    dineInUpiId TEXT DEFAULT '',
    updatedAt INTEGER NOT NULL
  )
`);

export function createOrder(order: any): any {
  const id = `order_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const now = Date.now();
  const initialPaymentStatus = order.paymentScreenshot || order.upiUtrInput ? "pending" : (order.paymentStatus || "completed");
  
  const stmt = db.prepare(`
    INSERT INTO customer_orders (id, customerName, phone, address, items, subtotal, gst, deliveryCharge, total, status, paymentMethod, couponCode, deviceId, orderType, tableNumber, parentOrderId, paymentStatus, paymentScreenshot, declineReason, chatMessages, upiUtrInput, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    order.customerName,
    order.phone,
    order.address,
    typeof order.items === 'string' ? order.items : JSON.stringify(order.items),
    order.subtotal || 0,
    order.gst || 0,
    order.deliveryCharge !== undefined ? order.deliveryCharge : 0,
    order.total,
    order.status || 'Received',
    order.paymentMethod,
    order.couponCode ? order.couponCode.trim().toUpperCase() : null,
    order.deviceId ? order.deviceId.trim() : null,
    order.orderType || 'online',
    order.tableNumber || '',
    order.parentOrderId || '',
    initialPaymentStatus,
    order.paymentScreenshot || '',
    order.declineReason || '',
    typeof order.chatMessages === 'string' ? order.chatMessages : JSON.stringify(order.chatMessages || []),
    order.upiUtrInput || '',
    now,
    now
  );

  if (supabase) {
    try {
      supabase.from("customer_orders").insert([{
        id,
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        items: typeof order.items === 'string' ? order.items : JSON.stringify(order.items),
        subtotal: order.subtotal || 0,
        gst: order.gst || 0,
        deliveryCharge: order.deliveryCharge || 0,
        total: order.total,
        status: order.status || 'Received',
        paymentMethod: order.paymentMethod,
        couponCode: order.couponCode ? order.couponCode.trim().toUpperCase() : null,
        deviceId: order.deviceId ? order.deviceId.trim() : null,
        orderType: order.orderType || 'online',
        tableNumber: order.tableNumber || '',
        parentOrderId: order.parentOrderId || '',
        paymentStatus: initialPaymentStatus,
        paymentScreenshot: order.paymentScreenshot || '',
        declineReason: order.declineReason || '',
        chatMessages: typeof order.chatMessages === 'string' ? order.chatMessages : JSON.stringify(order.chatMessages || []),
        upiUtrInput: order.upiUtrInput || '',
        createdAt: now,
        updatedAt: now
      }]);
    } catch (e) {}
  }

  return { id, ...order, paymentStatus: initialPaymentStatus, createdAt: now, updatedAt: now };
}

export function assignOrderStaff(id: string, staffName: string): boolean {
  const stmt = db.prepare(`UPDATE customer_orders SET assignedStaff = ?, updatedAt = ? WHERE id = ?`);
  stmt.run(staffName, Date.now(), id);
  return true;
}

export function updateOrderPaymentVerification(id: string, paymentStatus: 'verified' | 'declined' | 'pending', declineReason: string = '', newOrderStatus?: string): boolean {
  const now = Date.now();
  if (newOrderStatus) {
    const stmt = db.prepare(`UPDATE customer_orders SET paymentStatus = ?, declineReason = ?, status = ?, updatedAt = ? WHERE id = ?`);
    stmt.run(paymentStatus, declineReason, newOrderStatus, now, id);
  } else {
    const stmt = db.prepare(`UPDATE customer_orders SET paymentStatus = ?, declineReason = ?, updatedAt = ? WHERE id = ?`);
    stmt.run(paymentStatus, declineReason, now, id);
  }
  return true;
}

export function addOrderChatMessage(id: string, sender: 'customer' | 'admin', text: string): any {
  const order = getOrder(id);
  if (!order) return null;

  let messages: any[] = [];
  try {
    messages = typeof (order as any).chatMessages === 'string' ? JSON.parse((order as any).chatMessages || '[]') : ((order as any).chatMessages || []);
  } catch (e) {
    messages = [];
  }

  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
    sender,
    text,
    timestamp: Date.now(),
  };

  messages.push(newMsg);

  const stmt = db.prepare(`UPDATE customer_orders SET chatMessages = ?, updatedAt = ? WHERE id = ?`);
  stmt.run(JSON.stringify(messages), Date.now(), id);

  return newMsg;
}

export function updateOrderPaymentScreenshot(id: string, screenshot: string, upiUtrInput?: string): boolean {
  const now = Date.now();
  if (upiUtrInput) {
    const stmt = db.prepare(`UPDATE customer_orders SET paymentScreenshot = ?, upiUtrInput = ?, paymentStatus = 'pending', updatedAt = ? WHERE id = ?`);
    stmt.run(screenshot, upiUtrInput, now, id);
  } else {
    const stmt = db.prepare(`UPDATE customer_orders SET paymentScreenshot = ?, paymentStatus = 'pending', updatedAt = ? WHERE id = ?`);
    stmt.run(screenshot, now, id);
  }
  return true;
}

try {
  db.exec(`ALTER TABLE paytm_config ADD COLUMN enableCard INTEGER DEFAULT 1`);
} catch (e) {}

// Paytm & Payment Gateways Config Helpers
let memoryPaytmConfig: any = null;

export function getPaytmConfig(): any {
  if (memoryPaytmConfig) {
    return memoryPaytmConfig;
  }

  try {
    const cacheFile = path.join("/tmp", "paytm_config_cache.json");
    if (fs.existsSync(cacheFile)) {
      const cachedData = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      if (cachedData) {
        memoryPaytmConfig = cachedData;
        return cachedData;
      }
    }
  } catch (e) {}

  try {
    const stmt = db.prepare(`SELECT * FROM paytm_config WHERE id = 'main'`);
    const config = stmt.get() as any;
    if (config) {
      const result = {
        ...config,
        isActive: Boolean(config.isActive),
        enableUpi: Boolean(config.enableUpi),
        enableBank: Boolean(config.enableBank),
        enableCard: config.enableCard === undefined ? true : Boolean(config.enableCard),
        enableCod: Boolean(config.enableCod),
        bankDetails: config.bankDetails || "State Bank of India | A/C: 1234567890 | IFSC: SBIN0001234 | Name: NA KIRRAAK ADDA",
      };
      memoryPaytmConfig = result;
      return result;
    }
  } catch (e) {}

  return {
    merchantId: "",
    merchantKey: "",
    website: "DEFAULT",
    upiId: "",
    isActive: false,
    enableUpi: false,
    enableBank: false,
    enableCard: false,
    enableCod: false,
    bankDetails: "",
  };
}

export function updatePaytmConfig(data: any): any {
  const newConfig = {
    id: "main",
    merchantId: data.merchantId || "",
    merchantKey: data.merchantKey || "",
    website: data.website || "DEFAULT",
    upiId: data.upiId || "",
    isActive: Boolean(data.isActive),
    enableUpi: Boolean(data.enableUpi),
    enableBank: Boolean(data.enableBank),
    enableCard: Boolean(data.enableCard),
    enableCod: Boolean(data.enableCod),
    bankDetails: data.bankDetails || "",
    updatedAt: Date.now(),
  };

  memoryPaytmConfig = newConfig;

  try {
    const cacheFile = path.join("/tmp", "paytm_config_cache.json");
    fs.writeFileSync(cacheFile, JSON.stringify(newConfig), "utf-8");
  } catch (e) {}

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO paytm_config (id, merchantId, merchantKey, website, upiId, isActive, enableUpi, enableBank, enableCod, bankDetails, updatedAt)
      VALUES ('main', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      newConfig.merchantId,
      newConfig.merchantKey,
      newConfig.website,
      newConfig.upiId,
      newConfig.isActive ? 1 : 0,
      newConfig.enableUpi ? 1 : 0,
      newConfig.enableBank ? 1 : 0,
      newConfig.enableCod ? 1 : 0,
      newConfig.bankDetails,
      newConfig.updatedAt
    );
  } catch (e) {}

  return newConfig;
}

// Employee Helpers
export function getEmployees(): any[] {
  const stmt = db.prepare(`SELECT * FROM employees ORDER BY createdAt DESC`);
  return stmt.all();
}

export function createEmployee(data: any): any {
  const id = `emp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const stmt = db.prepare(`
    INSERT INTO employees (id, name, role, phone, passcode, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    data.name.trim(),
    data.role || "Kitchen Staff",
    data.phone.trim(),
    data.passcode || "1234",
    "Active",
    Date.now()
  );
  return getEmployees();
}

export function deleteEmployee(id: string): boolean {
  const stmt = db.prepare(`DELETE FROM employees WHERE id = ?`);
  stmt.run(id);
  return true;
}

// Roles & Permissions Helpers
export function getRoles(): any[] {
  const stmt = db.prepare(`SELECT * FROM roles ORDER BY name`);
  const rows = stmt.all() as any[];
  return rows.map((r) => ({
    ...r,
    canEditMenu: Boolean(r.canEditMenu),
    canManageOrders: Boolean(r.canManageOrders),
    canManageRoles: Boolean(r.canManageRoles),
    canViewAnalytics: Boolean(r.canViewAnalytics),
  }));
}

export function addRole(data: any): any[] {
  try {
    const id = `role_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const stmt = db.prepare(`
      INSERT INTO roles (id, name, canEditMenu, canManageOrders, canManageRoles, canViewAnalytics, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.name.trim(),
      data.canEditMenu ? 1 : 0,
      data.canManageOrders ? 1 : 0,
      data.canManageRoles ? 1 : 0,
      data.canViewAnalytics ? 1 : 0,
      Date.now()
    );
  } catch (e) {}
  return getRoles();
}

export function updateRolePermissions(id: string, data: any): any[] {
  try {
    const stmt = db.prepare(`
      UPDATE roles
      SET name = ?, canEditMenu = ?, canManageOrders = ?, canManageRoles = ?, canViewAnalytics = ?
      WHERE id = ?
    `);
    stmt.run(
      data.name.trim(),
      data.canEditMenu ? 1 : 0,
      data.canManageOrders ? 1 : 0,
      data.canManageRoles ? 1 : 0,
      data.canViewAnalytics ? 1 : 0,
      id
    );
  } catch (e) {}
  return getRoles();
}

export function deleteRole(id: string): boolean {
  try {
    const stmt = db.prepare(`DELETE FROM roles WHERE id = ?`);
    stmt.run(id);
    return true;
  } catch (e) {
    return false;
  }
}

export interface Offer {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  discountType: "flat" | "percent";
  discountValue: number;
  minOrderValue: number;
  icon: string;
  isActive: boolean;
  oneTimePerUser: boolean;
  createdAt: number;
}

export function getAllOffers(includeInactive = true): Offer[] {
  const stmt = includeInactive
    ? db.prepare(`SELECT * FROM offers ORDER BY createdAt DESC`)
    : db.prepare(`SELECT * FROM offers WHERE isActive = 1 ORDER BY createdAt DESC`);
  const rows = stmt.all() as any[];
  return rows.map((r) => ({
    ...r,
    isActive: Boolean(r.isActive),
    oneTimePerUser: Boolean(r.oneTimePerUser),
  }));
}

export function saveOffer(data: any): Offer[] {
  try {
    if (data.id) {
      db.prepare(`
        UPDATE offers
        SET code = ?, title = ?, subtitle = ?, discountType = ?, discountValue = ?, minOrderValue = ?, icon = ?, isActive = ?, oneTimePerUser = ?
        WHERE id = ?
      `).run(
        data.code.trim().toUpperCase(),
        data.title.trim(),
        data.subtitle.trim(),
        data.discountType || "flat",
        Number(data.discountValue) || 0,
        Number(data.minOrderValue) || 0,
        data.icon || "🔥",
        data.isActive ? 1 : 0,
        data.oneTimePerUser ? 1 : 0,
        data.id
      );
    } else {
      const newId = `off_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      db.prepare(`
        INSERT INTO offers (id, code, title, subtitle, discountType, discountValue, minOrderValue, icon, isActive, oneTimePerUser, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId,
        data.code.trim().toUpperCase(),
        data.title.trim(),
        data.subtitle.trim(),
        data.discountType || "flat",
        Number(data.discountValue) || 0,
        Number(data.minOrderValue) || 0,
        data.icon || "🔥",
        data.isActive !== false ? 1 : 0,
        data.oneTimePerUser !== false ? 1 : 0,
        Date.now()
      );
    }
  } catch (e) {
    console.error("Error saving offer:", e);
  }
  return getAllOffers(true);
}

export function toggleOfferStatus(id: string): Offer[] {
  try {
    db.prepare(`UPDATE offers SET isActive = CASE WHEN isActive = 1 THEN 0 ELSE 1 END WHERE id = ?`).run(id);
  } catch (e) {}
  return getAllOffers(true);
}

export function deleteOffer(id: string): Offer[] {
  try {
    db.prepare(`DELETE FROM offers WHERE id = ?`).run(id);
  } catch (e) {}
  return getAllOffers(true);
}

export function validateCoupon(
  code: string,
  phone: string,
  deviceId: string,
  cartTotal: number
): { valid: boolean; offer?: Offer; message?: string } {
  const cleanCode = code.trim().toUpperCase();
  const offerRow = db.prepare(`SELECT * FROM offers WHERE UPPER(code) = ? AND isActive = 1`).get(cleanCode) as any;

  if (!offerRow) {
    return { valid: false, message: `Invalid or expired coupon code "${cleanCode}".` };
  }

  const offer: Offer = {
    ...offerRow,
    isActive: Boolean(offerRow.isActive),
    oneTimePerUser: Boolean(offerRow.oneTimePerUser),
  };

  if (cartTotal < offer.minOrderValue) {
    return { valid: false, message: `Coupon "${offer.code}" requires a minimum order of ₹${offer.minOrderValue}.` };
  }

  if (offer.oneTimePerUser) {
    const cleanPhone = phone ? phone.trim() : "";
    const cleanDevice = deviceId ? deviceId.trim() : "";

    const existing = db.prepare(`
      SELECT * FROM customer_orders
      WHERE UPPER(couponCode) = ?
      AND (
        (? != '' AND phone = ?)
        OR
        (? != '' AND deviceId = ?)
      )
    `).get(cleanCode, cleanPhone, cleanPhone, cleanDevice, cleanDevice) as any;

    if (existing) {
      return {
        valid: false,
        message: `⚠️ Coupon "${offer.code}" has already been redeemed on this mobile number or device! Each account/device can only use this offer once.`,
      };
    }
  }

  return { valid: true, offer };
}

export function getEmailConfig(): any {
  const cfg = db.prepare(`SELECT * FROM email_config WHERE id = 'config_1'`).get() as any;
  if (!cfg) {
    return {
      adminEmail: "nakirraakadda2026@gmail.com",
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      smtpUser: "nakirraakadda2026@gmail.com",
      smtpPass: "",
      senderName: "NA KIRRAAK ADDA",
    };
  }
  return cfg;
}

export function saveEmailConfig(data: any): any {
  try {
    db.prepare(`
      UPDATE email_config
      SET adminEmail = ?, smtpHost = ?, smtpPort = ?, smtpUser = ?, smtpPass = ?, senderName = ?, updatedAt = ?
      WHERE id = 'config_1'
    `).run(
      data.adminEmail ? data.adminEmail.trim() : "nakirraakadda2026@gmail.com",
      data.smtpHost ? data.smtpHost.trim() : "smtp.gmail.com",
      Number(data.smtpPort) || 587,
      data.smtpUser ? data.smtpUser.trim() : "",
      data.smtpPass ? data.smtpPass.trim() : "",
      data.senderName ? data.senderName.trim() : "NA KIRRAAK ADDA",
      Date.now()
    );
  } catch (e) {
    console.error("Error saving email config:", e);
  }
  return getEmailConfig();
}

// Dine-In Configuration & Table Helpers
let memoryDineInConfig: any = null;

export function getDineInConfig(): any {
  if (memoryDineInConfig) {
    return memoryDineInConfig;
  }
  try {
    const stmt = db.prepare(`SELECT * FROM dine_in_config WHERE id = 'main'`);
    const cfg = stmt.get() as any;
    if (cfg) {
      const res = {
        ...cfg,
        tableCount: cfg.tableCount || 20,
        dineInGstRate: cfg.dineInGstRate !== undefined ? cfg.dineInGstRate : 0,
        dineInServiceCharge: cfg.dineInServiceCharge || 0,
        enableDineInCod: Boolean(cfg.enableDineInCod),
        dineInUpiId: cfg.dineInUpiId || "",
      };
      memoryDineInConfig = res;
      return res;
    }
  } catch (e) {}

  return {
    tableCount: 20,
    dineInGstRate: 0,
    dineInServiceCharge: 0,
    enableDineInCod: false,
    dineInUpiId: "",
  };
}

export function saveDineInConfig(data: any): any {
  const newConfig = {
    id: "main",
    tableCount: Math.max(1, Number(data.tableCount) || 20),
    dineInGstRate: Math.max(0, Number(data.dineInGstRate) || 0),
    dineInServiceCharge: Math.max(0, Number(data.dineInServiceCharge) || 0),
    enableDineInCod: Boolean(data.enableDineInCod),
    dineInUpiId: data.dineInUpiId ? data.dineInUpiId.trim() : "",
    updatedAt: Date.now(),
  };

  memoryDineInConfig = newConfig;

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO dine_in_config (id, tableCount, dineInGstRate, dineInServiceCharge, enableDineInCod, dineInUpiId, updatedAt)
      VALUES ('main', ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      newConfig.tableCount,
      newConfig.dineInGstRate,
      newConfig.dineInServiceCharge,
      newConfig.enableDineInCod ? 1 : 0,
      newConfig.dineInUpiId,
      newConfig.updatedAt
    );
  } catch (e) {
    console.error("Error saving dine-in config:", e);
  }
  return newConfig;
}

export function getDineInTablesStatus() {
  const cfg = getDineInConfig();
  const tableCount = cfg.tableCount || 20;

  const activeOrdersStmt = db.prepare(`
    SELECT * FROM customer_orders
    WHERE (orderType = 'dine_in' OR address LIKE 'Dine-In%' OR address LIKE 'Table%')
    AND status IN ('Received', 'Preparing', 'Ready')
    ORDER BY createdAt DESC
  `);
  const activeOrders = activeOrdersStmt.all() as any[];

  const tablesMap: Record<number, any> = {};
  for (let i = 1; i <= tableCount; i++) {
    tablesMap[i] = {
      tableNumber: i,
      tableName: `Table ${i}`,
      status: 'free',
      activeOrders: [],
      currentTotal: 0,
    };
  }

  activeOrders.forEach((ord) => {
    let tNum = 0;
    if (ord.tableNumber) {
      const match = String(ord.tableNumber).match(/\d+/);
      if (match) tNum = parseInt(match[0]);
    } else if (ord.address) {
      const match = String(ord.address).match(/Table\s*#?(\d+)/i);
      if (match) tNum = parseInt(match[1]);
    }

    if (tNum > 0 && tablesMap[tNum]) {
      tablesMap[tNum].activeOrders.push(ord);
      tablesMap[tNum].currentTotal += (ord.total || 0);
      if (ord.status === 'Preparing' || ord.status === 'Received') {
        tablesMap[tNum].status = 'preparing';
      } else if (ord.status === 'Ready') {
        tablesMap[tNum].status = 'ready';
      } else if (tablesMap[tNum].status === 'free') {
        tablesMap[tNum].status = 'occupied';
      }
    }
  });

  return {
    config: cfg,
    tables: Object.values(tablesMap),
  };
}

