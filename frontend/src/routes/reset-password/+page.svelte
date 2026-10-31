<script>
  import { page } from "$app/stores";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import {
    verifyResetToken,
    resetPasswordWithToken,
    validatePasswordPolicy
  } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";
  import {
    Lock,
    Check,
    X,
    Eye,
    EyeOff,
    KeyRound,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    ShieldCheck,
    Building2
  } from "lucide-svelte";

  const token = $derived($page.url.searchParams.get("token") || "");
  const emailParam = $derived($page.url.searchParams.get("email") || "");

  let password = $state("");
  let confirmPassword = $state("");
  let showPassword = $state(false);
  let showConfirmPassword = $state(false);
  let touchedPassword = $state(false);
  let touchedConfirm = $state(false);

  let errorMessage = $state("");
  let successMessage = $state("");
  let isSubmitting = $state(false);

  // Verify token status
  const verification = $derived(verifyResetToken(token));
  const isValidToken = $derived(verification.valid);
  const tokenAccount = $derived(verification.tokenRecord);

  // Strict Password Policy Matrix
  const policy = $derived(validatePasswordPolicy(password));
  const hasLength = $derived(policy.hasLength);
  const hasUpper = $derived(policy.hasUpper);
  const hasLower = $derived(policy.hasLower);
  const hasSpecial = $derived(policy.hasSpecial);
  const isPasswordValid = $derived(policy.isValid);

  const doPasswordsMatch = $derived(
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
  );

  const isFormValid = $derived(isValidToken && isPasswordValid && doPasswordsMatch);

  function handleReset() {
    errorMessage = "";
    successMessage = "";
    touchedPassword = true;
    touchedConfirm = true;

    if (!isValidToken) {
      errorMessage = verification.reason || "Reset token is invalid or has expired.";
      return;
    }

    if (!isPasswordValid) {
      errorMessage = "Password does not satisfy the Brightloop enterprise security policy.";
      return;
    }

    if (!doPasswordsMatch) {
      errorMessage = "Passwords do not match. Please re-enter.";
      return;
    }

    isSubmitting = true;

    try {
      resetPasswordWithToken(token, password);
      successMessage = "Your password has been reset successfully! Redirecting to sign in...";
      setTimeout(() => {
        goto("/signin");
      }, 1500);
    } catch (err) {
      errorMessage = err.message || "Failed to reset password.";
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-screen bg-[#f8fafb] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
  <div class="w-full max-w-md relative z-10 my-8">

    <!-- Header Brand Section -->
    <div class="text-center mb-6">
      <div class="w-12 h-12 rounded-2xl bg-[#183f42] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
        <KeyRound class="w-6 h-6 text-white" />
      </div>
      <h1 class="text-2xl font-bold text-[#122b2e] tracking-tight">Brightloop Software</h1>
      <p class="text-xs text-[#7e9599] mt-0.5">Secure Password Reset</p>
    </div>

    <Card.Root class="bg-white border border-[#edf2f3] shadow-xl rounded-2xl overflow-hidden">
      <div class="h-1.5 bg-[#183f42] w-full"></div>

      <Card.Header class="pb-3 pt-6 px-6 border-b border-[#f4f7f8]">
        <Card.Title class="text-base font-bold text-[#122b2e]">Create New Password</Card.Title>
        <Card.Description class="text-xs text-[#7e9599]">
          Enter your new credentials following enterprise security standards.
        </Card.Description>
      </Card.Header>

      <Card.Content class="p-6">
        {#if !isValidToken}
          <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-3 text-center">
            <AlertCircle class="w-8 h-8 text-rose-500 mx-auto" />
            <div>
              <p class="font-bold text-sm">Invalid or Expired Reset Token</p>
              <p class="text-[11px] text-rose-600 mt-1">
                {verification.reason || "This password reset link is invalid or has already expired."}
              </p>
            </div>
            <div class="pt-2">
              <a
                href="/signin"
                class="inline-flex items-center gap-1.5 bg-[#183f42] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#123033]"
              >
                Return to Sign In
              </a>
            </div>
          </div>
        {:else}
          {#if errorMessage}
            <div class="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle class="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          {/if}

          {#if successMessage}
            <div class="mb-4 p-3 rounded-xl bg-[#e6f4f2] border border-[#bde4df] text-[#143e42] text-xs flex items-start gap-2.5">
              <CheckCircle2 class="w-4 h-4 shrink-0 text-[#143e42] mt-0.5" />
              <span>{successMessage}</span>
            </div>
          {/if}

          <!-- Account badge -->
          <div class="p-3 mb-4 rounded-xl bg-[#f8fafb] border border-[#e5ecee] flex items-center justify-between text-xs">
            <div>
              <div class="text-[10px] font-bold text-[#8c9ba5] uppercase">Resetting Password For</div>
              <div class="font-semibold text-[#122b2e]">{tokenAccount?.name || "Customer Account"}</div>
              <div class="text-[11px] text-[#586f73]">{tokenAccount?.email || emailParam}</div>
            </div>
            {#if tokenAccount?.company}
              <div class="text-right">
                <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]">
                  <Building2 class="w-3 h-3" />
                  {tokenAccount.company}
                </span>
              </div>
            {/if}
          </div>

          <form class="space-y-4 text-xs" onsubmit={(e) => { e.preventDefault(); handleReset(); }}>
            <!-- New Password -->
            <div class="space-y-1.5">
              <Label for="password" class="text-xs font-semibold text-[#122b2e]">New Password *</Label>
              <div class="relative">
                <Lock class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  bind:value={password}
                  oninput={() => { touchedPassword = true; errorMessage = ""; }}
                  placeholder="Enter new password..."
                  class="pl-9 pr-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] rounded-xl {touchedPassword && !isPasswordValid ? 'border-amber-400' : (isPasswordValid ? 'border-emerald-400' : '')}"
                  required
                />
                <button
                  type="button"
                  onclick={() => (showPassword = !showPassword)}
                  class="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                >
                  {#if showPassword}
                    <EyeOff class="w-3.5 h-3.5" />
                  {:else}
                    <Eye class="w-3.5 h-3.5" />
                  {/if}
                </button>
              </div>

              <!-- Real-time checklist -->
              <div class="p-3 bg-[#f8fafb] border border-[#e5ecee] rounded-xl space-y-1.5 text-[11px] mt-1.5">
                <div class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider mb-1">
                  Security Checklist:
                </div>

                <div class="flex items-center gap-2 {hasLength ? 'text-[#143e42] font-semibold' : 'text-[#7e9599]'}">
                  {#if hasLength}
                    <Check class="w-3.5 h-3.5 text-emerald-600" />
                  {:else}
                    <X class="w-3.5 h-3.5 text-zinc-400" />
                  {/if}
                  <span>More than 8 characters (at least 9 chars)</span>
                </div>

                <div class="flex items-center gap-2 {hasUpper ? 'text-[#143e42] font-semibold' : 'text-[#7e9599]'}">
                  {#if hasUpper}
                    <Check class="w-3.5 h-3.5 text-emerald-600" />
                  {:else}
                    <X class="w-3.5 h-3.5 text-zinc-400" />
                  {/if}
                  <span>At least 1 uppercase letter (A-Z)</span>
                </div>

                <div class="flex items-center gap-2 {hasLower ? 'text-[#143e42] font-semibold' : 'text-[#7e9599]'}">
                  {#if hasLower}
                    <Check class="w-3.5 h-3.5 text-emerald-600" />
                  {:else}
                    <X class="w-3.5 h-3.5 text-zinc-400" />
                  {/if}
                  <span>At least 1 lowercase letter (a-z)</span>
                </div>

                <div class="flex items-center gap-2 {hasSpecial ? 'text-[#143e42] font-semibold' : 'text-[#7e9599]'}">
                  {#if hasSpecial}
                    <Check class="w-3.5 h-3.5 text-emerald-600" />
                  {:else}
                    <X class="w-3.5 h-3.5 text-zinc-400" />
                  {/if}
                  <span>At least 1 special character (!@#$%^&amp;*...)</span>
                </div>
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="space-y-1">
              <Label for="confirmPassword" class="text-xs font-semibold text-[#122b2e]">Confirm New Password *</Label>
              <div class="relative">
                <Lock class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  bind:value={confirmPassword}
                  oninput={() => { touchedConfirm = true; errorMessage = ""; }}
                  placeholder="Re-enter new password..."
                  class="pl-9 pr-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] rounded-xl {touchedConfirm && !doPasswordsMatch ? 'border-rose-400 bg-rose-50/20' : (doPasswordsMatch ? 'border-emerald-400' : '')}"
                  required
                />
                <button
                  type="button"
                  onclick={() => (showConfirmPassword = !showConfirmPassword)}
                  class="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                >
                  {#if showConfirmPassword}
                    <EyeOff class="w-3.5 h-3.5" />
                  {:else}
                    <Eye class="w-3.5 h-3.5" />
                  {/if}
                </button>
              </div>
              {#if touchedConfirm}
                {#if doPasswordsMatch}
                  <div class="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                    <Check class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Passwords match.</span>
                  </div>
                {:else if confirmPassword.length > 0}
                  <div class="flex items-center gap-1.5 text-[11px] text-rose-600 font-medium">
                    <AlertCircle class="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Passwords do not match.</span>
                  </div>
                {/if}
              {/if}
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              class="w-full bg-[#183f42] hover:bg-[#123033] text-white h-10 text-xs font-semibold rounded-xl mt-3 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isSubmitting}
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Updating Password...</span>
              {:else}
                <span>Set New Password &amp; Sign In</span>
                <ArrowRight class="w-4 h-4" />
              {/if}
            </Button>

            <div class="text-center pt-2">
              <a href="/signin" class="text-[11px] text-[#7e9599] hover:text-[#183f42] hover:underline">
                Return to Sign In
              </a>
            </div>
          </form>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</div>
