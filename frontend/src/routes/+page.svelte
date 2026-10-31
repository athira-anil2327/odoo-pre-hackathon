<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import Chart from "$lib/components/Chart.svelte";
  import { subscriptionsStore, customersStore } from "$lib/stores/coreManagement.js";
  import {
    BarChart3,
    FileText,
    Plus,
    ChevronDown,
    ArrowUpRight,
    TrendingUp,
    Repeat
  } from "lucide-svelte";

  // Active view toggle between Invoices and Subscriptions
  let activeTab = $state("invoices");

  const activeSubsCount = $derived($subscriptionsStore.filter(s => s.status === "Active").length);

  function getCustomerName(customerId) {
    const c = $customersStore.find(cust => cust.id === customerId);
    return c ? c.company : customerId;
  }

  // Chart datasets matching theme.jpeg (Teal and Coral bars)
  const mrrData = {
    labels: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
    datasets: [
      {
        label: "Direct Billed",
        data: [2500, 6200, 3100, 5100, 3400, 1800],
        backgroundColor: "#2a9d8f"
      },
      {
        label: "Recurring Addons",
        data: [3800, 5500, 1600, 4300, 5700, 2400],
        backgroundColor: "#e76f51"
      }
    ]
  };

  const invoices = [
    {
      id: "INV-2034",
      customer: "John Smith",
      status: "Draft",
      statusClass: "bg-[#4a5568] text-white",
      date: "Sep 15, 2025",
      amount: "$250.00"
    },
    {
      id: "INV-2028",
      customer: "Acme Corp",
      status: "Sent",
      statusClass: "bg-[#2f855a] text-white",
      date: "Sep 14, 2025",
      amount: "$1,800.00"
    },
    {
      id: "INV-2021",
      customer: "Jane Doe",
      status: "Failed",
      statusClass: "bg-[#c53030] text-white",
      date: "Sep 10, 2025",
      amount: "$3,200.00"
    }
  ];

  const subscriptions = [
    {
      id: "SUB-4471",
      customer: "Jane Doe",
      status: "Active",
      statusClass: "bg-[#2f855a] text-white",
      date: "Sep 5, 2025",
      amount: "$1,249.62/mo"
    },
    {
      id: "SUB-4420",
      customer: "Nexus Health Systems",
      status: "Active",
      statusClass: "bg-[#2f855a] text-white",
      date: "Aug 15, 2025",
      amount: "$499.00/mo"
    },
    {
      id: "SUB-4390",
      customer: "Apex Logistics",
      status: "Draft",
      statusClass: "bg-[#4a5568] text-white",
      date: "Aug 01, 2025",
      amount: "$199.00/mo"
    }
  ];

  const activities = [
    {
      title: "Invoice Created",
      time: "2 hours ago",
      desc: "Invoice #INV-2034 created for John Smith",
      status: "Draft",
      statusClass: "bg-[#4a5568] text-white"
    },
    {
      title: "Invoice Sent",
      time: "Sep 7, 4:10 PM",
      desc: "Invoice #INV-2028 sent to Acme Corp",
      status: "Sent",
      statusClass: "bg-[#2f855a] text-white"
    },
    {
      title: "Payment Failed",
      time: "Sep 6, 11:30 AM",
      desc: "Payment attempt for Invoice #INV-2019 failed",
      status: "Failed",
      statusClass: "bg-[#c53030] text-white"
    },
    {
      title: "Subscription Started",
      time: "Sep 5, 9:15 AM",
      desc: "Subscription #SUB-4471 started for Jane Doe",
      status: "Active",
      statusClass: "bg-[#2f855a] text-white"
    }
  ];
</script>

