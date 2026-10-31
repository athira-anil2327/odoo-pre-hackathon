<script>
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { loginWithBackend, requestPasswordReset } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";
  import {
    Lock,
    Mail,
    AlertCircle,
    CheckCircle2,
    X,
    KeyRound,
    ArrowRight,
    Eye,
    EyeOff,
    ShieldCheck
  } from "lucide-svelte";

  let email = $state("");
  let password = $state("");
  let showPassword = $state(false);
  let errorMessage = $state("");
  let isSubmitting = $state(false);

  // Forgot password modal state
  let showForgotPassword = $state(false);
  let forgotEmail = $state("");
  let forgotSuccess = $state(null);
  let forgotError = $state("");

  async function handleSignIn() {
    errorMessage = "";
    const normalized = email.toLowerCase().trim();

    if (!normalized || !password) {
      errorMessage = "Please enter both your email address and password.";
      return;
    }

    isSubmitting = true;

    try {
      // Authenticates with PostgreSQL backend via JWT
      const res = await loginWithBackend(normalized, password);
      const user = res.user;

      // Strict role-based destination path
      if (user.role === "Administrator" || user.role === "admin") {
        goto("/admin");
      } else if (user.role === "Staff Operations" || user.role === "staff") {
        goto("/staff");
      } else {
        goto("/portal");
      }
    } catch (err) {
      errorMessage = err.message || "Invalid email or password. Please verify your credentials.";
    } finally {
      isSubmitting = false;
    }
  }

  function handleSendResetLink() {
    forgotError = "";
    forgotSuccess = null;
    if (!forgotEmail) {
      forgotError = "Please enter your registered email address.";
      return;
    }

    try {
      const res = requestPasswordReset(forgotEmail);
      forgotSuccess = res;
    } catch (err) {
      forgotError = err.message || "Failed to dispatch password reset link.";
    }
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
          Enter your registered corporate credentials to access your account.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if errorMessage}
          <div class="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle class="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span class="leading-relaxed">{errorMessage}</span>
          </div>
        {/if}

        <form class="space-y-4 text-xs" onsubmit={(e) => { e.preventDefault(); handleSignIn(); }}>
          <div class="space-y-1">
            <Label for="email" class="text-xs font-medium text-[#122b2e]">Email Address</Label>
            <div class="relative">
              <Mail class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                id="email"
                type="email"
                bind:value={email}
                oninput={() => (errorMessage = "")}
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
                type={showPassword ? "text" : "password"}
                bind:value={password}
                oninput={() => (errorMessage = "")}
                placeholder="••••••••"
                class="pl-9 pr-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onclick={() => (showPassword = !showPassword)}
                class="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 focus:outline-none transition-colors"
              >
                {#if showPassword}
                  <EyeOff class="w-3.5 h-3.5" />
                {:else}
                  <Eye class="w-3.5 h-3.5" />
                {/if}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            class="w-full bg-[#183f42] hover:bg-[#123033] text-white h-9 text-xs font-semibold rounded-xl mt-2 transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {#if isSubmitting}
              <div class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Signing In...</span>
            {:else}
              <span>Sign In</span>
            {/if}
          </Button>

          <div class="text-center text-[11px] text-[#7e9599] pt-2 border-t border-[#edf2f3]">
            Don't have an account?
            <a href="/signup" class="font-semibold text-[#183f42] hover:underline ml-1">Sign Up</a>
          </div>
        </form>
      </Card.Content>
    </Card.Root>

    <div class="mt-4 p-2.5 rounded-xl bg-white/70 border border-[#edf2f3] text-[11px] text-[#7e9599] flex items-center justify-center gap-1.5 text-center">
      <ShieldCheck class="w-3.5 h-3.5 text-[#183f42] shrink-0" />
      <span>Encrypted authentication secured by PostgreSQL &amp; JWT RBAC.</span>
    </div>
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
        <button
          onclick={() => { showForgotPassword = false; forgotSuccess = null; forgotError = ""; }}
          class="p-1 rounded text-zinc-400 hover:text-zinc-600"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      {#if forgotSuccess}
        <div class="space-y-3">
          <div class="p-3 bg-[#e6f4f2] border border-[#bde4df] rounded-xl text-[#143e42] flex items-start gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p class="font-bold">Password Reset Dispatched</p>
              <p class="text-[11px] leading-relaxed mt-0.5">
                A password reset link with a secure token has been dispatched to <b>{forgotSuccess.email}</b>.
              </p>
            </div>
          </div>

          <div class="p-2.5 bg-[#f8fafb] border border-[#e5ecee] rounded-xl space-y-1.5">
            <div class="text-[10px] text-[#8c9ba5] font-semibold uppercase">Simulated Reset Link</div>
            <p class="text-[10px] text-[#122b2e] break-all font-mono bg-white p-1.5 rounded border border-[#edf2f3]">
              {forgotSuccess.resetUrl}
            </p>
            <div class="flex items-center gap-2 pt-1">
              <a
                href={forgotSuccess.resetUrl}
                class="flex-1 bg-[#183f42] text-white hover:bg-[#123033] h-7 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 text-center"
              >
                <span>Open Reset Link</span>
                <ArrowRight class="w-3 h-3" />
              </a>
              <Button
                variant="outline"
                size="xs"
                onclick={() => navigator.clipboard.writeText(forgotSuccess.resetUrl)}
                class="h-7 rounded-lg text-[10px]"
              >
                Copy
              </Button>
            </div>
          </div>

          <div class="flex justify-end pt-1">
            <Button
              size="xs"
              variant="outline"
              onclick={() => { showForgotPassword = false; forgotSuccess = null; }}
              class="rounded-lg text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      {:else}
        {#if forgotError}
          <div class="mb-3 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
            <span>{forgotError}</span>
          </div>
        {/if}

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
          <Button
            variant="outline"
            size="xs"
            onclick={() => { showForgotPassword = false; forgotError = ""; }}
            class="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            size="xs"
            onclick={handleSendResetLink}
            class="bg-[#183f42] text-white rounded-xl"
          >
            Send Reset Link
          </Button>
        </div>
      {/if}
    </div>
  </div>
{/if}
