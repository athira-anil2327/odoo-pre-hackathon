<script>
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { currentUser, logout } from "$lib/stores/auth.js";
  import {
    LayoutDashboard,
    FileText,
    HeartHandshake,
    Repeat,
    Gauge,
    CalendarClock,
    ScrollText,
    RotateCcw,
    Settings,
    LogOut,
    ChevronRight,
    ChevronDown,
    Users,
    Package,
    Receipt,
    UserCheck,
    CreditCard,
    Briefcase,
    Shield,
    UserCircle
  } from "lucide-svelte";

  const isPortal = $derived(page.url.pathname.startsWith('/portal') || page.url.pathname.startsWith('/customer'));
  const isStaff = $derived(page.url.pathname.startsWith('/staff'));

  const navItems = $derived(
    isPortal
      ? [
          { label: "Overview", href: "/portal", icon: LayoutDashboard, hasArrow: true },
          { label: "My Subscriptions", href: "/portal/subscriptions", icon: Repeat, hasArrow: true },
          { label: "Invoices & Receipts", href: "/portal/invoices", icon: Receipt, hasArrow: true },
          { label: "Payment Methods", href: "/portal/payment-methods", icon: CreditCard, hasArrow: false },
          { label: "Account Profile", href: "/profile", icon: UserCheck, hasArrow: false }
        ]
      : isStaff
      ? [
          { label: "Staff Dashboard", href: "/staff", icon: LayoutDashboard, hasArrow: true },
          { label: "Customers", href: "/staff/customers", icon: Users, hasArrow: true },
          { label: "Quotations", href: "/staff/quotations", icon: FileText, hasArrow: true },
          { label: "Invoices", href: "/staff/invoices", icon: Receipt, hasArrow: true },
          { label: "Subscriptions", href: "/subscriptions", icon: Repeat, hasArrow: true },
          { label: "My Profile", href: "/profile", icon: UserCheck, hasArrow: false }
        ]
      : [
          { label: "Dashboard", href: "/", icon: LayoutDashboard, hasArrow: true },
          { label: "Invoices", href: "/invoices", icon: FileText, hasArrow: true },
          { label: "Quotes", href: "/quotations", icon: HeartHandshake, hasArrow: true },
          { label: "Subscriptions", href: "/subscriptions", icon: Repeat, hasArrow: true },
          { label: "Usage & Meters", href: "/products", icon: Gauge, hasArrow: true },
          { label: "Billing Schedules", href: "/invoices", icon: CalendarClock, hasArrow: false },
          { label: "Contracts", href: "/subscriptions", icon: ScrollText, hasArrow: false },
          { label: "Revenue Recovery", href: "/customers", icon: RotateCcw, hasArrow: false },
          { label: "Settings", href: "/profile", icon: Settings, hasArrow: false }
        ]
  );

  const persona = $derived(
    isPortal
      ? {
          name: "Apex Global Tech",
          role: "Customer Portal",
          email: "billing@apextech.io",
          avatar: "AG",
          workspaceBadge: "Portal"
        }
      : isStaff
      ? {
          name: "Marcus Brody",
          role: "Sales & Operations",
          email: "marcus.b@brightloop.io",
          avatar: "MB",
          workspaceBadge: "Staff"
        }
      : {
          name: $currentUser?.name || "Dr. Eleanor Vance",
          role: $currentUser?.role || "Enterprise Administrator",
          email: $currentUser?.email || "eleanor.vance@nexushealth.org",
          avatar: $currentUser?.avatar || "EV",
          workspaceBadge: "Brand Standard"
        }
  );

  const currentPath = $derived(page.url.pathname);

  function handleLogout() {
    logout();
    goto("/signin");
  }
</script>

<aside class="w-full md:w-60 lg:w-64 bg-white border-r border-[#eef2f3] flex flex-col justify-between shrink-0 select-none md:min-h-screen md:sticky md:top-0 md:h-screen">
  <div>
    <!-- Logo & Brand Dropdown matching theme.jpeg -->
    <div class="h-20 px-6 flex items-center border-b border-[#f0f4f5]">
      <a href="/" class="flex items-center gap-3 w-full group">
        <!-- Circular/Lines geometric logo -->
        <div class="w-10 h-10 rounded-xl bg-[#183f42] text-white flex items-center justify-center shadow-xs shrink-0">
          <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-dasharray="2 3" />
            <path d="M7 12h10" />
            <path d="M9 8h6" />
            <path d="M9 16h6" />
          </svg>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm tracking-tight text-[#122b2e]">Brightloop</span>
            <ChevronDown class="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
          </div>
          <span class="text-[11px] text-[#789094] block truncate">
            {persona.workspaceBadge}
          </span>
        </div>
      </a>
    </div>

    <!-- Navigation List matching theme.jpeg -->
    <nav class="p-4 space-y-1">
      {#each navItems as item}
        {@const active = currentPath === item.href}
        {@const Icon = item.icon}
        <a
          href={item.href}
          class={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 ${
            active
              ? "bg-[#e6f4f2] text-[#143e42] font-semibold"
              : "text-[#586f73] hover:text-[#122b2e] hover:bg-[#f6f9fa] font-medium"
          }`}
        >
          <div class="flex items-center gap-3">
            <Icon class={`w-4 h-4 ${active ? 'text-[#143e42]' : 'text-[#7e9599]'}`} />
            <span>{item.label}</span>
          </div>
          {#if item.hasArrow}
            <ChevronRight class={`w-3.5 h-3.5 ${active ? 'text-[#143e42]' : 'text-zinc-300'}`} />
          {/if}
        </a>
      {/each}
    </nav>
  </div>

  <!-- Bottom Area: Logout & Profile -->
  <div class="p-4 border-t border-[#f0f4f5] space-y-3">
    <!-- Logout Button -->
    <button
      onclick={handleLogout}
      class="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#586f73] hover:text-rose-600 hover:bg-rose-50/70 rounded-xl transition-all"
    >
      <LogOut class="w-4 h-4 text-[#7e9599] group-hover:text-rose-600" />
      <span>Logout</span>
    </button>
  </div>
</aside>
