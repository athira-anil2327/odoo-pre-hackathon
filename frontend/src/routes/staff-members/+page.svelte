<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { authApi } from "$lib/api.js";
  import { currentUser } from "$lib/stores/auth.js";
  import { page } from "$app/state";
  import { browser } from "$app/environment";
  import {
    Users,
    UserPlus,
    Search,
    Mail,
    Phone,
    Shield,
    CheckCircle2,
    AlertCircle,
    X,
    Eye,
    EyeOff,
    Wand2,
    Copy,
    Check,
    MailCheck,
    ExternalLink,
    Clock,
    Sparkles,
    ShieldCheck
  } from "lucide-svelte";

  let searchQuery = $state("");
  let staffList = $state([]);
  let isLoadingStaff = $state(true);

  // Staff Creation Modal
  let showAddStaffModal = $state(false);
  let newStaffName = $state("");
  let newStaffEmail = $state("");
  let newStaffPassword = $state("");
  let newStaffPhone = $state("");
  let showPasswordPlain = $state(false);
  let staffError = $state("");
  let isSubmittingStaff = $state(false);

  // Credentials Dispatched Modal
  let showCredentialsModal = $state(false);
  let createdStaffData = $state(null);
  let copiedPassword = $state(false);

  // Auto-open modal if URL has ?action=create
  $effect(() => {
    if (browser) {
      if (page.url.searchParams.get("action") === "create") {
        showAddStaffModal = true;
      }
      loadStaffAccounts();
    }
  });

  async function loadStaffAccounts() {
    isLoadingStaff = true;
    try {
      const res = await authApi.getUsers();
      if (res.success && Array.isArray(res.data)) {
        staffList = res.data.filter(u => u.role === "staff");
      }
    } catch (err) {
      console.warn("Could not load staff users list:", err.message);
    } finally {
      isLoadingStaff = false;
    }
  }

  function generateSecurePassword() {
    const specials = "@#$&*";
    const special = specials[Math.floor(Math.random() * specials.length)];
    const randomChars = Math.random().toString(36).slice(-6).toUpperCase();
    newStaffPassword = `Staff@${randomChars}${special}`;
  }

  function handleOpenAddStaff() {
    staffError = "";
    newStaffName = "";
    newStaffEmail = "";
    newStaffPhone = "";
    showPasswordPlain = false;
    generateSecurePassword();
    showAddStaffModal = true;
  }

  async function handleCreateStaffSubmit(e) {
    e.preventDefault();
    staffError = "";

    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      staffError = "Please enter both the staff member's full name and email.";
      return;
    }

    if (!newStaffPassword || newStaffPassword.length < 8) {
      staffError = "Password must be at least 8 characters.";
      return;
    }

    isSubmittingStaff = true;

    try {
      const res = await authApi.createStaff({
        name: newStaffName.trim(),
        email: newStaffEmail.trim().toLowerCase(),
        password: newStaffPassword,
        phone: newStaffPhone.trim() || undefined
      });

      if (!res.success) {
        throw new Error(res.error?.message || "Failed to provision staff member.");
      }

      createdStaffData = {
        name: newStaffName.trim(),
        email: newStaffEmail.trim().toLowerCase(),
        password: newStaffPassword,
        emailStatus: res.data?.emailStatus || {}
      };

      showAddStaffModal = false;
      showCredentialsModal = true;

      // Refresh staff directory
      await loadStaffAccounts();
    } catch (err) {
      staffError = err.message || "Failed to create staff account.";
    } finally {
      isSubmittingStaff = false;
    }
  }

  function copyToClipboard(text) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      copiedPassword = true;
      setTimeout(() => (copiedPassword = false), 2500);
    }
  }

  const filteredStaff = $derived(
    staffList.filter(s => {
      const q = searchQuery.toLowerCase();
      return (
        (s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.role || "").toLowerCase().includes(q)
      );
    })
  );
</script>

