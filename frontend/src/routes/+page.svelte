<script>
  import { onMount } from "svelte";
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import Chart from "$lib/components/Chart.svelte";
  import {
    subscriptionsStore,
    customersStore,
    quotationsStore,
    syncWithBackend
  } from "$lib/stores/coreManagement.js";
  import {
    invoicesStore,
    paymentsStore,
    kpisStore,
    syncInvoicesWithBackend
  } from "$lib/stores/invoices.js";
  import { authApi } from "$lib/api.js";
  import { browser } from "$app/environment";
  import {
    BarChart3,
    FileText,
    Plus,
    ChevronDown,
    ArrowUpRight,
    TrendingUp,
    Repeat,
    Users,
    Receipt,
    CreditCard,
    CheckCircle2,
    Clock,
    Sparkles
  } from "lucide-svelte";

  // Active view toggle between Invoices and Subscriptions
  let activeTab = $state("invoices");
  let staffCount = $state(7);

  function formatINR(val) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(Number(val) || 0);
  }

  const activeSubsCount = $derived(
    ($subscriptionsStore || []).filter(s => s.status === "Active" || s.status === "Confirmed").length
  );

  function getCustomerName(customerId, fallback = "") {
    if (!customerId) return fallback || "Customer";
    const c = ($customersStore || []).find(cust => cust.id === customerId || cust.customer_number === customerId);
    return c ? (c.company || c.name) : fallback || customerId;
  }

  const statusStyles = {
    draft: "bg-[#4a5568] text-white",
    Draft: "bg-[#4a5568] text-white",
    sent: "bg-blue-50 text-blue-700 border border-blue-200",
    Sent: "bg-blue-50 text-blue-700 border border-blue-200",
    confirmed: "bg-[#183f42] text-white",
    Confirmed: "bg-[#183f42] text-white",
    active: "bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]",
    Active: "bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]",
    paid: "bg-[#2f855a] text-white",
    Paid: "bg-[#2f855a] text-white",
    settled: "bg-[#2f855a] text-white",
    Settled: "bg-[#2f855a] text-white",
    partially_paid: "bg-amber-100 text-amber-900 border border-amber-300",
    "Partially Paid": "bg-amber-100 text-amber-900 border border-amber-300",
    overdue: "bg-rose-600 text-white",
    Overdue: "bg-rose-600 text-white",
    failed: "bg-[#c53030] text-white",
    Failed: "bg-[#c53030] text-white"
  };

  // Live recent slices
  const recentInvoices = $derived(($invoicesStore || []).slice(0, 5));
  const recentSubscriptions = $derived(($subscriptionsStore || []).slice(0, 5));

  // Live dynamic activity feed combined from invoices, payments, and subscriptions
  const recentActivities = $derived.by(() => {
    const list = [];

    // From Invoices
    ($invoicesStore || []).slice(0, 4).forEach((inv) => {
      const isPaid = inv.status === "paid";
      list.push({
        title: isPaid ? "Invoice Settled" : "Invoice Issued",
        time: inv.invoice_date || "Recent",
        desc: `Invoice #${inv.invoice_number} created for ${inv.customer_name || 'Customer'}`,
        status: inv.status ? (inv.status.charAt(0).toUpperCase() + inv.status.slice(1)) : "Issued",
        statusClass: statusStyles[inv.status] || "bg-[#183f42] text-white"
      });
    });

    // From Payments
    ($paymentsStore || []).slice(0, 3).forEach((p) => {
      list.push({
        title: "Payment Received",
        time: p.payment_date || "Recent",
        desc: `Payment of ${formatINR(p.amount)} settled via ${p.payment_method ? p.payment_method.replace('_', ' ') : 'bank transfer'}`,
        status: "Settled",
        statusClass: "bg-[#2f855a] text-white"
      });
    });

    // From Subscriptions
    ($subscriptionsStore || []).slice(0, 3).forEach((sub) => {
      list.push({
        title: "Subscription Active",
        time: sub.start_date || "Recent",
        desc: `Subscription #${sub.subscription_number} (${sub.plan_name || 'Core'}) active`,
        status: sub.status || "Active",
        statusClass: statusStyles[sub.status] || "bg-[#e6f4f2] text-[#143e42]"
      });
    });

    return list.slice(0, 4);
  });

  // Chart datasets matching theme (Teal and Coral bars)
  const mrrData = {
    labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    datasets: [
      {
        label: "Direct Billed",
        data: [2500, 4200, 3100, 5100, 4800, 6200],
        backgroundColor: "#2a9d8f"
      },
      {
        label: "Recurring Addons",
        data: [1800, 2500, 1600, 3300, 3700, 4400],
        backgroundColor: "#e76f51"
      }
    ]
  };

  onMount(() => {
    if (browser) {
      syncWithBackend();
      syncInvoicesWithBackend();
      authApi.getUsers().then(res => {
        if (res.success && Array.isArray(res.data)) {
          const count = res.data.filter(u => u.role === "staff").length;
          if (count > 0) staffCount = count;
        }
      }).catch(() => {});
    }
  });
</script>

