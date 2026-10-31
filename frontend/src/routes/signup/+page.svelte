<script>
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import {
    registerCustomer,
    isEmailRegistered,
    validatePasswordPolicy,
    parseCompanyFromEmail,
    requestPasswordReset,
    login
  } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";
  import {
    Lock,
    Mail,
    User,
    Building2,
    Check,
    X,
    Eye,
    EyeOff,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Globe,
    KeyRound,
    ArrowRight,
    Sparkles
  } from "lucide-svelte";

  // Form State
  let name = $state("");
  let company = $state("");
  let email = $state("");
  let phone = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let showPassword = $state(false);
  let showConfirmPassword = $state(false);
  let touchedEmail = $state(false);
  let touchedPassword = $state(false);
  let touchedConfirm = $state(false);

  let errorMessage = $state("");
  let successMessage = $state("");
  let isSubmitting = $state(false);

  // Forgot Password modal state
  let showForgotPassword = $state(false);
  let forgotEmail = $state("");
  let forgotSuccess = $state(null);
  let forgotError = $state("");

  // 1. Company extraction from corporate email domain (after @)
  const parsedCompany = $derived(parseCompanyFromEmail(email));
  const emailDomain = $derived(parsedCompany.domain);
  const isValidEmailFormat = $derived(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())
  );

  // Auto-fill company name if empty when user types email
  $effect(() => {
    if (parsedCompany.suggestedCompany && !company) {
      company = parsedCompany.suggestedCompany;
    }
  });

  // 2. Email uniqueness check: Each email can belong to only one account (case-insensitive)
  const isEmailTaken = $derived(
    email.trim().length > 3 && isEmailRegistered(email.trim())
  );

  // 3. Strict Password Requirements (Scene 1 & Engineering Blueprint):
  // - More than 8 characters (length >= 9)
  // - At least 1 uppercase letter (A-Z)
  // - At least 1 lowercase letter (a-z)
  // - At least 1 special character (!@#$%^&* etc.)
  const policy = $derived(validatePasswordPolicy(password));
  const hasLength = $derived(policy.hasLength);
  const hasUpper = $derived(policy.hasUpper);
  const hasLower = $derived(policy.hasLower);
  const hasSpecial = $derived(policy.hasSpecial);
  const isPasswordValid = $derived(policy.isValid);

  // Confirm password match
  const doPasswordsMatch = $derived(
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
  );

  // Password Strength Score (0 to 4)
  const strengthScore = $derived(
    (hasLength ? 1 : 0) + (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasSpecial ? 1 : 0)
  );

  const strengthLabel = $derived(
    strengthScore <= 1
      ? "Weak"
      : strengthScore <= 2
      ? "Fair"
      : strengthScore === 3
      ? "Good"
      : "Enterprise Grade"
  );

  const strengthColor = $derived(
    strengthScore <= 1
      ? "bg-rose-500"
      : strengthScore <= 2
      ? "bg-amber-500"
      : strengthScore === 3
      ? "bg-blue-500"
      : "bg-emerald-600"
  );

  // Overall form validity
  const isFormValid = $derived(
    name.trim().length > 1 &&
    company.trim().length > 1 &&
    isValidEmailFormat &&
    !isEmailTaken &&
    isPasswordValid &&
    doPasswordsMatch
  );

  function handleSignUp() {
    errorMessage = "";
    successMessage = "";
    touchedEmail = true;
    touchedPassword = true;
    touchedConfirm = true;

    if (!name || !company || !email || !password) {
      errorMessage = "Please complete all mandatory corporate registration fields.";
      return;
    }

    if (!isValidEmailFormat) {
      errorMessage = "Please enter a valid corporate email address (e.g. name@company.com).";
      return;
    }

    if (isEmailTaken) {
      errorMessage = `Each email address can belong to only one account. '${email}' is already registered.`;
      return;
    }

    if (!isPasswordValid) {
      errorMessage = "Password does not meet enterprise security requirements.";
      return;
    }

    if (!doPasswordsMatch) {
      errorMessage = "Passwords do not match. Please re-enter to confirm.";
      return;
    }

    isSubmitting = true;

    try {
      const result = registerCustomer({
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        password,
        phone: phone.trim()
      });

      // Auto-login customer
      login({
        name: result.user.name,
        email: result.user.email,
        company: result.user.company,
        role: "Customer Portal",
        customerId: result.customer.customer_number
      });

      successMessage = `Account created successfully! Generated Customer ID: ${result.customer.customer_number}. Redirecting to your Customer Portal...`;
      
      setTimeout(() => {
        goto("/portal");
      }, 1200);
    } catch (err) {
      errorMessage = err.message || "Failed to create customer account.";
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
  <div class="w-full max-w-lg relative z-10 my-8">
    
    <!-- Header Brand Section -->
    <div class="text-center mb-6">
      <div class="w-12 h-12 rounded-2xl bg-[#183f42] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
        <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-dasharray="2 3" />
          <path d="M7 12h10" />
          <path d="M9 8h6" />
          <path d="M9 16h6" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-[#122b2e] tracking-tight">Brightloop Software</h1>
      <p class="text-xs text-[#7e9599] mt-1 font-medium">B2B / B2C Customer Onboarding &amp; Self-Service Portal</p>
    </div>

    <!-- Registration Card -->
    <Card.Root class="bg-white border border-[#edf2f3] shadow-xl rounded-2xl overflow-hidden">
      <div class="h-1.5 bg-[#183f42] w-full"></div>
      
      <Card.Header class="pb-3 pt-6 px-6 sm:px-8 border-b border-[#f4f7f8]">
        <div class="flex items-center justify-between">
          <div>
            <Card.Title class="text-base font-bold text-[#122b2e]">Create Company Account</Card.Title>
            <Card.Description class="text-xs text-[#7e9599] mt-0.5">
              Sign up your organization to manage recurring subscriptions, add-ons, and invoices.
            </Card.Description>
          </div>
          <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]">
            <Building2 class="w-3.5 h-3.5" />
            B2B Portal
          </span>
        </div>
      </Card.Header>

      <Card.Content class="p-6 sm:p-8">
        {#if errorMessage}
          <div class="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle class="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span class="leading-relaxed">{errorMessage}</span>
          </div>
        {/if}

        {#if successMessage}
          <div class="mb-4 p-3 rounded-xl bg-[#e6f4f2] border border-[#bde4df] text-[#143e42] text-xs flex items-start gap-2.5">
            <CheckCircle2 class="w-4 h-4 shrink-0 text-[#143e42] mt-0.5" />
            <span class="leading-relaxed">{successMessage}</span>
          </div>
        {/if}

        <form class="space-y-4 text-xs" onsubmit={(e) => { e.preventDefault(); handleSignUp(); }}>
          
          <!-- Company & Corporate Domain Association -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <Label for="email" class="text-xs font-semibold text-[#122b2e]">Corporate Work Email *</Label>
              {#if emailDomain}
                <span class="text-[10px] text-[#183f42] font-medium bg-[#e6f4f2] px-2 py-0.5 rounded-md flex items-center gap-1 border border-[#bde4df]/60">
                  <Globe class="w-3 h-3" />
                  Domain: <b>@{emailDomain}</b>
                </span>
              {/if}
            </div>
            <div class="relative">
              <Mail class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                id="email"
                type="email"
                bind:value={email}
                oninput={() => { touchedEmail = true; errorMessage = ""; }}
                placeholder="billing@yourcompany.com"
                class="pl-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl {isEmailTaken ? 'border-rose-400 bg-rose-50/30' : (isValidEmailFormat && !isEmailTaken ? 'border-emerald-400' : '')}"
                required
              />
              {#if touchedEmail && isValidEmailFormat && !isEmailTaken}
                <Check class="w-3.5 h-3.5 text-emerald-600 absolute right-3 top-2.5" />
              {/if}
            </div>

            <!-- Email Uniqueness & Format Validation Messages -->
            {#if touchedEmail}
              {#if isEmailTaken}
                <div class="flex items-center gap-1.5 text-[11px] text-rose-600 font-medium mt-1">
                  <AlertCircle class="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Each email address can be used for only one account. This email is already registered.</span>
                </div>
              {:else if !isValidEmailFormat && email.length > 0}
                <div class="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium mt-1">
                  <AlertCircle class="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Please provide a valid company email format (e.g. user@company.com).</span>
                </div>
              {:else if isValidEmailFormat && !isEmailTaken}
                <div class="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-1">
                  <Check class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Email is available. Unique company account will be provisioned.</span>
                </div>
              {/if}
            {/if}
          </div>

          <!-- Company Name & Contact Name -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <Label for="company" class="text-xs font-semibold text-[#122b2e]">Company / Business *</Label>
                {#if emailDomain && company !== parsedCompany.suggestedCompany && parsedCompany.suggestedCompany}
                  <button
                    type="button"
                    onclick={() => (company = parsedCompany.suggestedCompany)}
                    class="text-[10px] text-[#183f42] hover:underline"
                  >
                    Use '{parsedCompany.suggestedCompany}'
                  </button>
                {/if}
              </div>
              <div class="relative">
                <Building2 class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <Input
                  id="company"
                  type="text"
                  bind:value={company}
                  placeholder="e.g. Nexus Health Systems"
                  class="pl-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
                  required
                />
              </div>
            </div>

            <div class="space-y-1">
              <Label for="fullname" class="text-xs font-semibold text-[#122b2e]">Contact Person Name *</Label>
              <div class="relative">
                <User class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <Input
                  id="fullname"
                  type="text"
                  bind:value={name}
                  placeholder="e.g. Dr. Eleanor Vance"
                  class="pl-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Phone Number (Optional) -->
          <div class="space-y-1">
            <Label for="phone" class="text-xs font-semibold text-[#122b2e]">Business Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              bind:value={phone}
              placeholder="+1 (555) 234-8901"
              class="text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl px-3"
            />
          </div>

          <!-- Password Field with Strict Policy Matrix -->
          <div class="space-y-1.5 pt-1">
            <div class="flex items-center justify-between">
              <Label for="password" class="text-xs font-semibold text-[#122b2e]">Create Password *</Label>
              {#if password.length > 0}
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full {strengthColor} text-white transition-all">
                  {strengthLabel}
                </span>
              {/if}
            </div>

            <div class="relative">
              <Lock class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                bind:value={password}
                oninput={() => { touchedPassword = true; errorMessage = ""; }}
                placeholder="Enter strong corporate password..."
                class="pl-9 pr-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl {touchedPassword && !isPasswordValid ? 'border-amber-400' : (isPasswordValid ? 'border-emerald-400' : '')}"
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

            <!-- Real-Time Password Policy Checklist (Scene 1 Requirements) -->
            <div class="p-3 bg-[#f8fafb] border border-[#e5ecee] rounded-xl space-y-1.5 text-[11px] mt-1.5">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider">
                  Brightloop Password Security Standards
                </span>
                <span class="text-[10px] text-[#586f73] font-medium">{strengthScore}/4 fulfilled</span>
              </div>

              <!-- Rule 1: More than 8 characters -->
              <div class="flex items-center gap-2 {hasLength ? 'text-[#143e42] font-semibold' : 'text-[#7e9599]'}">
                {#if hasLength}
                  <div class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check class="w-3 h-3 stroke-[2.5]" />
                  </div>
                {:else}
                  <div class="w-4 h-4 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center shrink-0">
                    <X class="w-3 h-3" />
                  </div>
                {/if}
                <span>Must contain <b>more than 8 characters</b> (minimum 9 characters)</span>
              </div>

              <!-- Rule 2: At least 1 uppercase letter -->
              <div class="flex items-center gap-2 {hasUpper ? 'text-[#143e42] font-semibold' : 'text-[#7e9599]'}">
                {#if hasUpper}
                  <div class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check class="w-3 h-3 stroke-[2.5]" />
                  </div>
                {:else}
                  <div class="w-4 h-4 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center shrink-0">
                    <X class="w-3 h-3" />
                  </div>
                {/if}
                <span>Must contain at least <b>1 uppercase letter</b> (A-Z)</span>
              </div>

              <!-- Rule 3: At least 1 lowercase letter -->
              <div class="flex items-center gap-2 {hasLower ? 'text-[#143e42] font-semibold' : 'text-[#7e9599]'}">
                {#if hasLower}
                  <div class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check class="w-3 h-3 stroke-[2.5]" />
                  </div>
                {:else}
                  <div class="w-4 h-4 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center shrink-0">
                    <X class="w-3 h-3" />
                  </div>
                {/if}
                <span>Must contain at least <b>1 lowercase letter</b> (a-z)</span>
              </div>

              <!-- Rule 4: At least 1 special character -->
              <div class="flex items-center gap-2 {hasSpecial ? 'text-[#143e42] font-semibold' : 'text-[#7e9599]'}">
                {#if hasSpecial}
                  <div class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check class="w-3 h-3 stroke-[2.5]" />
                  </div>
                {:else}
                  <div class="w-4 h-4 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center shrink-0">
                    <X class="w-3 h-3" />
                  </div>
                {/if}
                <span>Must contain at least <b>1 special character</b> (!@#$%^&amp;*...)</span>
              </div>
            </div>
          </div>

          <!-- Confirm Password Field -->
          <div class="space-y-1">
            <Label for="confirmPassword" class="text-xs font-semibold text-[#122b2e]">Confirm Password *</Label>
            <div class="relative">
              <Lock class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                bind:value={confirmPassword}
                oninput={() => { touchedConfirm = true; errorMessage = ""; }}
                placeholder="Re-enter password to confirm..."
                class="pl-9 pr-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl {touchedConfirm && !doPasswordsMatch ? 'border-rose-400 bg-rose-50/20' : (doPasswordsMatch ? 'border-emerald-400' : '')}"
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

          <!-- Submit Button -->
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            class="w-full bg-[#183f42] hover:bg-[#123033] text-white h-10 text-xs font-semibold rounded-xl mt-3 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isSubmitting}
              <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Registering Customer Profile...</span>
            {:else}
              <span>Sign Up as Customer &amp; Generate ID</span>
              <ArrowRight class="w-4 h-4" />
            {/if}
          </Button>

          <!-- Navigation Links -->
          <div class="pt-3 border-t border-[#edf2f3] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#7e9599] gap-2">
            <div>
              Already have an account?
              <a href="/signin" class="font-semibold text-[#183f42] hover:underline ml-1">Sign In</a>
            </div>
            <button
              type="button"
              onclick={() => (showForgotPassword = true)}
              class="font-medium text-[#586f73] hover:text-[#183f42] hover:underline flex items-center gap-1"
            >
              <KeyRound class="w-3 h-3" />
              Forgot password?
            </button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>

    <!-- Enterprise Security Policy Assurance -->
    <div class="mt-4 p-3 rounded-xl bg-white/70 border border-[#edf2f3] text-[11px] text-[#7e9599] flex items-center justify-center gap-2 text-center">
      <ShieldCheck class="w-4 h-4 text-[#183f42] shrink-0" />
      <span>Protected by Brightloop Enterprise Role-Based Access Control (RBAC) &amp; Encrypted Sessions.</span>
    </div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- FORGOT PASSWORD MODAL (Scene 1: Sends reset link to registered email)    -->
<!-- ========================================================================= -->
{#if showForgotPassword}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-[#edf2f3] mb-4">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-[#e6f4f2] text-[#183f42] flex items-center justify-center">
            <KeyRound class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-bold text-[#122b2e] text-sm">Reset Account Password</h3>
            <p class="text-[11px] text-[#7e9599]">Send a secure password reset link to your registered email</p>
          </div>
        </div>
        <button
          onclick={() => { showForgotPassword = false; forgotSuccess = null; forgotError = ""; }}
          class="p-1 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      {#if forgotSuccess}
        <div class="space-y-3">
          <div class="p-3.5 bg-[#e6f4f2] border border-[#bde4df] rounded-xl text-[#143e42] flex items-start gap-2.5">
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div class="space-y-1">
              <p class="font-bold">Password Reset Dispatched</p>
              <p class="text-[11px] leading-relaxed">
                A password reset link with a secure token has been dispatched to <b>{forgotSuccess.email}</b>.
              </p>
            </div>
          </div>

          <!-- Realistic simulated email preview for hackathon demo -->
          <div class="p-3 bg-[#f8fafb] border border-[#e5ecee] rounded-xl space-y-2">
            <div class="flex items-center justify-between text-[10px] text-[#8c9ba5] font-semibold uppercase tracking-wider">
              <span>Simulated Inbox Link</span>
              <span class="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Active Token</span>
            </div>
            <p class="text-[11px] text-[#122b2e] break-all font-mono bg-white p-2 rounded border border-[#edf2f3]">
              {forgotSuccess.resetUrl}
            </p>
            <div class="flex items-center gap-2 pt-1">
              <a
                href={forgotSuccess.resetUrl}
                class="flex-1 bg-[#183f42] text-white hover:bg-[#123033] h-8 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 text-center"
              >
                <span>Open Reset Link</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </a>
              <Button
                variant="outline"
                size="xs"
                onclick={() => {
                  navigator.clipboard.writeText(forgotSuccess.resetUrl);
                }}
                class="h-8 rounded-lg"
              >
                Copy Link
              </Button>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <Button
              size="xs"
              variant="outline"
              onclick={() => { showForgotPassword = false; forgotSuccess = null; }}
              class="rounded-lg"
            >
              Close
            </Button>
          </div>
        </div>
      {:else}
        {#if forgotError}
          <div class="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
            <span>{forgotError}</span>
          </div>
        {/if}

        <p class="text-[#7e9599] mb-3 leading-relaxed">
          Enter your registered work email address below. If an account exists, you will receive a secure expiring reset token.
        </p>

        <div class="space-y-1.5 mb-4">
          <Label for="f-email" class="font-semibold text-[#122b2e]">Registered Email Address *</Label>
          <div class="relative">
            <Mail class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <Input
              id="f-email"
              type="email"
              bind:value={forgotEmail}
              placeholder="e.g. eleanor.vance@nexushealth.org"
              class="pl-9 h-9 text-xs bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] rounded-xl"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="xs"
            onclick={() => { showForgotPassword = false; forgotError = ""; }}
            class="rounded-xl h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            size="xs"
            onclick={handleSendResetLink}
            class="bg-[#183f42] text-white hover:bg-[#123033] rounded-xl h-8 text-xs font-semibold px-4"
          >
            Send Reset Link
          </Button>
        </div>
      {/if}
    </div>
  </div>
{/if}
