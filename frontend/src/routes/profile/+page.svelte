<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { currentUser, logout, getUserRole } from "$lib/stores/auth.js";
  import { authApi } from "$lib/api.js";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import {
    User,
    Mail,
    Phone,
    Building2,
    Shield,
    Repeat,
    LogOut,
    CheckCircle2,
    Briefcase,
    Plus,
    X,
    UserPlus,
    Eye,
    EyeOff,
    Copy,
    Check,
    ExternalLink,
    KeyRound,
    MailCheck,
    AlertCircle,
    Sparkles
  } from "lucide-svelte";

  let userRole = $derived(getUserRole($currentUser));
  let isAdmin = $derived(userRole === "admin");

  // Staff Creation Form State
  let showAddStaffModal = $state(false);
  let showCredentialsModal = $state(false);
  let isSubmittingStaff = $state(false);
  let staffName = $state("");
  let staffEmail = $state("");
  let staffPassword = $state("");
  let staffPhone = $state("");
  let showPassword = $state(false);
  let staffError = $state("");
  let staffSuccessMessage = $state("");
  let copiedPassword = $state(false);

  // Newly created staff credentials cache for preview modal
  let createdStaffData = $state(null);

  // Live staff users loaded from backend database
  let staffMembers = $state([]);

  async function loadStaffUsers() {
    if (!browser) return;
    try {
      const res = await authApi.getUsers();
      if (res.success && Array.isArray(res.data)) {
        const dbStaff = res.data.filter(u => u.role === "staff");
        if (dbStaff.length > 0) {
          staffMembers = dbStaff;
        }
      }
    } catch (err) {
      console.warn("Could not load live staff accounts:", err.message);
    }
  }

  $effect(() => {
    if (browser) {
      loadStaffUsers();
      if (page.url.searchParams.get("action") === "create-staff" && isAdmin) {
        showAddStaffModal = true;
      }
    }
  });

  function generateRandomPassword() {
    const chars = "abcdefghijkmnopqrstuvwxyz";
    const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const digits = "23456789";
    const specials = "!@#$%^&*";
    let pwd = "Staff@";
    for (let i = 0; i < 4; i++) pwd += uppers[Math.floor(Math.random() * uppers.length)];
    for (let i = 0; i < 4; i++) pwd += digits[Math.floor(Math.random() * digits.length)];
    pwd += specials[Math.floor(Math.random() * specials.length)];
    staffPassword = pwd;
  }

  function handleSignOut() {
    logout();
    goto("/signin");
  }

  async function handleCreateStaff() {
    staffError = "";
    if (!staffName || !staffEmail) {
      staffError = "Staff member name and work email are required.";
      return;
    }

    // Default password if blank
    const pwd = staffPassword.trim() || `Staff@BrightLoop${Math.floor(1000 + Math.random() * 9000)}!`;
    isSubmittingStaff = true;

    try {
      const res = await authApi.createStaff({
        name: staffName.trim(),
        email: staffEmail.trim().toLowerCase(),
        password: pwd,
        role: "staff"
      });

      if (!res.success) {
        throw new Error(res.error?.message || "Failed to create staff account");
      }

      const createdUser = res.data?.user || {
        id: `STF-${Date.now()}`,
        name: staffName.trim(),
        email: staffEmail.trim().toLowerCase(),
        role: "staff"
      };

      staffMembers = [createdUser, ...staffMembers.filter(s => s.id !== createdUser.id && s.email !== createdUser.email)];
      createdStaffData = {
        name: staffName.trim(),
        email: staffEmail.trim().toLowerCase(),
        password: pwd,
        emailStatus: res.data?.emailStatus
      };

      staffSuccessMessage = `Staff account created for ${staffName.trim()}! Login credentials dispatched to ${staffEmail.trim()}.`;
      staffName = "";
      staffEmail = "";
      staffPassword = "";
      staffPhone = "";
      showAddStaffModal = false;
      showCredentialsModal = true;
    } catch (err) {
      staffError = err.message || "Failed to provision staff account.";
    } finally {
      isSubmittingStaff = false;
    }
  }

  function copyToClipboard(text) {
    if (browser && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      copiedPassword = true;
      setTimeout(() => (copiedPassword = false), 2500);
    }
  }