<AppShell title="Dashboard">
  <div class="space-y-6">
    <!-- Top 5 KPI Cards Row matching theme.jpeg -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
      <!-- 1. Total Revenue -->
      <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-center mb-3">
          <BarChart3 class="w-4 h-4 text-white" />
        </div>
        <div class="text-center">
          <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">$125,400</div>
          <div class="text-xs font-medium text-teal-100/90 mt-1">Total Revenue</div>
          <div class="text-[11px] text-teal-200/80 mt-1">+12% vs last month</div>
        </div>
      </div>

      <!-- 2. Outstanding Invoices -->
      <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-center mb-3">
          <BarChart3 class="w-4 h-4 text-white" />
        </div>
        <div class="text-center">
          <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">34</div>
          <div class="text-xs font-medium text-teal-100/90 mt-1">Outstanding Invoices</div>
          <div class="text-[11px] text-teal-200/80 mt-1">+4 vs last week</div>
        </div>
      </div>

      <!-- 3. Active Subscriptions -->
      <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-center mb-3">
          <BarChart3 class="w-4 h-4 text-white" />
        </div>
        <div class="text-center">
          <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">892</div>
          <div class="text-xs font-medium text-teal-100/90 mt-1">Active Subscriptions</div>
          <div class="text-[11px] text-teal-200/80 mt-1">+45 new this month</div>
        </div>
      </div>

      <!-- 4. Past Due Payments -->
      <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-center mb-3">
          <BarChart3 class="w-4 h-4 text-white" />
        </div>
        <div class="text-center">
          <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">$6,200</div>
          <div class="text-xs font-medium text-teal-100/90 mt-1">Past Due Payments</div>
          <div class="text-[11px] text-teal-200/80 mt-1">-5 vs last month</div>
        </div>
      </div>

      <!-- 5. New Customers -->
      <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs col-span-2 md:col-span-1">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-center mb-3">
          <BarChart3 class="w-4 h-4 text-white" />
        </div>
        <div class="text-center">
          <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">124</div>
          <div class="text-xs font-medium text-teal-100/90 mt-1">New Customers</div>
          <div class="text-[11px] text-teal-200/80 mt-1">+20 vs last month</div>
        </div>
      </div>
    </div>

    <!-- Middle Section: Chart & Recent Activity matching theme.jpeg -->
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
        <h3 class="text-sm font-bold text-[#122b2e] pb-3 border-b border-[#f4f7f8]">Recent Activity</h3>

        <div class="divide-y divide-[#f4f7f8] flex-1">
          {#each activities as act}
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

    <!-- Bottom Section: Recent Invoices & Quick Actions matching theme.jpeg -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
      <!-- Recent Invoices Table (~70%) -->
      <div class="lg:col-span-8 bg-white rounded-2xl border border-[#edf2f3] p-5 sm:p-6 shadow-xs">
        <div class="flex items-center justify-between pb-4 border-b border-[#f4f7f8]">
          <h3 class="text-sm font-bold text-[#122b2e]">Recent Invoices</h3>

          <!-- Invoices / Subscriptions Segmented Buttons matching theme.jpeg -->
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
                <th class="py-3 font-medium">Signup Date</th>
                <th class="py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f8fafb]">
              {#if activeTab === "invoices"}
                {#each invoices as inv}
                  <tr class="hover:bg-[#fbfcfc] transition-colors">
                    <td class="py-3.5 font-semibold text-[#122b2e]">{inv.id}</td>
                    <td class="py-3.5 text-[#586f73]">{inv.customer}</td>
                    <td class="py-3.5">
                      <span class={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${inv.statusClass}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td class="py-3.5 text-[#7e9599]">{inv.date}</td>
                    <td class="py-3.5 text-right font-semibold text-[#122b2e]">{inv.amount}</td>
                  </tr>
                {/each}
              {:else}
                {#each $subscriptionsStore as sub}
                  <tr class="hover:bg-[#fbfcfc] transition-colors">
                    <td class="py-3.5 font-semibold text-[#122b2e]">{sub.subscription_number}</td>
                    <td class="py-3.5 text-[#586f73]">{getCustomerName(sub.customer_id)}</td>
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
                    <td class="py-3.5 text-[#7e9599]">{sub.start_date}</td>
                    <td class="py-3.5 text-right font-semibold text-[#122b2e]">${Number(sub.total_amount).toFixed(2)}</td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions (~30%) matching theme.jpeg -->
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
            href="/subscriptions"
            class="w-full bg-[#183f42] hover:bg-[#123033] text-white py-3.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Plus class="w-4 h-4" />
            <span>Create Contract</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</AppShell>
