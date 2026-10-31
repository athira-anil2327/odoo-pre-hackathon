<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { currentUser, logout } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";
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
    UserPlus
  } from "lucide-svelte";

  let showAddStaffModal = $state(false);
  let staffName = $state("");
  let staffEmail = $state("");
  let staffPhone = $state("");
  let staffSuccessMessage = $state("");

  // Demo staff directory
  let staffMembers = $state([
    { id: "STF-1", name: "Sarah Jenkins", email: "sales@brightloop.io", phone: "+1 (555) 100-0002", role: "Staff Operations" },
    { id: "STF-2", name: "Marcus Brody", email: "marcus.b@brightloop.io", phone: "+1 (555) 100-0003", role: "Staff Operations" }
  ]);

  function handleSignOut() {
    logout();
    goto("/signin");
  }

  function handleCreateStaff() {
    if (!staffName || !staffEmail) return;
    const newStaff = {
      id: `STF-${staffMembers.length + 1}`,
      name: staffName,
      email: staffEmail,
      phone: staffPhone || "+1 (555) 000-0000",
      role: "Staff Operations"
    };
    staffMembers = [...staffMembers, newStaff];
    staffSuccessMessage = `Staff account created for ${staffName} (${staffEmail}) with role 'staff'!`;
    staffName = "";
    staffEmail = "";
    staffPhone = "";
    showAddStaffModal = false;
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
      <div class="p-3 bg-[#e6f4f2] border border-[#bde4df] text-[#143e42] text-xs rounded-xl flex items-center justify-between">
        <div class="flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 shrink-0 text-[#143e42]" />
          <span>{staffSuccessMessage}</span>
        </div>
        <button onclick={() => (staffSuccessMessage = "")} class="text-[#143e42]">
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
            {$currentUser.avatar}
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-[#122b2e]">{$currentUser.name}</h3>
              <span class="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]">
                Active
              </span>
            </div>
            <div class="text-xs text-[#586f73] font-medium">{$currentUser.role} • {$currentUser.company}</div>
            <div class="text-[11px] text-[#8c9ba5]">Email: {$currentUser.email}</div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Admin-Only Staff Account Management (Scene 1 Requirement) -->
    <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl">
      <Card.Header class="pb-3 border-b border-[#f4f7f8] flex flex-row items-center justify-between">
        <Card.Title class="text-xs font-bold text-[#122b2e] uppercase tracking-wider flex items-center gap-2">
          <Shield class="w-4 h-4 text-[#183f42]" /> Internal Staff Accounts (Admin-Only RBAC)
        </Card.Title>
        <Button
          onclick={() => (showAddStaffModal = true)}
          size="xs"
          class="bg-[#183f42] hover:bg-[#123033] text-white text-xs rounded-xl gap-1 shadow-xs"
        >
          <UserPlus class="w-3.5 h-3.5" /> Add Staff Member
        </Button>
      </Card.Header>
      <Card.Content class="pt-4 space-y-2 text-xs">
        <p class="text-[#7e9599] text-[11px] mb-3">
          Only the Admin persona has permission to provision Internal Staff accounts (<code>POST /api/users/staff</code>).
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each staffMembers as stf}
            <div class="p-3 bg-[#f8fafb] border border-[#e5ecee] rounded-xl flex items-center justify-between">
              <div>
                <div class="font-bold text-[#122b2e] flex items-center gap-1.5">
                  <Briefcase class="w-3.5 h-3.5 text-[#183f42]" />
                  <span>{stf.name}</span>
                </div>
                <div class="text-[11px] text-[#7e9599] mt-0.5">{stf.email} • {stf.phone}</div>
              </div>
              <span class="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Staff
              </span>
            </div>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>
  </div>
</AppShell>

<!-- MODAL: ADD STAFF ACCOUNT (ADMIN ONLY) -->
{#if showAddStaffModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-sm w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div class="flex items-center gap-2">
          <UserPlus class="w-4 h-4 text-[#183f42]" />
          <h3 class="font-bold text-[#122b2e]">Provision Staff Account</h3>
        </div>
        <button onclick={() => (showAddStaffModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3">
        <div>
          <Label for="s-name" class="font-medium text-[#122b2e]">Staff Member Name *</Label>
          <Input id="s-name" bind:value={staffName} placeholder="e.g. Alex Morgan" class="h-9 text-xs mt-1" />
        </div>

        <div>
          <Label for="s-email" class="font-medium text-[#122b2e]">Work Email *</Label>
          <Input id="s-email" type="email" bind:value={staffEmail} placeholder="alex.m@brightloop.io" class="h-9 text-xs mt-1" />
        </div>

        <div>
          <Label for="s-phone" class="font-medium text-[#122b2e]">Phone Number</Label>
          <Input id="s-phone" bind:value={staffPhone} placeholder="+1 (555) 100-0004" class="h-9 text-xs mt-1" />
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 mt-4">
        <Button variant="outline" size="xs" onclick={() => (showAddStaffModal = false)} class="rounded-xl">Cancel</Button>
        <Button size="xs" onclick={handleCreateStaff} class="bg-[#183f42] text-white rounded-xl">Provision Account</Button>
      </div>
    </div>
  </div>
{/if}
