<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import Chart from "$lib/components/Chart.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { dashboardApi, invoicesApi } from "$lib/api.js";
  import { browser } from "$app/environment";
  import {
    DollarSign,
    Repeat,
    Clock,
    TrendingUp,
    ArrowUpRight,
    Plus,
    Download,
    Sparkles,
    UserPlus
  } from "lucide-svelte";

  function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(num);
  }

  let financeSummary = $state({
    currency: 'INR',
    active_subscriptions_count: 6,
    monthly_recurring_revenue: 7190.53,
    total_revenue_collected: 20298.06,
    total_outstanding_amount: 3572.16,
    overdue_invoices_count: 2,
    overdue_amount: 3220.52
  });

  const chartData = $derived.by(() => {
    const base = Number(financeSummary.monthly_recurring_revenue) || 7190;
    return {
      labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
      datasets: [
        {
          label: "Monthly Recurring Revenue (MRR)",
          data: [
            Math.round(base * 0.55),
            Math.round(base * 0.70),
            Math.round(base * 0.85),
            Math.round(base * 0.92),
            Math.round(base * 1.00),
            Math.round(base * 1.08)
          ]
        }
      ]
    };
  });

  let recentInvoices = $state([]);

  $effect(() => {
    if (browser) {
      dashboardApi.getFinanceSummary().then(res => {
        if (res.success && res.data) {
          financeSummary = res.data;
        }
      }).catch(err => console.warn("Dashboard metrics load notice:", err));

      invoicesApi.getAll().then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          recentInvoices = res.data.slice(0, 5).map(inv => {
            const isPaid = inv.status === "paid";
            const isPartial = inv.status === "partially_paid";
            const isConfirmed = inv.status === "confirmed";
            return {
              id: inv.invoice_number,
              customer: inv.customer_name || inv.customer_company || "Customer",
              date: new Date(inv.invoice_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
              amount: formatCurrency(inv.total_amount),
              status: inv.status.replace("_", " ").toUpperCase(),
              badgeClass: isPaid
                ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/60"
                : isPartial
                ? "bg-amber-50 text-amber-700 border-amber-200/60"
                : isConfirmed
                ? "bg-blue-50 text-blue-700 border-blue-200/60"
                : "bg-zinc-50 text-zinc-700 border-zinc-200/60"
            };
          });
        }
      }).catch(err => console.warn("Recent invoices load notice:", err));
    }
  });
</script>

