<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import {
    Users,
    FileText,
    Receipt,
    Clock,
    Plus,
    ArrowUpRight,
    CheckCircle2,
    AlertCircle,
    PhoneCall,
    Mail,
    Send
  } from "lucide-svelte";
  import {
    customersStore,
    quotationsStore,
    subscriptionsStore,
    plansStore
  } from "$lib/stores/coreManagement.js";
  import { invoicesStore } from "$lib/stores/invoices.js";

  function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(num);
  }

  const todayStr = new Date().toISOString().split("T")[0];

  function getCustomerName(customerId) {
    const c = $customersStore.find(cust => cust.id === customerId);
    return c ? (c.company || c.name) : "Customer Account";
  }

  function getPlanName(planId) {
    const p = $plansStore.find(plan => plan.id === planId);
    return p ? p.name : "Subscription Plan";
  }

  // Live Metrics
  const openQuotes = $derived(
    $quotationsStore.filter(q => q.status === "draft" || q.status === "quotation")
  );
  const openQuotesValue = $derived(
    openQuotes.reduce((acc, q) => acc + (Number(q.total_amount) || 0), 0)
  );

  const overdueInvoices = $derived(
    $invoicesStore.filter(i => Number(i.outstanding_amount) > 0 && i.due_date && i.due_date < todayStr && i.status !== "cancelled")
  );
  const overdueValue = $derived(
    overdueInvoices.reduce((acc, i) => acc + (Number(i.outstanding_amount) || 0), 0)
  );

  const activeSubs = $derived(
    $subscriptionsStore.filter(s => s.status?.toLowerCase() === "active")
  );
  const activeSubsValue = $derived(
    activeSubs.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0)
  );

  const staffMetrics = $derived([
    {
      title: "My Assigned Accounts",
      value: String($customersStore.length),
      sub: `${activeSubs.length} active subscriptions`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Open Quotations",
      value: formatCurrency(openQuotesValue),
      sub: `${openQuotes.length} proposals pending`,
      icon: FileText,
      color: "text-[#183f42]",
      bg: "bg-[#e6f4f2]"
    },
    {
      title: "Receivables Follow-up",
      value: formatCurrency(overdueValue),
      sub: `${overdueInvoices.length} overdue invoices`,
      icon: Receipt,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "Active Contract MRR",
      value: formatCurrency(activeSubsValue),
      sub: `${activeSubs.length} recurring accounts`,
      icon: Clock,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    }
  ]);

  let tasks = $state([
    {
      id: 1,
      title: "Follow up with FinGuard Global Security on overdue invoice",
      company: "FinGuard Global Security",
      due: "Today, 3:00 PM",
      priority: "High",
      done: false
    },
    {
      id: 2,
      title: "Review sent quotation for Greenleaf Retailers Inc.",
      company: "Greenleaf Retailers Inc.",
      due: "Today, 5:00 PM",
      priority: "Medium",
      done: false
    },
    {
      id: 3,
      title: "Verify active onboarding for Starlight Media Group",
      company: "Starlight Media Group",
      due: "Tomorrow, 11:00 AM",
      priority: "Low",
      done: true
    }
  ]);

  const recentQuotations = $derived(
    $quotationsStore.slice(0, 5).map(q => {
      const isConfirmed = q.status === "confirmed";
      const isQuotation = q.status === "quotation";
      const isDraft = q.status === "draft";

      let statusColor = "bg-zinc-100 text-zinc-700 border-zinc-200";
      if (isConfirmed) statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
      else if (isQuotation) statusColor = "bg-amber-50 text-amber-700 border-amber-200";
      else if (isDraft) statusColor = "bg-indigo-50 text-indigo-700 border-indigo-200";

      return {
        id: q.quotation_number || q.quote_number || q.id,
        customer: getCustomerName(q.customer_id),
        plan: getPlanName(q.plan_id),
        amount: formatCurrency(q.total_amount),
        status: (q.status || "draft").toUpperCase(),
        statusColor
      };
    })
  );

  function toggleTask(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  }
</script>

