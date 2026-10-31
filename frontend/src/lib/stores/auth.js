import { writable } from "svelte/store";
import { browser } from "$app/environment";

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

const initialAuth = browser ? localStorage.getItem("bl_auth") === "true" : false;

export const isAuthenticated = writable(initialAuth);
export const currentUser = writable(defaultUser);

export function login(userData = {}) {
  currentUser.update(user => ({
    ...user,
    ...userData,
    avatar: (userData.name || user.name)
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }));
  isAuthenticated.set(true);
  if (browser) {
    localStorage.setItem("bl_auth", "true");
  }
}

export function logout() {
  isAuthenticated.set(false);
  if (browser) {
    localStorage.removeItem("bl_auth");
  }
}