</script>

<AppShell title="Account & Organization">
  <div class="space-y-6 max-w-4xl">
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-[#edf2f3]">
      <div>
        <h2 class="text-base font-bold text-[#122b2e] tracking-tight">Profile &amp; RBAC Control</h2>
        <p class="text-xs text-[#7e9599] mt-0.5">Manage authenticated credentials, enterprise details, and staff account provisioning.</p>
      </div>
      <Button
        variant="outline"
        size="xs"
        onclick={handleSignOut}
        class="text-xs border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl gap-1.5"
      >
        <LogOut class="w-3.5 h-3.5" /> Sign Out
      </Button>
    </div>

    {#if staffSuccessMessage}
      <div class="p-3 bg-[#e6f4f2] border border-[#bde4df] text-[#143e42] text-xs rounded-xl flex items-center justify-between shadow-xs">
        <div class="flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{staffSuccessMessage}</span>
        </div>
        <button onclick={() => (staffSuccessMessage = "")} class="text-[#143e42] hover:opacity-75">
          <X class="w-4 h-4" />
        </button>
      </div>
    {/if}

    <!-- Profile Overview Card -->
    <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl relative overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-1 bg-[#183f42]"></div>
      <Card.Content class="p-6">
        <div class="flex items-center gap-5">
          <div class="w-16 h-16 rounded-2xl bg-[#183f42] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {$currentUser.avatar || "US"}
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-[#122b2e]">{$currentUser.name}</h3>
              <span class="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]">
                Active
              </span>
            </div>
            <div class="text-xs text-[#586f73] font-medium">{$currentUser.role} • {$currentUser.company || "Brightloop Enterprise"}</div>
            <div class="text-[11px] text-[#8c9ba5]">Email: {$currentUser.email}</div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Admin-Only Staff Account Management -->
    {#if isAdmin}
      <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl">
        <Card.Header class="pb-3 border-b border-[#f4f7f8] flex flex-row items-center justify-between">
          <div>
            <Card.Title class="text-xs font-bold text-[#122b2e] uppercase tracking-wider flex items-center gap-2">
              <Shield class="w-4 h-4 text-[#183f42]" /> Internal Staff Accounts (Admin-Only RBAC)
            </Card.Title>
            <p class="text-[#7e9599] text-[11px] mt-0.5">
              Provision internal staff logins. Credentials (username &amp; password) are emailed automatically to the registered address.
            </p>
          </div>
          <Button
            onclick={() => { staffError = ""; showAddStaffModal = true; }}
            size="xs"
            class="bg-[#183f42] hover:bg-[#123033] text-white text-xs rounded-xl gap-1 shadow-xs"
          >
            <UserPlus class="w-3.5 h-3.5" /> Add Staff Member
          </Button>
        </Card.Header>
        <Card.Content class="pt-4 space-y-3 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {#each staffMembers as stf}
              <div class="p-3.5 bg-[#f8fafb] border border-[#e5ecee] rounded-xl flex items-center justify-between">
                <div>
                  <div class="font-bold text-[#122b2e] flex items-center gap-1.5">
                    <Briefcase class="w-3.5 h-3.5 text-[#183f42]" />
                    <span>{stf.name}</span>
                  </div>
                  <div class="text-[11px] text-[#7e9599] mt-0.5">{stf.email}</div>
                </div>
                <span class="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Staff Role
                </span>
              </div>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>
    {/if}
  </div>
</AppShell>

<!-- ========================================================================= -->
<!-- MODAL: PROVISION STAFF ACCOUNT (ADMIN ONLY)                                -->
<!-- ========================================================================= -->
{#if showAddStaffModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-[#edf2f3] mb-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-[#e6f4f2] text-[#183f42] flex items-center justify-center">
            <UserPlus class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-bold text-[#122b2e] text-sm">Provision Staff Account</h3>
            <p class="text-[11px] text-[#7e9599]">Creates a Staff Operations login and sends credentials by email</p>
          </div>
        </div>
        <button onclick={() => (showAddStaffModal = false)} class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100">
          <X class="w-4 h-4" />
        </button>
      </div>

      {#if staffError}
        <div class="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
          <span>{staffError}</span>
        </div>
      {/if}

      <form onsubmit={(e) => { e.preventDefault(); handleCreateStaff(); }} class="space-y-3.5">
        <div>
          <Label for="s-name" class="font-semibold text-[#122b2e]">Staff Full Name *</Label>
          <div class="relative mt-1">
            <User class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <Input id="s-name" bind:value={staffName} placeholder="e.g. Alex Morgan" class="pl-9 h-9 text-xs bg-[#f8fafb] border-[#e5ecee] rounded-xl" required />
          </div>
        </div>

        <div>
          <Label for="s-email" class="font-semibold text-[#122b2e]">Registered Corporate Email *</Label>
          <div class="relative mt-1">
            <Mail class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <Input id="s-email" type="email" bind:value={staffEmail} placeholder="e.g. alex.m@brightloop.io" class="pl-9 h-9 text-xs bg-[#f8fafb] border-[#e5ecee] rounded-xl" required />
          </div>
          <p class="text-[10px] text-[#7e9599] mt-1">
            Official account credentials will be dispatched to this email address.
          </p>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <Label for="s-pwd" class="font-semibold text-[#122b2e]">Assign Password (or Auto-Generate)</Label>
            <button
              type="button"
              onclick={generateRandomPassword}
              class="text-[11px] text-[#183f42] hover:underline font-semibold flex items-center gap-1"
            >
              <Sparkles class="w-3 h-3 text-[#183f42]" /> Auto-Generate
            </button>
          </div>
          <div class="relative mt-1">
            <KeyRound class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <Input
              id="s-pwd"
              type={showPassword ? "text" : "password"}
              bind:value={staffPassword}
              placeholder="Leave blank to auto-generate enterprise password"
              class="pl-9 pr-9 h-9 text-xs bg-[#f8fafb] border-[#e5ecee] rounded-xl"
            />
            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              class="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
            >
              {#if showPassword}
                <EyeOff class="w-3.5 h-3.5" />
              {:else}
                <Eye class="w-3.5 h-3.5" />
              {/if}
            </button>
          </div>
        </div>

        <!-- Email Notification Notice Card -->
        <div class="p-3 bg-[#e6f4f2] border border-[#bde4df] rounded-xl text-[#143e42] text-[11px] flex items-start gap-2.5">
          <MailCheck class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div class="leading-relaxed">
            <span class="font-bold">Automated Email Dispatch:</span>
            Upon submission, BrightLoop will automatically dispatch a secure onboarding email containing their username, password, and sign-in portal link.
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#edf2f3] mt-4">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onclick={() => (showAddStaffModal = false)}
            class="rounded-xl h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmittingStaff}
            size="xs"
            class="bg-[#183f42] hover:bg-[#123033] text-white rounded-xl h-8 text-xs font-semibold px-4 flex items-center gap-1.5 shadow-sm"
          >
            {#if isSubmittingStaff}
              <div class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Creating &amp; Sending...</span>
            {:else}
              <Mail class="w-3.5 h-3.5" />
              <span>Create Staff &amp; Send Email</span>
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- ========================================================================= -->
<!-- MODAL: CREDENTIALS DISPATCH CONFIRMATION                                 -->
<!-- ========================================================================= -->
{#if showCredentialsModal && createdStaffData}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-[#edf2f3] mb-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-[#e6f4f2] text-[#183f42] flex items-center justify-center">
            <CheckCircle2 class="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 class="font-bold text-[#122b2e] text-sm">Staff Account Provisioned</h3>
            <p class="text-[11px] text-[#7e9599]">Credentials dispatched to registered corporate email</p>
          </div>
        </div>
        <button onclick={() => (showCredentialsModal = false)} class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3.5">
        <div class="p-3 bg-[#e6f4f2] border border-[#bde4df] rounded-xl text-[#143e42] text-[11px] flex items-start gap-2">
          <MailCheck class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p class="font-bold">Welcome Email Dispatched</p>
            <p class="mt-0.5 leading-relaxed">
              Login credentials have been dispatched to <b>{createdStaffData.email}</b>.
            </p>
          </div>
        </div>

        <!-- Credentials Snapshot Card -->
        <div class="p-4 bg-[#f8fafb] border border-[#e5ecee] rounded-xl space-y-2.5">
          <div class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider">
            Staff Sign-In Credentials
          </div>
          <div class="space-y-1.5 font-mono text-xs">
            <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-[#edf2f3]">
              <span class="text-[#7e9599] font-sans">Username / Email:</span>
              <span class="font-bold text-[#122b2e]">{createdStaffData.email}</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-[#edf2f3]">
              <span class="text-[#7e9599] font-sans">Password:</span>
              <span class="font-bold text-emerald-700">{createdStaffData.password}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="xs"
            onclick={() => copyToClipboard(`Username: ${createdStaffData.email}\nPassword: ${createdStaffData.password}`)}
            class="w-full text-xs h-7 rounded-lg gap-1.5"
          >
            {#if copiedPassword}
              <Check class="w-3.5 h-3.5 text-emerald-600" />
              <span class="text-emerald-700 font-semibold">Copied to Clipboard!</span>
            {:else}
              <Copy class="w-3.5 h-3.5" />
              <span>Copy Credentials</span>
            {/if}
          </Button>
        </div>

        <!-- Live Email Delivery Status (Direct SMTP to staff inbox or Simulated Preview) -->
        {#if createdStaffData.emailStatus?.realDispatch || (!createdStaffData.emailStatus?.previewUrl && createdStaffData.emailStatus?.sent)}
          <div class="p-3 bg-[#e6f4f2] border border-[#bde4df] rounded-xl space-y-1.5">
            <div class="flex items-center justify-between text-[10px] text-[#143e42] font-semibold uppercase">
              <span class="flex items-center gap-1.5"><CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" /> Direct Gmail SMTP Delivery</span>
              <span class="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 font-bold">Delivered to Inbox</span>
            </div>
            <p class="text-[11px] text-[#143e42]">
              Real credentials email dispatched from <b>donaelsaj04@gmail.com</b> directly to <b>{createdStaffData.email}</b>. The staff member can check their actual email inbox.
            </p>
          </div>
        {:else if createdStaffData.emailStatus?.previewUrl}
          <div class="p-3 bg-white border border-[#dde7e8] rounded-xl space-y-2">
            <div class="flex items-center justify-between text-[10px] text-[#586f73] font-semibold uppercase">
              <span>Simulated Inbox Preview</span>
              <span class="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Sent Live</span>
            </div>
            <p class="text-[11px] text-[#586f73]">
              View the exact HTML email received in the test inbox:
            </p>
            <a
              href={createdStaffData.emailStatus.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="w-full bg-[#183f42] text-white hover:bg-[#123033] h-8 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 text-center shadow-xs"
            >
              <span>Open Sent Email Preview</span>
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
          </div>
        {/if}

        <div class="flex justify-end pt-2">
          <Button
            size="xs"
            onclick={() => (showCredentialsModal = false)}
            class="bg-[#183f42] text-white rounded-xl text-xs px-4"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}