<AppShell title="Staff Dashboard">
  <div class="space-y-6">
    <!-- Page Header & Quick CTAs -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-xl font-bold text-zinc-900 tracking-tight">Staff Operations Briefing</h2>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 uppercase">
            Live Database Pacing
          </span>
        </div>
        <p class="text-xs text-zinc-500 mt-1">
          Monitor your customer portfolio, track commercial proposals, and resolve receivables.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <a href="/staff/quotations">
          <Button variant="outline" size="sm" class="text-xs h-8 border-zinc-200 text-zinc-700 hover:bg-zinc-50">
            <FileText class="w-3.5 h-3.5 mr-1 text-zinc-400" /> All Quotes
          </Button>
        </a>
        <a href="/staff/quotations">
          <Button size="sm" class="bg-[#183f42] text-white shadow-xs text-xs h-8">
            <Plus class="w-3.5 h-3.5 mr-1" /> New Quotation
          </Button>
        </a>
      </div>
    </div>

    <!-- Staff Metric Cards matching theme.jpeg -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each staffMetrics as metric}
        {@const Icon = metric.icon}
        <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-start mb-3">
            <Icon class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">{metric.value}</div>
            <div class="text-xs font-medium text-teal-100/90 mt-1">{metric.title}</div>
            <div class="text-[11px] text-teal-200/80 mt-1">{metric.sub}</div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Operational Split Grid: Tasks & Assigned Quotes -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- Daily Priority Tasks -->
      <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
        <div class="p-4 border-b border-zinc-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-[#183f42]" />
            <span class="text-xs font-bold text-zinc-900">Today's Priority Action Items</span>
          </div>
          <span class="text-[10px] font-semibold text-zinc-400">{tasks.filter(t => !t.done).length} Pending</span>
        </div>
        <div class="p-3 divide-y divide-zinc-100">
          {#each tasks as task}
            <div class="py-3 px-2 flex items-start gap-3 hover:bg-zinc-50/60 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={task.done}
                onchange={() => toggleTask(task.id)}
                class="mt-0.5 rounded text-[#183f42] focus:ring-[#183f42]/20 h-4 w-4 border-zinc-300"
              />
              <div class="flex-1 min-w-0">
                <p class={`text-xs font-medium leading-snug ${task.done ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>
                  {task.title}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] font-medium text-zinc-400">{task.company}</span>
                  <span class="text-[10px] text-zinc-300">•</span>
                  <span class="text-[10px] text-zinc-500">{task.due}</span>
                  <span class={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                    task.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </Card.Root>

      <!-- Recent Assigned Quotations & Proposals -->
      <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden lg:col-span-2">
        <div class="p-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 class="text-xs font-bold text-zinc-900">Assigned Quotations & Proposals</h3>
            <p class="text-[11px] text-zinc-400">Proposals currently under review from database</p>
          </div>
          <a href="/staff/quotations" class="text-xs font-semibold text-[#183f42] hover:text-[#143e42] flex items-center gap-1">
            View All <ArrowUpRight class="w-3.5 h-3.5" />
          </a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-zinc-50/80 text-zinc-500 font-semibold border-b border-zinc-200/80">
              <tr>
                <th class="py-2.5 px-4">Quote ID</th>
                <th class="py-2.5 px-4">Customer</th>
                <th class="py-2.5 px-4">Package</th>
                <th class="py-2.5 px-4 text-right">Value</th>
                <th class="py-2.5 px-4">Status</th>
                <th class="py-2.5 px-4 text-right">Quick Contact</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              {#if recentQuotations.length === 0}
                <tr>
                  <td colspan="6" class="py-8 text-center text-zinc-400">
                    No proposals found in database.
                  </td>
                </tr>
              {:else}
                {#each recentQuotations as quote}
                  <tr class="hover:bg-zinc-50/70 transition-colors">
                    <td class="py-3 px-4 font-mono font-medium text-zinc-900">{quote.id}</td>
                    <td class="py-3 px-4 font-semibold text-zinc-800">{quote.customer}</td>
                    <td class="py-3 px-4 text-zinc-500">{quote.plan}</td>
                    <td class="py-3 px-4 text-right font-medium text-zinc-900">{quote.amount}</td>
                    <td class="py-3 px-4">
                      <span class={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${quote.statusColor}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <a href="/staff/quotations" class="p-1 rounded text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View Proposal">
                          <FileText class="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </Card.Root>
    </div>

    <!-- Receivables Collection Notice Banner -->
    {#if overdueInvoices.length > 0}
      <div class="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/70 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle class="w-4 h-4" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-zinc-900">{overdueInvoices.length} Invoices Awaiting Collection Follow-up</h4>
            <p class="text-[11px] text-zinc-500 mt-0.5">
              Total overdue balance: {formatCurrency(overdueValue)}. Reconcile payments or follow up with account contacts.
            </p>
          </div>
        </div>
        <a href="/staff/invoices">
          <Button size="sm" variant="outline" class="text-xs border-amber-300 text-amber-800 bg-white hover:bg-amber-50">
            Review Invoices
          </Button>
        </a>
      </div>
    {/if}
  </div>
</AppShell>
