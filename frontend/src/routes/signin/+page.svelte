<script>
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { login } from "$lib/stores/auth.js";
  import { customersStore } from "$lib/stores/coreManagement.js";
  import { goto } from "$app/navigation";
  import { Lock, Mail, Sparkles, Shield, Briefcase, UserCircle, CheckCircle2, AlertCircle, X, KeyRound } from "lucide-svelte";

  let email = $state("admin@brightloop.io");
  let password = $state("BrightloopAdmin2026!");
  let errorMessage = $state("");
  let showForgotPassword = $state(false);
  let forgotEmail = $state("");
  let resetSuccess = $state(false);

  function handleSignIn() {
    errorMessage = "";

    // Role-based routing based on email domain / user profile
    const normalized = email.toLowerCase().trim();
    if (normalized.includes("admin")) {
      login({
        name: "Brightloop Admin",
        email: normalized,
        company: "Brightloop Software Inc.",
        role: "Administrator",
        avatar: "AD"
      });
      goto("/");
    } else if (normalized.includes("sales") || normalized.includes("staff")) {
      login({
        name: "Sarah Jenkins (Staff)",
        email: normalized,
        company: "Brightloop Software Inc.",
        role: "Staff Operations",
        avatar: "SJ"
      });
      goto("/staff");
    } else {
      // Customer
      const cust = $customersStore.find(c => c.email.toLowerCase() === normalized);
      login({
        name: cust ? cust.name : "Dr. Eleanor Vance",
        email: normalized,
        company: cust ? cust.company : "Nexus Health Systems",
        role: "Customer Portal",
        customerId: cust ? cust.customer_number : "CUST-1001",
        avatar: "EV"
      });
      goto("/portal");
    }
  }

  function handleSelectPersona(role) {
    if (role === "admin") {
      email = "admin@brightloop.io";
      password = "BrightloopAdmin2026!";
    } else if (role === "staff") {
      email = "sales@brightloop.io";
      password = "BrightloopStaff2026!";
    } else {
      email = "eleanor.vance@nexushealth.org";
      password = "CustomerSecret2026!";
    }
  }

  function handleSendResetLink() {
    if (!forgotEmail) return;
    resetSuccess = true;
    setTimeout(() => {
      showForgotPassword = false;
      resetSuccess = false;
    }, 2500);
  }
</script>

<div class="min-h-screen bg-[#f8fafb] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
  <div class="w-full max-w-sm relative z-10">
    <div class="text-center mb-6">
      <div class="w-12 h-12 rounded-2xl bg-[#183f42] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
        <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-dasharray="2 3" />
          <path d="M7 12h10" />
          <path d="M9 8h6" />
          <path d="M9 16h6" />
        </svg>
      </div>
      <h1 class="text-xl font-bold text-[#122b2e] tracking-tight">Brightloop Software</h1>
      <p class="text-xs text-[#7e9599] mt-0.5">Subscription Management System</p>
    </div>

    <Card.Root class="bg-white border border-[#edf2f3] shadow-lg rounded-2xl overflow-hidden">
      <div class="h-1.5 bg-[#183f42] w-full"></div>
      <Card.Header class="pb-3 pt-5">
        <Card.Title class="text-sm font-bold text-[#122b2e]">Portal Sign In</Card.Title>
        <Card.Description class="text-xs text-[#7e9599]">
          Authenticate using RBAC credentials.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form class="space-y-4 text-xs" onsubmit={(e) => { e.preventDefault(); handleSignIn(); }}>
          <div class="space-y-1">
            <Label for="email" class="text-xs font-medium text-[#122b2e]">Email Address</Label>
            <div class="relative">
              <Mail class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                id="email"
                type="email"
                bind:value={email}
                placeholder="name@company.com"
                class="pl-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
                required
              />
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <Label for="password" class="text-xs font-medium text-[#122b2e]">Password</Label>
              <button
                type="button"
                onclick={() => (showForgotPassword = true)}
                class="text-[11px] text-[#586f73] hover:text-[#183f42] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div class="relative">
              <Lock class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                id="password"
                type="password"
                bind:value={password}
                placeholder="••••••••"
                class="pl-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            class="w-full bg-[#183f42] hover:bg-[#123033] text-white h-9 text-xs font-semibold rounded-xl mt-2 transition-all shadow-xs"
          >
            Sign In
          </Button>

          <!-- Quick RBAC Persona Selector for Hackathon Demo -->
          <div class="pt-3 border-t border-[#edf2f3]">
            <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider block text-center mb-2">
              Demo Quick Persona Switcher:
            </span>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onclick={() => handleSelectPersona('admin')}
                class="px-2 py-1.5 rounded-lg border border-[#e2eaeb] bg-[#f8fafb] hover:bg-[#e6f4f2] text-[11px] font-medium text-[#183f42] flex flex-col items-center gap-1 transition-all"
              >
                <Shield class="w-3.5 h-3.5 text-[#183f42]" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onclick={() => handleSelectPersona('staff')}
                class="px-2 py-1.5 rounded-lg border border-[#e2eaeb] bg-[#f8fafb] hover:bg-[#e6f4f2] text-[11px] font-medium text-[#183f42] flex flex-col items-center gap-1 transition-all"
              >
                <Briefcase class="w-3.5 h-3.5 text-[#183f42]" />
                <span>Staff</span>
              </button>
              <button
                type="button"
                onclick={() => handleSelectPersona('customer')}
                class="px-2 py-1.5 rounded-lg border border-[#e2eaeb] bg-[#f8fafb] hover:bg-[#e6f4f2] text-[11px] font-medium text-[#183f42] flex flex-col items-center gap-1 transition-all"
              >
                <UserCircle class="w-3.5 h-3.5 text-[#183f42]" />
                <span>Customer</span>
              </button>
            </div>
          </div>

          <div class="text-center text-[11px] text-[#7e9599] pt-2">
            Don't have an account?
            <a href="/signup" class="font-semibold text-[#183f42] hover:underline ml-1">Sign Up</a>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>

<!-- Forgot Password Flow Modal -->
{#if showForgotPassword}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-sm w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div class="flex items-center gap-2">
          <KeyRound class="w-4 h-4 text-[#183f42]" />
          <h3 class="font-bold text-[#122b2e]">Forgot Password</h3>
        </div>
        <button onclick={() => (showForgotPassword = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      {#if resetSuccess}
        <div class="p-3 bg-[#e6f4f2] border border-[#bde4df] rounded-xl text-[#143e42] flex items-center gap-2 mb-2">
          <CheckCircle2 class="w-4 h-4 shrink-0" />
          <span>A password reset link with a secure token has been dispatched to <b>{forgotEmail}</b>.</span>
        </div>
      {:else}
        <p class="text-[#7e9599] mb-3 leading-relaxed">
          Enter your registered email address to receive an expiring password reset token.
        </p>
        <div class="space-y-2 mb-4">
          <Label for="f-email" class="font-medium text-[#122b2e]">Registered Email</Label>
          <Input
            id="f-email"
            type="email"
            bind:value={forgotEmail}
            placeholder="name@company.com"
            class="h-9 text-xs bg-[#f8fafb] border-[#e5ecee] rounded-xl"
          />
        </div>
        <div class="flex items-center justify-end gap-2">
          <Button variant="outline" size="xs" onclick={() => (showForgotPassword = false)} class="rounded-xl">
            Cancel
          </Button>
          <Button size="xs" onclick={handleSendResetLink} class="bg-[#183f42] text-white rounded-xl">
            Send Reset Link
          </Button>
        </div>
      {/if}
    </div>
  </div>
{/if}