<AppShell title="Staff Management & Provisioning">
  <div class="space-y-6">
    <!-- Top Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#edf2f3] gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-base font-bold text-[#122b2e] tracking-tight">Staff Operations Directory</h2>
          <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <ShieldCheck class="w-3 h-3 text-emerald-600" /> Admin RBAC
          </span>
        </div>
        <p class="text-xs text-[#7e9599] mt-0.5">
          Internal staff accounts, access control, and automated credentials dispatch via Gmail SMTP.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <Button
          onclick={handleOpenAddStaff}
          size="xs"
          class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs"
        >
          <UserPlus class="w-3.5 h-3.5" /> Provision Staff Member
        </Button>
      </div>
    </div>

    <!-- Overview Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl p-4">
        <div class="flex items-center justify-between text-[#8c9ba5] text-xs font-semibold uppercase">
          <span>Total Staff Accounts</span>
          <Users class="w-4 h-4 text-[#183f42]" />
        </div>
        <div class="text-2xl font-bold text-[#122b2e] mt-2">{staffList.length} Staff</div>
        <p class="text-[11px] text-[#7e9599] mt-1">Authorized internal operators</p>
      </Card.Root>

      <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl p-4">
        <div class="flex items-center justify-between text-[#8c9ba5] text-xs font-semibold uppercase">
          <span>Active SMTP Status</span>
          <MailCheck class="w-4 h-4 text-emerald-600" />
        </div>
        <div class="text-xs font-bold text-emerald-700 mt-2 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Gmail SMTP Connected
        </div>
        <p class="text-[11px] text-[#7e9599] mt-1 truncate" title="donaelsaj04@gmail.com">donaelsaj04@gmail.com</p>
      </Card.Root>

      <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl p-4">
        <div class="flex items-center justify-between text-[#8c9ba5] text-xs font-semibold uppercase">
          <span>Default Permission</span>
          <Shield class="w-4 h-4 text-blue-600" />
        </div>
        <div class="text-xs font-bold text-blue-800 mt-2">Operations &amp; Proposals</div>
        <p class="text-[11px] text-[#7e9599] mt-1">Quotations, Invoices, Contracts</p>
      </Card.Root>

      <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl p-4">
        <div class="flex items-center justify-between text-[#8c9ba5] text-xs font-semibold uppercase">
          <span>Onboarding Protocol</span>
          <Sparkles class="w-4 h-4 text-[#183f42]" />
        </div>
        <div class="text-xs font-bold text-[#122b2e] mt-2">Instant Dispatch</div>
        <p class="text-[11px] text-[#7e9599] mt-1">Credentials delivered to inbox</p>
      </Card.Root>
    </div>

    <!-- Filter & Search Toolbar -->
    <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl">
      <Card.Content class="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="relative w-full sm:w-80">
          <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <Input
            type="text"
            bind:value={searchQuery}
            placeholder="Search staff by name or email..."
            class="h-9 pl-9 text-xs bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
          />
        </div>
        <div class="text-xs text-[#7e9599]">
          Showing <b>{filteredStaff.length}</b> staff accounts
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Staff Members Table -->
    <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl overflow-hidden">
      <Card.Content class="p-3">
        <Table.Root>
          <Table.Header class="text-[#8c9ba5]">
            <Table.Row class="hover:bg-transparent border-[#edf2f3]">
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Staff Member</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Registered Work Email</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center text-[#8c9ba5]">Assigned Role</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center text-[#8c9ba5]">Status</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right text-[#8c9ba5]">Created Date</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right text-[#8c9ba5]">Quick Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs">
            {#if isLoadingStaff}
              <Table.Row>
                <Table.Cell colspan="6" class="text-center py-8 text-zinc-400">
                  <div class="inline-flex items-center gap-2">
                    <div class="w-4 h-4 border-2 border-[#183f42]/30 border-t-[#183f42] rounded-full animate-spin"></div>
                    <span>Loading staff directory...</span>
                  </div>
                </Table.Cell>
              </Table.Row>
            {:else if filteredStaff.length === 0}
              <Table.Row>
                <Table.Cell colspan="6" class="text-center py-8 text-zinc-400">
                  No staff accounts found. Click "Provision Staff Member" above to create one.
                </Table.Cell>
              </Table.Row>
            {:else}
              {#each filteredStaff as staff}
                <Table.Row class="transition-all hover:bg-[#f8fafb] border-[#f4f7f8]">
                  <Table.Cell class="py-3 px-4 font-semibold text-[#122b2e]">
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-[#e6f4f2] text-[#143e42] font-bold text-xs flex items-center justify-center border border-[#bde4df]">
                        {(staff.name || "ST").slice(0, 2).toUpperCase()}
                      </div>
                      <span>{staff.name}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell class="py-3 px-4 text-[#586f73]">
                    <span class="font-mono text-[11px] text-[#143e42]">{staff.email}</span>
                  </Table.Cell>
                  <Table.Cell class="py-3 px-4 text-center">
                    <span class="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      Staff Role
                    </span>
                  </Table.Cell>
                  <Table.Cell class="py-3 px-4 text-center">
                    <span class="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </Table.Cell>
                  <Table.Cell class="py-3 px-4 text-right text-[#7e9599]">
                    <span class="inline-flex items-center gap-1">
                      <Clock class="w-3 h-3 text-zinc-400" />
                      {staff.created_at ? String(staff.created_at).slice(0, 10) : "Active"}
                    </span>
                  </Table.Cell>
                  <Table.Cell class="py-3 px-4 text-right">
                    <button
                      onclick={() => copyToClipboard(`Username: ${staff.email}`)}
                      class="text-xs px-2.5 py-1 rounded-lg text-[#183f42] hover:bg-[#e6f4f2] font-medium transition-colors"
                      title="Copy Staff Email"
                    >
                      Copy Email
                    </button>
                  </Table.Cell>
                </Table.Row>
              {/each}
            {/if}
          </Table.Body>
        </Table.Root>
      </Card.Content>
    </Card.Root>
  </div>
</AppShell>

<!-- ========================================================================= -->
<!-- MODAL: PROVISION STAFF MEMBER FORM                                       -->
<!-- ========================================================================= -->
{#if showAddStaffModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-[#edf2f3] mb-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-[#e6f4f2] text-[#183f42] flex items-center justify-center">
            <UserPlus class="w-4 h-4 text-[#183f42]" />
          </div>
          <div>
            <h3 class="font-bold text-[#122b2e] text-sm">Provision Staff Member</h3>
            <p class="text-[11px] text-[#7e9599]">Create account &amp; email credentials automatically</p>
          </div>
        </div>
        <button onclick={() => (showAddStaffModal = false)} class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      {#if staffError}
        <div class="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
            <span>{staffError}</span>
          </div>
          <button onclick={() => (staffError = "")} class="text-rose-500 hover:text-rose-700">
            <X class="w-4 h-4" />
          </button>
        </div>
      {/if}

      <form onsubmit={handleCreateStaffSubmit} class="space-y-3.5">
        <div>
          <Label for="sm-name" class="font-medium text-[#122b2e]">Full Name *</Label>
          <Input
            id="sm-name"
            bind:value={newStaffName}
            placeholder="e.g. Rachel Green"
            required
            class="h-9 text-xs bg-[#f8fafb] border-[#e5ecee] rounded-xl mt-1"
          />
        </div>

        <div>
          <Label for="sm-email" class="font-medium text-[#122b2e]">Registered Work Email *</Label>
          <Input
            id="sm-email"
            type="email"
            bind:value={newStaffEmail}
            placeholder="e.g. rachel.green@company.com"
            required
            class="h-9 text-xs bg-[#f8fafb] border-[#e5ecee] rounded-xl mt-1"
          />
          <span class="text-[10px] text-[#7e9599] mt-0.5 block">
            Login credentials will be sent directly to this address via Gmail SMTP.
          </span>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <Label for="sm-pass" class="font-medium text-[#122b2e]">Assigned Password *</Label>
            <button
              type="button"
              onclick={generateSecurePassword}
              class="text-[11px] text-[#183f42] hover:underline flex items-center gap-1 font-semibold"
            >
              <Wand2 class="w-3 h-3 text-[#183f42]" />
              <span>Auto-Generate</span>
            </button>
          </div>
          <div class="relative mt-1">
            <Input
              id="sm-pass"
              type={showPasswordPlain ? "text" : "password"}
              bind:value={newStaffPassword}
              required
              class="h-9 text-xs font-mono bg-[#f8fafb] border-[#e5ecee] rounded-xl pr-9"
            />
            <button
              type="button"
              onclick={() => (showPasswordPlain = !showPasswordPlain)}
              class="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
            >
              {#if showPasswordPlain}
                <EyeOff class="w-4 h-4" />
              {:else}
                <Eye class="w-4 h-4" />
              {/if}
            </button>
          </div>
        </div>

        <div>
          <Label for="sm-phone" class="font-medium text-[#122b2e]">Phone Number (Optional)</Label>
          <Input
            id="sm-phone"
            bind:value={newStaffPhone}
            placeholder="+91 (555) 000-0000"
            class="h-9 text-xs bg-[#f8fafb] border-[#e5ecee] rounded-xl mt-1"
          />
        </div>

        <!-- Email Notification Notice Card -->
        <div class="p-3 bg-[#e6f4f2] border border-[#bde4df] rounded-xl text-[#143e42] text-[11px] flex items-start gap-2.5">
          <MailCheck class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div class="leading-relaxed">
            <span class="font-bold">Real-time Email Dispatch:</span>
            BrightLoop will immediately dispatch a branded credential notice from <b>donaelsaj04@gmail.com</b> containing login credentials and portal links.
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
              <span>Dispatching Email...</span>
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

        <!-- Live Email Delivery Status -->
        <div class="p-3 bg-[#e6f4f2] border border-[#bde4df] rounded-xl space-y-1.5">
          <div class="flex items-center justify-between text-[10px] text-[#143e42] font-semibold uppercase">
            <span class="flex items-center gap-1.5"><CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" /> Direct Gmail SMTP Delivery</span>
            <span class="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 font-bold">Delivered to Inbox</span>
          </div>
          <p class="text-[11px] text-[#143e42]">
            Real credentials email dispatched from <b>donaelsaj04@gmail.com</b> directly to <b>{createdStaffData.email}</b>. The staff member can check their actual email inbox.
          </p>
        </div>

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
