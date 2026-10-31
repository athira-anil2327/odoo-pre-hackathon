<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
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
    Sparkles
  } from "lucide-svelte";

  function handleSignOut() {
    logout();
    goto("/signin");
  }
</script>

<AppShell title="Account & Profile Details">
  <div class="space-y-6 max-w-4xl">
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-zinc-200/70">
      <div>
        <h2 class="text-base font-bold text-zinc-900 tracking-tight">Profile & Organization Details</h2>
        <p class="text-xs text-zinc-500 mt-0.5">Manage your enterprise account, contact information, and role credentials.</p>
      </div>
      <Button
        variant="outline"
        size="xs"
        onclick={handleSignOut}
        class="text-xs border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg gap-1.5"
      >
        <LogOut class="w-3.5 h-3.5" /> Sign Out
      </Button>
    </div>

    <!-- Profile Overview Card with Magenta Gradient -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl relative overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-1 gradient-magenta"></div>
      <Card.Content class="p-6">
        <div class="flex items-center gap-5">
          <div class="w-16 h-16 rounded-2xl gradient-magenta text-white flex items-center justify-center font-bold text-lg glow-magenta-xs shadow-sm">
            {$currentUser.avatar}
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-zinc-900">{$currentUser.name}</h3>
              <span class="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/60">
                {$currentUser.status}
              </span>
            </div>
            <div class="text-xs text-zinc-500 font-medium">{$currentUser.role} • {$currentUser.company}</div>
            <div class="text-[11px] text-zinc-400">Customer ID: {$currentUser.customerId}</div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Details Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Personal Details -->
      <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl">
        <Card.Header class="pb-3 border-b border-zinc-100">
          <Card.Title class="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <User class="w-4 h-4 text-fuchsia-600" /> Personal Information
          </Card.Title>
        </Card.Header>
        <Card.Content class="space-y-3.5 text-xs pt-4">
          <div class="space-y-1">
            <Label class="text-xs text-zinc-600 font-medium">Full Name</Label>
            <Input type="text" value={$currentUser.name} class="h-8 text-xs bg-zinc-50/50 border-zinc-200 rounded-lg" />
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-zinc-600 font-medium">Work Email</Label>
            <Input type="email" value={$currentUser.email} class="h-8 text-xs bg-zinc-50/50 border-zinc-200 rounded-lg" />
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-zinc-600 font-medium">Phone Number</Label>
            <Input type="text" value={$currentUser.phone} class="h-8 text-xs bg-zinc-50/50 border-zinc-200 rounded-lg" />
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-zinc-600 font-medium">Account Role</Label>
            <Input type="text" value={$currentUser.role} disabled class="h-8 text-xs bg-zinc-100 text-zinc-500 rounded-lg" />
          </div>

          <div class="pt-2">
            <Button variant="default" size="xs" class="gradient-magenta hover:opacity-95 text-white glow-magenta-xs text-xs font-semibold rounded-lg shadow-xs">
              Save Personal Changes
            </Button>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Organization & Subscription Details -->
      <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl">
        <Card.Header class="pb-3 border-b border-zinc-100">
          <Card.Title class="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 class="w-4 h-4 text-fuchsia-600" /> Organization & Subscription
          </Card.Title>
        </Card.Header>
        <Card.Content class="space-y-3.5 text-xs pt-4">
          <div class="space-y-1">
            <Label class="text-xs text-zinc-600 font-medium">Company Name</Label>
            <Input type="text" value={$currentUser.company} class="h-8 text-xs bg-zinc-50/50 border-zinc-200 rounded-lg" />
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-zinc-600 font-medium">Active Subscription Plan</Label>
            <div class="p-2.5 bg-gradient-to-r from-zinc-50 to-fuchsia-50/20 border border-zinc-200/70 rounded-lg flex items-center justify-between">
              <span class="font-semibold text-zinc-800">{$currentUser.plan}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-fuchsia-100/70 text-fuchsia-800">
                {$currentUser.billingCycle}
              </span>
            </div>
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-zinc-600 font-medium">Security & Authentication</Label>
            <div class="p-2.5 bg-zinc-50/80 border border-zinc-200/70 rounded-lg flex items-center justify-between text-[11px]">
              <span class="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 class="w-3.5 h-3.5" /> Two-Factor Enabled
              </span>
              <Button variant="ghost" size="xs" class="h-6 text-[11px] p-1 text-zinc-600 hover:text-fuchsia-700">
                Configure
              </Button>
            </div>
          </div>

          <div class="space-y-1">
            <Label class="text-xs text-zinc-600 font-medium">API Tokens</Label>
            <div class="p-2.5 bg-zinc-50/80 border border-zinc-200/70 rounded-lg flex items-center justify-between text-[11px]">
              <span class="font-mono text-zinc-600">prod_live_9920...</span>
              <Button variant="ghost" size="xs" class="h-6 text-[11px] p-1 text-zinc-600 hover:text-fuchsia-700">
                Regenerate
              </Button>
            </div>
          </div>

          <div class="pt-2">
            <Button variant="outline" size="xs" class="text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-lg">
              Update Organization
            </Button>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</AppShell>
