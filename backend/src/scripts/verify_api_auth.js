import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { login, getMe, getUsers } from "../modules/auth/auth.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

async function testApiFlow() {
  console.log("Testing API Auth flow...");

  // Mock Request & Response for login
  const loginReq = {
    body: {
      email: "admin@brightloop.com",
      password: "Admin@BrightLoop2026!"
    }
  };

  let loginData = null;
  const loginRes = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      loginData = payload;
      return this;
    }
  };

  await login(loginReq, loginRes);

  console.log("Login HTTP Status:", loginRes.statusCode || 200);
  console.log("Login response payload:", JSON.stringify(loginData, null, 2));

  if (!loginData.success) {
    console.error("Login failed:", loginData);
    process.exit(1);
  }

  console.log("User received:", loginData.data.user);
  console.log("Token received prefix:", loginData.data.token.substring(0, 30) + "...");

  const token = loginData.data.token;

  // Test requireAuth middleware with this token
  const authReq = {
    headers: {
      authorization: `Bearer ${token}`
    }
  };
  let authError = null;
  const authRes = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      authError = payload;
      return this;
    }
  };

  let nextCalled = false;
  await requireAuth(authReq, authRes, () => {
    nextCalled = true;
  });

  if (!nextCalled || authError) {
    console.error("requireAuth middleware failed!", authError);
    process.exit(1);
  }
  console.log("[✓] requireAuth successfully set req.user:", authReq.user);

  // Test requireRole('admin') middleware
  let roleNextCalled = false;
  requireRole("admin")(authReq, authRes, () => {
    roleNextCalled = true;
  });

  if (!roleNextCalled) {
    console.error("requireRole('admin') failed!");
    process.exit(1);
  }
  console.log("[✓] requireRole('admin') passed!");

  // Test getMe controller
  let meData = null;
  const meRes = {
    status(code) { return this; },
    json(payload) { meData = payload; return this; }
  };
  await getMe(authReq, meRes);
  console.log("[✓] getMe returned admin profile:", meData.data.user);

  // Test getUsers controller (admin only)
  let usersData = null;
  const usersRes = {
    status(code) { return this; },
    json(payload) { usersData = payload; return this; }
  };
  await getUsers(authReq, usersRes);
  console.log(`[✓] getUsers returned ${usersData.data.length} registered users:`);
  usersData.data.forEach(u => console.log(`    - [${u.role}] ${u.email} (${u.name})`));

  console.log("\nALL AUTHENTICATION CHECKS PASSED SUCCESSFULLY!");
  process.exit(0);
}

testApiFlow().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