<AppShell title="Dashboard">
  <div class="space-y-6">
    <!-- Top 5 KPI Cards Row with Live Data -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
      <!-- 1. Total Revenue / Total Invoiced -->
      <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-center mb-3">
          <BarChart3 class="w-4 h-4 text-white" />
        </div>
        <div class="text-center">
          <div class="text-lg sm:text-2xl font-bold tracking-tight text-white">{formatINR($kpisStore.totalInvoiced)}</div>
          <div class="text-xs font-medium text-teal-100/90 mt-1">Total Invoiced</div>
          <div class="text-[11px] text-teal-200/80 mt-1">{$kpisStore.totalCount} total billing cycles</div>
        </div>
      </div>

      <!-- 2. Outstanding Invoices -->
      <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-center mb-3">
          <FileText class="w-4 h-4 text-white" />
        </div>
        <div class="text-center">
          <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">{$kpisStore.pendingCount || 0}</div>
          <div class="text-xs font-medium text-teal-100/90 mt-1">Outstanding Invoices</div>
          <div class="text-[11px] text-teal-200/80 mt-1">{formatINR($kpisStore.outstanding)} pending</div>
        </div>
      </div>

      <!-- 3. Active Subscriptions -->
      <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-center mb-3">
          <Repeat class="w-4 h-4 text-white" />
        </div>
        <div class="text-center">
          <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">{activeSubsCount}</div>
          <div class="text-xs font-medium text-teal-100/90 mt-1">Active Subscriptions</div>
          <div class="text-[11px] text-teal-200/80 mt-1">+{$subscriptionsStore.length} total in registry</div>
        </div>
      </div>

      <!-- 4. Past Due Payments -->
      <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-center mb-3">
          <Clock class="w-4 h-4 text-white" />
        </div>
        <div class="text-center">
          <div class="text-lg sm:text-2xl font-bold tracking-tight text-white">{formatINR($kpisStore.overdue)}</div>
          <div class="text-xs font-medium text-teal-100/90 mt-1">Past Due Payments</div>
          <div class="text-[11px] text-teal-200/80 mt-1">{$kpisStore.overdueCount} require follow-up</div>
        </div>
      </div>

      <!-- 5. Staff Operations -->
      <a href="/staff-members" class="bg-[#183f42] hover:bg-[#123033] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs col-span-2 md:col-span-1 transition-all group">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-center mb-3 group-hover:scale-105 transition-transform">
          <Users class="w-4 h-4 text-white" />
        </div>
        <div class="text-center">
          <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">{staffCount} Staff</div>
          <div class="text-xs font-medium text-teal-100/90 mt-1">Staff Operations</div>
          <div class="text-[11px] text-teal-200/80 mt-1">Manage Logins &rarr;</div>
        </div>
      </a>
    </div>

    <!-- Middle Section: Chart & Live Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
      <!-- Monthly Recurring Revenue Chart (~65%) -->
      <div class="lg:col-span-8 bg-white rounded-2xl border border-[#edf2f3] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div class="flex items-start justify-between pb-4 border-b border-[#f4f7f8]">
          <div>
            <h3 class="text-sm font-bold text-[#122b2e]">Monthly Recurring Revenue</h3>
            <p class="text-xs text-[#7e9599] mt-0.5">Revenue growth over the past 6 months</p>
          </div>

          <!-- Timeframe Dropdown -->
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#586f73] border border-[#e2eaeb] rounded-lg bg-white hover:bg-[#f8fafb] transition-colors">
            <span>Last 6-months</span>
            <ChevronDown class="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>

        <div class="pt-5">
          <Chart type="bar" data={mrrData} height={250} />
        </div>
      </div>

      <!-- Recent Activity Feed (~35%) -->
      <div class="lg:col-span-4 bg-white rounded-2xl border border-[#edf2f3] p-5 sm:p-6 shadow-xs flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-[#f4f7f8]">
          <h3 class="text-sm font-bold text-[#122b2e]">Recent Activity</h3>
          <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
          </span>
        </div>

        <div class="divide-y divide-[#f4f7f8] flex-1">
          {#if recentActivities.length === 0}
            <div class="py-8 text-center text-[#7e9599] text-xs">No recent activity recorded yet.</div>
          {/if}
          {#each recentActivities as act}
            <div class="py-3 flex items-start gap-3">
              <div class="w-7 h-7 rounded-lg border border-[#e2eaeb] bg-[#f8fafb] flex items-center justify-center shrink-0 mt-0.5">
                <FileText class="w-3.5 h-3.5 text-[#586f73]" />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-[#122b2e]">{act.title}</span>
                  <span class="text-[10px] text-[#8c9ba5]">{act.time}</span>
                </div>
                <p class="text-[11px] text-[#586f73] truncate mt-0.5">{act.desc}</p>
              </div>

              <span class={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${act.statusClass}`}>
                {act.status}
              </span>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Bottom Section: Live Recent Invoices & Subscriptions Table -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
      <!-- Recent Invoices Table (~70%) -->
      <div class="lg:col-span-8 bg-white rounded-2xl border border-[#edf2f3] p-5 sm:p-6 shadow-xs">
        <div class="flex items-center justify-between pb-4 border-b border-[#f4f7f8]">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-bold text-[#122b2e]">
              {activeTab === "invoices" ? "Recent Invoices" : "Recent Subscriptions"}
            </h3>
            <span class="text-[11px] text-[#8c9ba5]">
              (Showing latest {activeTab === "invoices" ? recentInvoices.length : recentSubscriptions.length})
            </span>
          </div>

          <!-- Invoices / Subscriptions Segmented Buttons -->
          <div class="flex items-center bg-[#f4f7f8] p-1 rounded-xl">
            <button
              onclick={() => activeTab = "invoices"}
              class={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "invoices"
                  ? "bg-[#183f42] text-white shadow-xs"
                  : "text-[#586f73] hover:text-[#122b2e]"
              }`}
            >
              Invoices
            </button>
            <button
              onclick={() => activeTab = "subscriptions"}
              class={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "subscriptions"
                  ? "bg-[#183f42] text-white shadow-xs"
                  : "text-[#586f73] hover:text-[#122b2e]"
              }`}
            >
              Subscriptions
            </button>
          </div>
        </div>

        <!-- Table View -->
        <div class="overflow-x-auto mt-2">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-[#8c9ba5] border-b border-[#f4f7f8]">
                <th class="py-3 font-medium">{activeTab === "invoices" ? "Invoice #" : "Subscription #"}</th>
                <th class="py-3 font-medium">Customer</th>
                <th class="py-3 font-medium">Status</th>
                <th class="py-3 font-medium">{activeTab === "invoices" ? "Issue Date" : "Start Date"}</th>
                <th class="py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f8fafb]">
              {#if activeTab === "invoices"}
                {#if recentInvoices.length === 0}
                  <tr>
                    <td colspan="5" class="py-6 text-center text-[#7e9599]">No invoices recorded yet.</td>
                  </tr>
                {/if}
                {#each recentInvoices as inv}
                  {@const status = inv.status || 'draft'}
                  <tr class="hover:bg-[#fbfcfc] transition-colors">
                    <td class="py-3.5 font-semibold text-[#122b2e]">
                      <a href="/invoices" class="hover:underline">{inv.invoice_number}</a>
                    </td>
                    <td class="py-3.5 text-[#586f73] font-medium">{inv.customer_name || getCustomerName(inv.customer_id)}</td>
                    <td class="py-3.5">
                      <span class={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusStyles[status] || 'bg-zinc-100 text-zinc-700'}`}>
                        {status.replace('_', ' ')}
                      </span>
                    </td>
                    <td class="py-3.5 text-[#7e9599]">{inv.invoice_date || inv.billing_period_start || '—'}</td>
                    <td class="py-3.5 text-right font-semibold text-[#122b2e]">{formatINR(inv.total_amount)}</td>
                  </tr>
                {/each}
              {:else}
                {#if recentSubscriptions.length === 0}
                  <tr>
                    <td colspan="5" class="py-6 text-center text-[#7e9599]">No subscriptions recorded yet.</td>
                  </tr>
                {/if}
                {#each recentSubscriptions as sub}
                  <tr class="hover:bg-[#fbfcfc] transition-colors">
                    <td class="py-3.5 font-semibold text-[#122b2e]">
                      <a href="/subscriptions" class="hover:underline">{sub.subscription_number}</a>
                    </td>
                    <td class="py-3.5 text-[#586f73] font-medium">{getCustomerName(sub.customer_id, sub.customer_name)}</td>
                    <td class="py-3.5">
                      <span class={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                        sub.status === 'Active'
                          ? 'bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]'
                          : sub.status === 'Confirmed'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : sub.status === 'Paused'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td class="py-3.5 text-[#7e9599]">{sub.start_date || '—'}</td>
                    <td class="py-3.5 text-right font-semibold text-[#122b2e]">{formatINR(sub.total_amount)} / {sub.billing_frequency || 'mo'}</td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions (~30%) matching theme -->
      <div class="lg:col-span-4 bg-white rounded-2xl border border-[#edf2f3] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <h3 class="text-sm font-bold text-[#122b2e] mb-4">Quick Actions</h3>

        <div class="flex-1 flex flex-col justify-between gap-3">
          <a
            href="/invoices"
            class="w-full bg-[#183f42] hover:bg-[#123033] text-white py-3.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Plus class="w-4 h-4" />
            <span>Create Invoice</span>
          </a>

          <a
            href="/quotations"
            class="w-full bg-[#183f42] hover:bg-[#123033] text-white py-3.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Plus class="w-4 h-4" />
            <span>Create Quote</span>
          </a>

          <a
            href="/subscriptions"
            class="w-full bg-[#183f42] hover:bg-[#123033] text-white py-3.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Plus class="w-4 h-4" />
            <span>Create Subscription</span>
          </a>

          <a
            href="/staff-members"
            class="w-full bg-[#183f42] hover:bg-[#123033] text-white py-3.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Users class="w-4 h-4" />
            <span>Provision Staff</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</AppShell>
