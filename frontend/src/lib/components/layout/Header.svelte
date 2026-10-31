<script>
  import { Search, LogOut } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { currentUser, logout } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";

  let { title = "Dashboard" } = $props();

  const isCustomer = $derived(
    page.url.pathname.startsWith('/customers') ||
    page.url.pathname.startsWith('/customer') ||
    page.url.pathname.startsWith('/portal')
  );
  const isStaff = $derived(page.url.pathname.startsWith('/staff'));

  const activePersona = $derived(
    isCustomer
      ? { name: "Apex Global Tech", role: "Customer Account", avatar: "AG" }
      : isStaff
      ? { name: "Marcus Brody", role: "Staff Operations", avatar: "MB" }
      : { name: $currentUser.name, role: $currentUser.role, avatar: $currentUser.avatar }
  );

  function handleSignOut() {
    logout();
    goto("/signin");
  }
</script>

<header class="h-16 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-7 shadow-[0_1px_8px_rgba(0,0,0,0.015)]">
  <div class="flex items-center gap-3">
    <h1 class="text-sm font-bold text-zinc-900 tracking-tight">{title}</h1>
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
