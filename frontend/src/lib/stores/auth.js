import { writable, get } from "svelte/store";
import { browser } from "$app/environment";
import { addCustomer } from "./coreManagement.js";
import { authApi } from "$lib/api.js";

// Enterprise Password Policy Validator:
// 1. More than 8 characters (length >= 9)
// 2. At least 1 uppercase letter (A-Z)
// 3. At least 1 lowercase letter (a-z)
// 4. At least 1 special character (!@#$%^&* etc.)
export function validatePasswordPolicy(password) {
  const hasLength = typeof password === "string" && password.length >= 9;
  const hasUpper = /[A-Z]/.test(password || "");
  const hasLower = /[a-z]/.test(password || "");
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password || "");

  return {
    hasLength,
    hasUpper,
    hasLower,
    hasSpecial,
    isValid: hasLength && hasUpper && hasLower && hasSpecial
  };
}

// Extract company domain from company email (e.g., name@acme.com -> acme.com -> Acme)
export function parseCompanyFromEmail(email) {
  if (!email || !email.includes("@")) return { domain: "", suggestedCompany: "" };
  const parts = email.split("@");
  const domain = parts[1] ? parts[1].toLowerCase().trim() : "";
  if (!domain) return { domain: "", suggestedCompany: "" };
  
  // Extract main domain before TLD: e.g. "nexushealth" from "nexushealth.org"
  const domainParts = domain.split(".");
  const namePart = domainParts[0] || "";
  const suggestedCompany = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  return { domain, suggestedCompany };
}

// Initial registered users with enterprise roles
const initialUsers = [
  {
    id: "USR-001",
    email: "admin@brightloop.io",
    password: "BrightloopAdmin2026!",
    name: "Brightloop Admin",
    company: "Brightloop Software Inc.",
    role: "Administrator",
    avatar: "AD",
    customerId: null
  },
  {
    id: "USR-002",
    email: "sales@brightloop.io",
    password: "BrightloopStaff2026!",
    name: "Sarah Jenkins (Staff)",
    company: "Brightloop Software Inc.",
    role: "Staff Operations",
    avatar: "SJ",
    customerId: null
  },
  {
    id: "USR-003",
    email: "eleanor.vance@nexushealth.org",
    password: "CustomerSecret2026!",
    name: "Dr. Eleanor Vance",
    company: "Nexus Health Systems",
    role: "Customer Portal",
    avatar: "EV",
    customerId: "CUST-1001"
  },
  {
    id: "USR-004",
    email: "billing@apexlogistics.com",
    password: "ApexPassword2026!",
    name: "Marcus Brody",
    company: "Apex Logistics Corp",
    role: "Customer Portal",
    avatar: "MB",
    customerId: "CUST-1002"
  },
  {
    id: "USR-005",
    email: "contact@greenleaf.shop",
    password: "Greenleaf2026!",
    name: "Greenleaf Operations",
    company: "Greenleaf Retailers Inc.",
    role: "Customer Portal",
    avatar: "GL",
    customerId: "CUST-1003"
  }
];

