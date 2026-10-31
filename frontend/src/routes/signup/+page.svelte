<script>
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { login } from "$lib/stores/auth.js";
  import { customersStore, addCustomer } from "$lib/stores/coreManagement.js";
  import { goto } from "$app/navigation";
  import { Lock, Mail, User, Building2, Check, X, ShieldCheck, AlertCircle } from "lucide-svelte";

  let name = $state("");
  let company = $state("");
  let email = $state("");
  let password = $state("");
  let phone = $state("");
  let errorMessage = $state("");
  let successMessage = $state("");

  // Strict Password Regex Requirements from Blueprint:
  // > 8 chars (length >= 9), 1 uppercase, 1 lowercase, 1 special character
  const hasLength = $derived(password.length >= 9);
  const hasUpper = $derived(/[A-Z]/.test(password));
  const hasLower = $derived(/[a-z]/.test(password));
  const hasSpecial = $derived(/[!@#$%^&*(),.?":{}|<>]/.test(password));
  const isPasswordValid = $derived(hasLength && hasUpper && hasLower && hasSpecial);

  function handleSignUp() {
    errorMessage = "";
    successMessage = "";

    if (!name || !company || !email || !password) {
      errorMessage = "Please fill in all required registration fields.";
      return;
    }

    // 1. Password policy verification
    if (!isPasswordValid) {
      errorMessage = "Password does not meet Brightloop enterprise security policy.";
      return;
    }

    // 2. Unique Email Constraint Check (case-insensitive)
    const existing = $customersStore.find(
      c => c.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (existing) {
      errorMessage = `An account with email '${email}' already exists. Please sign in or use another email.`;
      return;
    }

    // 3. Auto-create customer profile CUST-...
    const newCust = addCustomer({
      name,
      company,
      email,
      phone,
      billing_address: `${company} Headquarters`
    });

    // 4. Log in as Customer
    login({
      name,
      company,
      email,
      role: "Customer Account",
      customerId: newCust.customer_number
    });

    successMessage = `Account and Profile ${newCust.customer_number} created successfully! Redirecting...`;
    setTimeout(() => {
      goto("/portal");
    }, 1000);
  }
</script>

<div class="min-h-screen bg-[#f8fafb] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
  <div class="w-full max-w-md relative z-10">
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
      <p class="text-xs text-[#7e9599] mt-0.5">Register an Enterprise Account</p>
    </div>

    <Card.Root class="bg-white border border-[#edf2f3] shadow-lg rounded-2xl overflow-hidden">
      <div class="h-1.5 bg-[#183f42] w-full"></div>
      <Card.Header class="pb-3 pt-5">
        <Card.Title class="text-sm font-bold text-[#122b2e]">Create Business Account</Card.Title>
        <Card.Description class="text-xs text-[#7e9599]">
          Enforces strict RBAC and automated customer number generation.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if errorMessage}
          <div class="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        {/if}

        {#if successMessage}
          <div class="mb-4 p-3 rounded-xl bg-[#e6f4f2] border border-[#bde4df] text-[#143e42] text-xs flex items-center gap-2">
            <Check class="w-4 h-4 shrink-0 text-[#143e42]" />
            <span>{successMessage}</span>
          </div>
        {/if}

        <form class="space-y-3.5 text-xs" onsubmit={(e) => { e.preventDefault(); handleSignUp(); }}>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <Label for="fullname" class="text-xs font-medium text-[#122b2e]">Contact Name *</Label>
              <div class="relative">
                <User class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <Input
                  id="fullname"
                  type="text"
                  bind:value={name}
                  placeholder="e.g. Eleanor Vance"
                  class="pl-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
                  required
                />
              </div>
            </div>

            <div class="space-y-1">
              <Label for="company" class="text-xs font-medium text-[#122b2e]">Company Name *</Label>
              <div class="relative">
                <Building2 class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <Input
                  id="company"
                  type="text"
                  bind:value={company}
                  placeholder="e.g. Nexus Health"
                  class="pl-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
                  required
                />
              </div>
            </div>
          </div>

          <div class="space-y-1">
            <Label for="email" class="text-xs font-medium text-[#122b2e]">Work Email (Unique) *</Label>
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
            <Label for="password" class="text-xs font-medium text-[#122b2e]">Password Policy *</Label>
            <div class="relative">
              <Lock class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                id="password"
                type="password"
                bind:value={password}
                placeholder="Enter password..."
                class="pl-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
                required
              />
            </div>

            <!-- Live Password Security Rule Matrix (Scene 1 Requirements) -->
            <div class="p-2.5 bg-[#f8fafb] border border-[#e5ecee] rounded-xl mt-2 space-y-1.5 text-[11px]">
              <div class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider mb-1">Security Standards:</div>
              <div class="flex items-center gap-1.5 {hasLength ? 'text-[#143e42] font-semibold' : 'text-[#7e9599]'}">
                {#if hasLength}<Check class="w-3.5 h-3.5 text-emerald-600" />{:else}<X class="w-3.5 h-3.5 text-zinc-400" />{/if}
                <span>Length &gt; 8 characters (at least 9 chars)</span>
              </div>
              <div class="flex items-center gap-1.5 {hasUpper ? 'text-[#143e42] font-semibold' : 'text-[#7e9599]'}">
                {#if hasUpper}<Check class="w-3.5 h-3.5 text-emerald-600" />{:else}<X class="w-3.5 h-3.5 text-zinc-400" />{/if}
                <span>At least 1 uppercase letter (A-Z)</span>
              </div>
              <div class="flex items-center gap-1.5 {hasLower ? 'text-[#143e42] font-semibold' : 'text-[#7e9599]'}">
                {#if hasLower}<Check class="w-3.5 h-3.5 text-emerald-600" />{:else}<X class="w-3.5 h-3.5 text-zinc-400" />{/if}
                <span>At least 1 lowercase letter (a-z)</span>
              </div>
              <div class="flex items-center gap-1.5 {hasSpecial ? 'text-[#143e42] font-semibold' : 'text-[#7e9599]'}">
                {#if hasSpecial}<Check class="w-3.5 h-3.5 text-emerald-600" />{:else}<X class="w-3.5 h-3.5 text-zinc-400" />{/if}
                <span>At least 1 special character (!@#$%^&amp;*...)</span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!isPasswordValid || !name || !email}
            class="w-full bg-[#183f42] hover:bg-[#123033] text-white h-9 text-xs font-semibold rounded-xl mt-2 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Account &amp; Generate Profile
          </Button>

          <div class="text-center text-[11px] text-[#7e9599] pt-2">
            Already have an account?
            <a href="/signin" class="font-semibold text-[#183f42] hover:underline ml-1">Sign In</a>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
