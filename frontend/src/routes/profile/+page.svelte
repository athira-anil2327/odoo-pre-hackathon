<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { currentUser, logout, getUserRole } from "$lib/stores/auth.js";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import {
    User,
    Mail,
    Building2,
    Shield,
    LogOut,
    CheckCircle2,
    Users,
    ArrowRight,
    Server,
    KeyRound,
    Check,
    Lock,
    ExternalLink
  } from "lucide-svelte";

  let userRole = $derived(getUserRole($currentUser));
  let isAdmin = $derived(userRole === "admin");

  $effect(() => {
    if (browser) {
      // If accessed with action=create-staff, redirect to dedicated staff management page
      if (page.url.searchParams.get("action") === "create-staff" && isAdmin) {
        goto("/staff-members?action=create");
      }
    }
  });

  function handleSignOut() {
    logout();
    goto("/signin");
  }
</script>

<AppShell title="Settings & Profile">
  <div class="space-y-6 max-w-4xl">
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-[#edf2f3]">
      <div>
        <h2 class="text-base font-bold text-[#122b2e] tracking-tight">Settings &amp; Account Profile</h2>
        <p class="text-xs text-[#7e9599] mt-0.5">Manage authenticated credentials, enterprise role permissions, and system configurations.</p>
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

    <!-- 1. Authenticated User Profile Card -->
    <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl relative overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-1 bg-[#183f42]"></div>
      <Card.Content class="p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div class="flex items-center gap-5">
            <div class="w-16 h-16 rounded-2xl bg-[#183f42] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {$currentUser.avatar || "US"}
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-base font-bold text-[#122b2e]">{$currentUser.name}</h3>
                <span class="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]">
                  Active Session
                </span>
                <span class="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {$currentUser.role}
                </span>
              </div>
              <div class="text-xs text-[#586f73] font-medium flex items-center gap-2">
                <Building2 class="w-3.5 h-3.5 text-zinc-400" />
                <span>{$currentUser.company || "Brightloop Enterprise"}</span>
              </div>
              <div class="text-[11px] text-[#8c9ba5] flex items-center gap-2">
                <Mail class="w-3.5 h-3.5 text-zinc-400" />
                <span>{$currentUser.email}</span>
              </div>
            </div>
          </div>

          <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100 gap-1 text-[11px] text-[#7e9599]">
            <span class="font-medium text-[#122b2e]">Account Status</span>
            <span class="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 class="w-3.5 h-3.5" /> Verified RBAC
            </span>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- 2. Admin Dedicated Staff Operations Shortcut (pointing to /staff-members) -->
    {#if isAdmin}
      <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl hover:border-[#183f42]/40 transition-all">
        <Card.Content class="p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-2xl bg-[#e6f4f2] text-[#183f42] flex items-center justify-center shrink-0 shadow-2xs">
                <Users class="w-6 h-6 text-[#183f42]" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-[#122b2e] text-sm">Staff Operations &amp; Team Management</h3>
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#183f42] text-white">
                    Primary Section
                  </span>
                </div>
                <p class="text-xs text-[#7e9599] mt-1 max-w-xl leading-relaxed">
                  Internal staff provisioning, Gmail SMTP invitation dispatch, and role permissions are centralized under the dedicated <b>Staff</b> navigation menu.
                </p>
              </div>
            </div>

            <Button
              href="/staff-members"
              class="bg-[#183f42] hover:bg-[#123033] text-white text-xs h-9 px-4 rounded-xl font-semibold gap-1.5 shrink-0 shadow-xs"
            >
              <span>Open Staff Directory</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}

    <!-- 3. System & Communication Infrastructure Settings -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Gmail SMTP Server Config -->
      <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl">
        <Card.Header class="pb-3 border-b border-[#f4f7f8]">
          <div class="flex items-center justify-between">
            <Card.Title class="text-xs font-bold text-[#122b2e] uppercase tracking-wider flex items-center gap-1.5">
              <Server class="w-3.5 h-3.5 text-[#183f42]" /> Mailer Infrastructure
            </Card.Title>
            <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Operational
            </span>
          </div>
        </Card.Header>
        <Card.Content class="pt-4 space-y-2.5 text-xs">
          <div class="flex items-center justify-between py-1 border-b border-zinc-100">
            <span class="text-[#7e9599]">SMTP Provider:</span>
            <span class="font-semibold text-[#122b2e]">Google Gmail SMTP</span>
          </div>
          <div class="flex items-center justify-between py-1 border-b border-zinc-100">
            <span class="text-[#7e9599]">Sender Account:</span>
            <span class="font-mono text-[11px] text-[#183f42] font-semibold">donaelsaj04@gmail.com</span>
          </div>
          <div class="flex items-center justify-between py-1 border-b border-zinc-100">
            <span class="text-[#7e9599]">Port &amp; Protocol:</span>
            <span class="font-medium text-[#122b2e]">SSL / Port 465 (Secure)</span>
          </div>
          <div class="flex items-center justify-between pt-1">
            <span class="text-[#7e9599]">Dispatch Mode:</span>
            <span class="text-emerald-700 font-bold flex items-center gap-1">
              <Check class="w-3.5 h-3.5" /> Direct to Staff Inboxes
            </span>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Security & Role Policy Matrix -->
      <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl">
        <Card.Header class="pb-3 border-b border-[#f4f7f8]">
          <div class="flex items-center justify-between">
            <Card.Title class="text-xs font-bold text-[#122b2e] uppercase tracking-wider flex items-center gap-1.5">
              <Shield class="w-3.5 h-3.5 text-[#183f42]" /> RBAC Security Tier
            </Card.Title>
            <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]">
              Tier 1
            </span>
          </div>
        </Card.Header>
        <Card.Content class="pt-4 space-y-2.5 text-xs">
          <div class="flex items-center justify-between py-1 border-b border-zinc-100">
            <span class="text-[#7e9599]">Active Level:</span>
            <span class="font-bold text-[#183f42]">{$currentUser.role}</span>
          </div>
          <div class="flex items-center justify-between py-1 border-b border-zinc-100">
            <span class="text-[#7e9599]">Session Token:</span>
            <span class="font-mono text-[10px] text-zinc-500">JWT HS256 Encrypted</span>
          </div>
          <div class="flex items-center justify-between py-1 border-b border-zinc-100">
            <span class="text-[#7e9599]">Password Policy:</span>
            <span class="text-[#122b2e] font-medium">9+ chars, A-Z, a-z, special</span>
          </div>
          <div class="flex items-center justify-between pt-1">
            <span class="text-[#7e9599]">Workspace Isolation:</span>
            <span class="text-emerald-700 font-bold flex items-center gap-1">
              <Check class="w-3.5 h-3.5" /> Enforced by Route Guards
            </span>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</AppShell>