function getStored(key, fallback) {
  if (!browser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
}

function setStored(key, value) {
  if (!browser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

export const usersStore = writable(getStored("bl_users", initialUsers));
if (browser) {
  usersStore.subscribe(val => setStored("bl_users", val));
}

// Active Password Reset Tokens table
export const resetTokensStore = writable(getStored("bl_reset_tokens", []));
if (browser) {
  resetTokensStore.subscribe(val => setStored("bl_reset_tokens", val));
}

const defaultUser = {
  name: "Dr. Eleanor Vance",
  email: "eleanor.vance@nexushealth.org",
  company: "Nexus Health Systems",
  role: "Enterprise Administrator",
  avatar: "EV",
  phone: "+1 (555) 234-8901",
  plan: "Growth Cloud Monthly",
  billingCycle: "Monthly",
  customerId: "CUST-1001",
  status: "Active"
};

function getSavedUser() {
  if (browser) {
    const saved = localStorage.getItem("bl_user") || localStorage.getItem("bl_current_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved user:", e);
      }
    }
  }
  return defaultUser;
}

const initialAuth = browser ? localStorage.getItem("bl_auth") === "true" : false;
export const isAuthenticated = writable(initialAuth);
export const currentUser = writable(getSavedUser());
if (browser) {
  currentUser.subscribe(val => {
    setStored("bl_user", val);
    setStored("bl_current_user", val);
  });
}

// Email uniqueness check (case-insensitive)
export function isEmailRegistered(email) {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const users = get(usersStore);
  return users.some(u => u.email.toLowerCase().trim() === normalized);
}

// Customer Registration with strict validation
export function registerCustomer({ name, company, email, password, phone, billing_address }) {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Uniqueness check
  if (isEmailRegistered(normalizedEmail)) {
    throw new Error(`Email '${normalizedEmail}' is already registered. Each email address can belong to only one account.`);
  }

  // 2. Strict password policy check
  const policy = validatePasswordPolicy(password);
  if (!policy.isValid) {
    throw new Error("Password does not meet enterprise security requirements (length > 8, uppercase, lowercase, special character).");
  }

  // 3. Create customer record in customer directory
  const newCustomer = addCustomer({
    name,
    company,
    email: normalizedEmail,
    phone: phone || "",
    billing_address: billing_address || `${company} Headquarters`
  });

  // 4. Create user record
  const newUser = {
    id: `USR-${Date.now()}`,
    email: normalizedEmail,
    password, // in real backend: bcrypt hash
    name,
    company,
    role: "Customer Portal",
    avatar: name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    customerId: newCustomer.customer_number,
    createdAt: new Date().toISOString()
  };

  usersStore.update(list => [...list, newUser]);

  return { user: newUser, customer: newCustomer };
}

// Forgot Password: generate a reset token and return reset link
export function requestPasswordReset(email) {
  if (!email) throw new Error("Please provide your registered email address.");
  const normalized = email.toLowerCase().trim();
  const users = get(usersStore);
  const user = users.find(u => u.email.toLowerCase().trim() === normalized);

  if (!user) {
    throw new Error(`No account found registered under '${email}'. Please verify your email.`);
  }

  const token = "tok_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
  const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour validity

  const tokenRecord = {
    token,
    email: normalized,
    company: user.company,
    name: user.name,
    expiry,
    used: false,
    createdAt: new Date().toISOString()
  };

  resetTokensStore.update(tokens => [tokenRecord, ...tokens]);

  const origin = browser ? window.location.origin : "";
  const resetUrl = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(normalized)}`;

  return {
    success: true,
    token,
    resetUrl,
    expiry,
    email: normalized,
    user
  };
}

// Verify reset token validity
export function verifyResetToken(token) {
  if (!token) return { valid: false, reason: "No reset token provided." };
  const tokens = get(resetTokensStore);
  const found = tokens.find(t => t.token === token);

  if (!found) return { valid: false, reason: "Invalid reset token." };
  if (found.used) return { valid: false, reason: "This reset link has already been used." };
  if (new Date(found.expiry) < new Date()) return { valid: false, reason: "This reset link has expired." };

  return { valid: true, tokenRecord: found };
}

// Reset password for token
export function resetPasswordWithToken(token, newPassword) {
  const verification = verifyResetToken(token);
  if (!verification.valid) {
    throw new Error(verification.reason);
  }

  const policy = validatePasswordPolicy(newPassword);
  if (!policy.isValid) {
    throw new Error("New password does not satisfy Brightloop password security policy.");
  }

  const email = verification.tokenRecord.email;

  // Update user password in usersStore
  usersStore.update(users =>
    users.map(u => (u.email.toLowerCase().trim() === email ? { ...u, password: newPassword } : u))
  );

  // Mark token as used
  resetTokensStore.update(tokens =>
    tokens.map(t => (t.token === token ? { ...t, used: true, usedAt: new Date().toISOString() } : t))
  );

  return { success: true, email };
}

export async function loginWithBackend(email, password) {
  const res = await authApi.login(email, password);
  if (!res.success) {
    throw new Error(res.error?.message || "Authentication failed");
  }

  const { token, user, customer } = res.data;

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "admin" ? "Administrator" : user.role === "staff" ? "Staff Operations" : "Customer Portal",
    company: customer?.company || (user.role === "admin" ? "Brightloop Software Inc." : user.role === "staff" ? "Brightloop Staff" : user.name),
    customerId: customer?.customer_number || customer?.id || null,
    phone: customer?.phone || "",
    avatar: (user.name || "User")
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  };

  if (browser) {
    localStorage.setItem("bl_token", token);
    localStorage.setItem("bl_auth", "true");
    localStorage.setItem("bl_user", JSON.stringify(userData));
    localStorage.setItem("bl_current_user", JSON.stringify(userData));
  }

  currentUser.set(userData);
  isAuthenticated.set(true);

  return { user: userData, token };
}

export function login(userData = {}) {
  const merged = {
    ...defaultUser,
    ...userData,
    avatar: (userData.name || defaultUser.name)
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  };

  currentUser.set(merged);
  isAuthenticated.set(true);

  if (browser) {
    localStorage.setItem("bl_auth", "true");
    localStorage.setItem("bl_user", JSON.stringify(merged));
    localStorage.setItem("bl_current_user", JSON.stringify(merged));
  }
}

export function logout() {
  isAuthenticated.set(false);
  currentUser.set(defaultUser);
  if (browser) {
    localStorage.removeItem("bl_auth");
    localStorage.removeItem("bl_token");
    localStorage.removeItem("bl_user");
    localStorage.removeItem("bl_current_user");
  }
}