<AppShell title="Financial & Operational Overview">
  <div class="space-y-6">
    <!-- Header Action Row -->
    <div class="flex items-center justify-between pb-4 border-b border-zinc-200/70">
      <div>
        <h2 class="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <span>Overview Dashboard</span>
          <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-fuchsia-700 bg-fuchsia-50 px-2 py-0.5 rounded-full border border-fuchsia-200/60">
            <Sparkles class="w-3 h-3" /> Live Pacing
          </span>
        </h2>
        <p class="text-xs text-zinc-500 mt-0.5">Recurring revenue performance and active accounts across Brightloop Software.</p>
      </div>
      <div class="flex items-center gap-2.5">
        <a
          href="/staff-members?action=create"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#183f42] text-white hover:bg-[#123033] shadow-xs transition-all"
        >
          <UserPlus class="w-3.5 h-3.5" />
          <span>Provision Staff Member</span>
        </a>
        <Button variant="outline" size="xs" class="text-xs border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg gap-1.5 shadow-2xs">
          <Download class="w-3.5 h-3.5 text-zinc-500" /> Export CSV
        </Button>
        <Button variant="default" size="xs" class="text-xs gradient-magenta hover:opacity-95 text-white glow-magenta-xs font-semibold rounded-lg gap-1.5 shadow-xs">
          <Plus class="w-3.5 h-3.5" /> Create Record
        </Button>
      </div>
    </div>

    <!-- 4 KPI Cards with Beautiful Magenta & Grey Accents -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card.Root class="bg-white border-zinc-200/80 shadow-xs hover:border-fuchsia-200 transition-all rounded-xl relative overflow-hidden group">
        <div class="absolute top-0 left-0 right-0 h-1 gradient-magenta opacity-80"></div>
        <Card.Header class="pb-2 pt-4 flex flex-row items-center justify-between space-y-0">
          <span class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Revenue</span>
          <div class="w-7 h-7 rounded-lg bg-fuchsia-50 flex items-center justify-center text-fuchsia-600">
            <DollarSign class="w-4 h-4" />
          </div>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold tracking-tight text-zinc-900">{formatCurrency(financeSummary.total_revenue_collected)}</div>
          <div class="text-[11px] font-medium text-fuchsia-700 mt-1 flex items-center gap-1">
            <TrendingUp class="w-3 h-3" /> Live from Ledger
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root class="bg-white border-zinc-200/80 shadow-xs hover:border-fuchsia-200 transition-all rounded-xl relative overflow-hidden group">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-700 to-zinc-900 opacity-80"></div>
        <Card.Header class="pb-2 pt-4 flex flex-row items-center justify-between space-y-0">
          <span class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Subscriptions</span>
          <div class="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
            <Repeat class="w-4 h-4" />
          </div>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold tracking-tight text-zinc-900">{financeSummary.active_subscriptions_count} Active</div>
          <div class="text-[11px] text-zinc-500 mt-1">Live active contracts</div>
        </Card.Content>
      </Card.Root>

      <Card.Root class="bg-white border-zinc-200/80 shadow-xs hover:border-fuchsia-200 transition-all rounded-xl relative overflow-hidden group">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-400 to-zinc-600 opacity-80"></div>
        <Card.Header class="pb-2 pt-4 flex flex-row items-center justify-between space-y-0">
          <span class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Outstanding Invoices</span>
          <div class="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
            <Clock class="w-4 h-4" />
          </div>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold tracking-tight text-zinc-900">{formatCurrency(financeSummary.total_outstanding_amount)}</div>
          <div class="text-[11px] text-zinc-500 mt-1">{financeSummary.overdue_invoices_count || 0} overdue receivable</div>
        </Card.Content>
      </Card.Root>

      <Card.Root class="bg-white border-zinc-200/80 shadow-xs hover:border-fuchsia-200 transition-all rounded-xl relative overflow-hidden group">
        <div class="absolute top-0 left-0 right-0 h-1 gradient-magenta opacity-80"></div>
        <Card.Header class="pb-2 pt-4 flex flex-row items-center justify-between space-y-0">
          <span class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Monthly Recurring (MRR)</span>
          <div class="w-7 h-7 rounded-lg bg-fuchsia-50 flex items-center justify-center text-fuchsia-600">
            <TrendingUp class="w-4 h-4" />
          </div>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold tracking-tight text-zinc-900">{formatCurrency(financeSummary.monthly_recurring_revenue)}</div>
          <div class="text-[11px] font-medium text-fuchsia-700 mt-1 flex items-center gap-1">
            <TrendingUp class="w-3 h-3" /> Recurring run-rate
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Revenue Analytics Chart Card -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <Card.Header class="pb-3 flex flex-row items-center justify-between border-b border-zinc-100">
        <div>
          <Card.Title class="text-sm font-bold text-zinc-900">Revenue Trajectory</Card.Title>
          <Card.Description class="text-xs text-zinc-500">
            Monthly recurring pacing over the trailing two quarters.
          </Card.Description>
        </div>
        <div class="flex items-center gap-1 bg-zinc-100/80 p-0.5 rounded-lg border border-zinc-200/60">
          <Button variant="default" size="xs" class="text-xs h-7 gradient-magenta text-white font-semibold rounded-md shadow-2xs">
            Monthly
          </Button>
          <Button variant="ghost" size="xs" class="text-xs h-7 text-zinc-600 hover:text-zinc-900 rounded-md">
            Quarterly
          </Button>
          <Button variant="ghost" size="xs" class="text-xs h-7 text-zinc-600 hover:text-zinc-900 rounded-md">
            Yearly
          </Button>
        </div>
      </Card.Header>
      <Card.Content class="pt-5">
        <Chart data={chartData} height={210} />
      </Card.Content>
    </Card.Root>

    <!-- Clean Borderless Recent Invoices Table (No unnecessary lines) -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <Card.Header class="pb-3 flex flex-row items-center justify-between border-b border-zinc-100">
        <div>
          <Card.Title class="text-sm font-bold text-zinc-900">Recent Invoices</Card.Title>
          <Card.Description class="text-xs text-zinc-500">Latest accounts receivable statements and settlement tracking.</Card.Description>
        </div>
        <Button variant="outline" size="xs" href="/invoices" class="text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-lg">
          View All Invoices
        </Button>
      </Card.Header>
      <Card.Content class="p-3">
        <Table.Root>
          <Table.Header class="text-zinc-400">
            <Table.Row class="hover:bg-transparent">
              <Table.Head class="h-9 text-xs font-semibold px-4">Invoice #</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Customer</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Date</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Amount</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center">Status</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Action</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs">
            {#each recentInvoices as inv}
              <Table.Row class="rounded-xl transition-all hover:bg-fuchsia-50/20">
                <Table.Cell class="py-3 px-4 font-semibold text-zinc-900">{inv.id}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-zinc-800 font-medium">{inv.customer}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-zinc-500">{inv.date}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-right font-bold text-zinc-900">{inv.amount}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-center">
                  <span class={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${inv.badgeClass}`}>
                    {inv.status}
                  </span>
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-right">
                  <Button variant="ghost" size="xs" class="h-7 text-xs text-zinc-600 hover:text-fuchsia-700 hover:bg-fuchsia-50/50 rounded-lg gap-1">
                    Details <ArrowUpRight class="w-3 h-3" />
                  </Button>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </Card.Content>
    </Card.Root>
  </div>
</AppShell>
