<script>
  import { Search, LogOut, Bell, Sparkles, Shield, Briefcase, UserCircle } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { currentUser, logout } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";

  let { title = "Dashboard" } = $props();

  const isPortal = $derived(page.url.pathname.startsWith('/portal') || page.url.pathname.startsWith('/customer'));
  const isStaff = $derived(page.url.pathname.startsWith('/staff'));
  const isAdmin = $derived(!isPortal && !isStaff);

  const activePersona = $derived(
    isPortal
      ? { name: "Apex Global Tech", role: "Client Portal", avatar: "AG" }
      : isStaff
      ? { name: "Marcus Brody", role: "Sales & Operations", avatar: "MB" }
      : { name: $currentUser.name, role: $currentUser.role, avatar: $currentUser.avatar }
  );

  function handleSignOut() {
    logout();
    goto("/signin");
  }
</script>

<header class="h-16 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-7 shadow-[0_1px_8px_rgba(0,0,0,0.015)]">
  <div class="flex items-center gap-4">
    <h1 class="text-sm font-bold text-zinc-900 tracking-tight">{title}</h1>

    <!-- Dedicated URL Workspace Switcher -->
    <div class="hidden md:flex items-center p-0.5 bg-zinc-100/80 border border-zinc-200/70 rounded-xl text-xs font-medium">
      <a
        href="/"
        class={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
          isAdmin
            ? "bg-white text-zinc-900 font-semibold shadow-xs border border-zinc-200/60"
            : "text-zinc-500 hover:text-zinc-800"
        }`}
        title="Admin Workspace (/)"
      >
        <Shield class="w-3 h-3 text-fuchsia-600" />
        <span>Admin</span>
      </a>

      <a
        href="/staff"
        class={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
          isStaff
            ? "bg-white text-zinc-900 font-semibold shadow-xs border border-zinc-200/60"
            : "text-zinc-500 hover:text-zinc-800"
        }`}
        title="Staff & Operations Workspace (/staff)"
      >
        <Briefcase class="w-3 h-3 text-blue-600" />
        <span>Staff</span>
      </a>

      <a
        href="/portal"
        class={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
          isPortal
            ? "bg-white text-zinc-900 font-semibold shadow-xs border border-zinc-200/60"
            : "text-zinc-500 hover:text-zinc-800"
        }`}
        title="Customer Self-Service Portal (/portal)"
      >
        <UserCircle class="w-3 h-3 text-fuchsia-600" />
        <span>Customer Portal</span>
      </a>
    </div>
  </div>

  <div class="flex items-center gap-3.5">
    <!-- Search Bar with Magenta Focus Ring -->
    <div class="relative w-44 sm:w-64">
      <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
      <Input
        type="text"
        placeholder="Search records..."
        class="h-9 pl-9 pr-3 text-xs bg-zinc-50/80 border-zinc-200 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100 rounded-xl transition-all"
      />
    </div>

    <!-- User Profile Header Summary -->
    <a
      href="/profile"
      class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-zinc-50 border border-zinc-200/80 transition-all group"
      title="View Account Profile"
    >
      <div class="w-7 h-7 rounded-lg gradient-magenta text-white flex items-center justify-center text-[11px] font-bold shadow-xs">
        {activePersona.avatar}
      </div>
      <div class="hidden sm:block text-left">
        <div class="text-xs font-semibold text-zinc-900 leading-tight group-hover:text-fuchsia-600 transition-colors">
          {activePersona.name}
        </div>
        <div class="text-[10px] text-zinc-400 leading-tight">{activePersona.role}</div>
      </div>
    </a>

    <!-- Sign Out button -->
    <Button
      variant="ghost"
      size="xs"
      onclick={handleSignOut}
      class="h-8 w-8 p-0 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
      title="Sign Out"
    >
      <LogOut class="w-4 h-4" />
    </Button>
  </div>
</header>
