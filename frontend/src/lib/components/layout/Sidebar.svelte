<script>
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { currentUser, logout } from "$lib/stores/auth.js";
  import {
    LayoutDashboard,
    Users,
    Package,
    FileText,
    Repeat,
    Receipt,
    UserCheck,
    LogOut,
    Sparkles
  } from "lucide-svelte";
  import { Separator } from "$lib/components/ui/separator/index.js";

  const navItems = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Products & Plans", href: "/products", icon: Package },
    { label: "Quotations", href: "/quotations", icon: FileText },
    { label: "Subscriptions", href: "/subscriptions", icon: Repeat },
    { label: "Invoices & Billing", href: "/invoices", icon: Receipt },
    { label: "Profile & Account", href: "/profile", icon: UserCheck }
  ];

  const currentPath = $derived(page.url.pathname);

  function handleLogout() {
    logout();
    goto("/signin");
  }
</script>

<aside class="w-64 bg-white/90 backdrop-blur-md border-r border-zinc-200/80 h-screen sticky top-0 flex flex-col justify-between shrink-0 select-none shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
  <div>
    <!-- Brand with Gradient Accent -->
    <div class="h-16 border-b border-zinc-100 flex items-center px-5 gap-3">
      <div class="w-9 h-9 rounded-xl gradient-magenta flex items-center justify-center text-white font-bold text-sm glow-magenta-xs shadow-sm">
        <Sparkles class="w-4 h-4 text-white" />
      </div>
      <div>
        <div class="font-bold text-sm tracking-tight text-zinc-900 leading-none flex items-center gap-1.5">
          <span>Brightloop</span>
          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/60 uppercase">PRO</span>
        </div>
        <div class="text-[10px] text-zinc-400 font-medium tracking-wider uppercase mt-1">Software Platform</div>
      </div>
    </div>

    <!-- Navigation List -->
    <div class="p-3.5 space-y-1">
      <div class="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        Workspace
      </div>
      {#each navItems as item}
        {@const active = currentPath === item.href}
        {@const Icon = item.icon}
        <a
          href={item.href}
          class={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
            active
              ? "gradient-magenta text-white font-semibold glow-magenta-xs shadow-sm"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
          }`}
        >
          <Icon class={`w-4 h-4 ${active ? 'text-white' : 'text-zinc-400'}`} />
          <span>{item.label}</span>
        </a>
      {/each}
    </div>
  </div>

  <!-- Bottom Account Card & Sign Out -->
  <div class="p-4 border-t border-zinc-100 bg-gradient-to-b from-white to-zinc-50/70 space-y-2.5">
    <a
      href="/profile"
      class="flex items-center gap-3 p-2 rounded-xl bg-white border border-zinc-200/80 shadow-xs hover:border-fuchsia-300 transition-all group"
      title="View Profile Details"
    >
      <div class="w-8 h-8 rounded-lg gradient-magenta text-white flex items-center justify-center text-xs font-bold shrink-0">
        {$currentUser.avatar}
      </div>
      <div class="truncate flex-1 min-w-0">
        <div class="text-xs font-semibold text-zinc-900 truncate group-hover:text-fuchsia-600 transition-colors">
          {$currentUser.name}
        </div>
        <div class="text-[10px] text-zinc-400 truncate">
          {$currentUser.company}
        </div>
      </div>
    </a>

    <button
      onclick={handleLogout}
      class="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-rose-600 hover:bg-rose-50 border border-zinc-200/70 hover:border-rose-200 rounded-lg transition-all"
    >
      <LogOut class="w-3.5 h-3.5" /> Sign Out
    </button>
  </div>
</aside>
