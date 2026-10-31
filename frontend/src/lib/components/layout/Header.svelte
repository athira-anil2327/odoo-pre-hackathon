<script>
  import { Search, Bell, HelpCircle, Plus, ChevronDown, Shield, FileText, HeartHandshake, Repeat, Package } from "lucide-svelte";
  import { currentUser } from "$lib/stores/auth.js";
  import { page } from "$app/state";

  let { title = "Dashboard" } = $props();

  const isPortal = $derived(page.url.pathname.startsWith('/portal'));
  const isStaff = $derived(page.url.pathname.startsWith('/staff'));
  const isAdmin = $derived(!isPortal && !isStaff);

  let isCreateMenuOpen = $state(false);

  // Reflects the authenticated user from the database
  const activePersona = $derived({
    name: $currentUser?.name || "User",
    role: $currentUser?.role || "Account",
    email: $currentUser?.email || "",
    avatar: ($currentUser?.name || "US").slice(0, 2).toUpperCase()
  });
</script>

<header class="h-20 border-b border-[#f0f4f5] bg-white flex items-center justify-between px-6 sm:px-8 gap-4 select-none">
  <!-- Search Bar with Pill Input matching theme.jpeg -->
  <div class="flex-1 max-w-xl">
    <div class="relative w-full">
      <Search class="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        placeholder="search customers, invoices, subscriptions"
        class="w-full h-11 pl-11 pr-4 text-xs bg-[#f8fafb] border border-[#e5ecee] rounded-full text-[#122b2e] placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#183f42]/20 focus:border-[#183f42] transition-all"
      />
    </div>
  </div>

  <!-- Right Actions -->
  <div class="flex items-center gap-3 sm:gap-4 shrink-0">
    <!-- Active Authenticated Role Badge (Read-only, no role-switching pill) -->
    <div class="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f7f7] text-[11px] font-semibold text-[#183f42] border border-[#dde7e8]">
      <Shield class="w-3 h-3 text-[#183f42]" />
      <span>{activePersona.role}</span>
    </div>

    <!-- Notification Bell -->
    <button
      class="w-9 h-9 rounded-full flex items-center justify-center text-zinc-500 hover:text-[#183f42] hover:bg-[#f6f9fa] transition-colors"
      title="Notifications"
    >
      <Bell class="w-4 h-4" />
    </button>

    <!-- Help Icon -->
    <button
      class="w-9 h-9 rounded-full flex items-center justify-center text-zinc-500 hover:text-[#183f42] hover:bg-[#f6f9fa] transition-colors"
      title="Help & Documentation"
    >
      <HelpCircle class="w-4 h-4" />
    </button>

    <!-- Dark Teal Pill "+ Create" Button matching theme.jpeg -->
    {#if !isPortal}
      <div class="relative">
        <button
          onclick={() => (isCreateMenuOpen = !isCreateMenuOpen)}
          class="inline-flex items-center gap-1.5 bg-[#183f42] hover:bg-[#112f31] text-white text-xs font-semibold px-4 sm:px-5 py-2.5 rounded-full shadow-xs transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>Create</span>
        </button>

        {#if isCreateMenuOpen}
          <div class="absolute right-0 mt-2 w-48 bg-white border border-[#edf2f3] rounded-2xl shadow-xl py-2 z-50 text-xs">
            <a
              href="/invoices"
              onclick={() => (isCreateMenuOpen = false)}
              class="flex items-center gap-2.5 px-4 py-2 text-[#586f73] hover:text-[#122b2e] hover:bg-[#f8fafb]"
            >
              <FileText class="w-3.5 h-3.5 text-[#183f42]" />
              <span>Create Invoice</span>
            </a>
            <a
              href="/quotations"
              onclick={() => (isCreateMenuOpen = false)}
              class="flex items-center gap-2.5 px-4 py-2 text-[#586f73] hover:text-[#122b2e] hover:bg-[#f8fafb]"
            >
              <HeartHandshake class="w-3.5 h-3.5 text-[#183f42]" />
              <span>Create Quote</span>
            </a>
            <a
              href="/subscriptions"
              onclick={() => (isCreateMenuOpen = false)}
              class="flex items-center gap-2.5 px-4 py-2 text-[#586f73] hover:text-[#122b2e] hover:bg-[#f8fafb]"
            >
              <Repeat class="w-3.5 h-3.5 text-[#183f42]" />
              <span>Create Subscription</span>
            </a>
            <a
              href="/products"
              onclick={() => (isCreateMenuOpen = false)}
              class="flex items-center gap-2.5 px-4 py-2 text-[#586f73] hover:text-[#122b2e] hover:bg-[#f8fafb]"
            >
              <Package class="w-3.5 h-3.5 text-[#183f42]" />
              <span>Create Product</span>
            </a>
          </div>
        {/if}
      </div>
    {/if}

    <!-- User Profile Dropdown matching theme.jpeg -->
    <a
      href="/profile"
      class="flex items-center gap-2 pl-1 py-1 hover:opacity-90 transition-opacity"
    >
      <span class="hidden sm:inline text-xs font-semibold text-[#122b2e]">
        {activePersona.name}
      </span>
      <ChevronDown class="hidden sm:inline w-3.5 h-3.5 text-zinc-400" />
      <div class="w-9 h-9 rounded-full bg-[#183f42] text-white font-bold text-xs flex items-center justify-center ring-2 ring-[#e6f4f2] shadow-xs">
        {activePersona.avatar}
      </div>
    </a>
  </div>
</header>
