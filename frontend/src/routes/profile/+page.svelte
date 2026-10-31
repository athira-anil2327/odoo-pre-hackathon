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
    CheckCircle2
  } from "lucide-svelte";

  function handleSignOut() {
    logout();
    goto("/signin");
  }
</script>

<AppShell title="Account & Profile Details">
  <div class="space-y-6 max-w-4xl">
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-[#edf2f3]">
      <div>
        <h2 class="text-base font-bold text-[#122b2e] tracking-tight">Profile & Organization Details</h2>
        <p class="text-xs text-[#7e9599] mt-0.5">Manage your enterprise account, contact information, and role credentials.</p>
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
                {$currentUser.status}
              </span>
            </div>
            <div class="text-xs text-[#586f73] font-medium">{$currentUser.role} • {$currentUser.company}</div>
            <div class="text-[11px] text-[#8c9ba5]">Customer ID: {$currentUser.customerId}</div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Details Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Personal Details -->
      <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl">
        <Card.Header class="pb-3 border-b border-[#f4f7f8]">
          <Card.Title class="text-xs font-bold text-[#122b2e] uppercase tracking-wider flex items-center gap-2">
            <User class="w-4 h-4 text-[#183f42]" /> Personal Information
          </Card.Title>
        </Card.Header>
        <Card.Content class="space-y-3.5 text-xs pt-4">
          <div class="space-y-1">
            <Label class="text-xs text-[#586f73] font-medium">Full Name</Label>
            <Input type="text" value={$currentUser.name} class="h-9 text-xs bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl" />
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-[#586f73] font-medium">Work Email</Label>
            <Input type="email" value={$currentUser.email} class="h-9 text-xs bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl" />
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-[#586f73] font-medium">Phone Number</Label>
            <Input type="text" value={$currentUser.phone} class="h-9 text-xs bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl" />
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-[#586f73] font-medium">Account Role</Label>
            <Input type="text" value={$currentUser.role} disabled class="h-9 text-xs bg-zinc-100 text-zinc-500 rounded-xl" />
          </div>

          <div class="pt-2">
            <Button size="xs" class="bg-[#183f42] hover:bg-[#123033] text-white text-xs font-semibold rounded-xl shadow-xs">
              Save Personal Changes
            </Button>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Organization & Subscription Details -->
      <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl">
        <Card.Header class="pb-3 border-b border-[#f4f7f8]">
          <Card.Title class="text-xs font-bold text-[#122b2e] uppercase tracking-wider flex items-center gap-2">
            <Building2 class="w-4 h-4 text-[#183f42]" /> Organization & Subscription
          </Card.Title>
        </Card.Header>
        <Card.Content class="space-y-3.5 text-xs pt-4">
          <div class="space-y-1">
            <Label class="text-xs text-[#586f73] font-medium">Company Name</Label>
            <Input type="text" value={$currentUser.company} class="h-9 text-xs bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl" />
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-[#586f73] font-medium">Active Subscription Plan</Label>
            <div class="p-3 bg-[#f8fafb] border border-[#e8eff0] rounded-xl flex items-center justify-between">
              <span class="font-semibold text-[#122b2e]">{$currentUser.plan}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]">
                {$currentUser.billingCycle}
              </span>
            </div>
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-[#586f73] font-medium">Security & Authentication</Label>
            <div class="p-3 bg-[#f8fafb] border border-[#e8eff0] rounded-xl flex items-center justify-between text-[11px]">
              <span class="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 class="w-3.5 h-3.5" /> Two-Factor Enabled
              </span>
              <Button variant="ghost" size="xs" class="h-6 text-[11px] p-1 text-[#586f73] hover:text-[#183f42]">
                Configure
              </Button>
            </div>
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-[#586f73] font-medium">API Tokens</Label>
            <div class="p-3 bg-[#f8fafb] border border-[#e8eff0] rounded-xl flex items-center justify-between text-[11px]">
              <span class="font-mono text-[#586f73]">prod_live_9920...</span>
              <Button variant="ghost" size="xs" class="h-6 text-[11px] p-1 text-[#586f73] hover:text-[#183f42]">
                Regenerate
              </Button>
            </div>
          </div>

          <div class="pt-2">
            <Button variant="outline" size="xs" class="text-xs border-[#e2eaeb] text-[#586f73] hover:bg-[#f8fafb] rounded-xl">
              Update Organization
            </Button>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</AppShell>
