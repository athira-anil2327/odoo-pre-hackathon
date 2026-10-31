<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import {
    Repeat,
    Receipt,
    CreditCard,
    Download,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    Users,
    ShieldCheck,
    X,
    Check
  } from "lucide-svelte";

  let showPayModal = $state(false);
  let isPaymentSuccess = $state(false);

  let recentInvoices = $state([
    {
      id: "INV-2026-004",
      period: "Oct 2026 Billing",
      date: "Oct 01, 2026",
      amount: "₹1,540.00",
      status: "Overdue",
      statusColor: "bg-rose-50 text-rose-700 border-rose-200"
    },
    {
      id: "INV-2026-002",
      period: "Sep 2026 Billing",
      date: "Sep 01, 2026",
      amount: "₹4,200.00",
      status: "Paid",
      statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    {
      id: "INV-2026-001",
      period: "Aug 2026 Billing",
      date: "Aug 01, 2026",
      amount: "₹4,200.00",
      status: "Paid",
      statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    }
  ]);

  function handleSettlePayment() {
    isPaymentSuccess = true;
    setTimeout(() => {
      recentInvoices = recentInvoices.map(i => {
        if (i.id === "INV-2026-004") {
          return {
            ...i,
            status: "Paid",
            statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
          };
        }
        return i;
      });
      showPayModal = false;
      isPaymentSuccess = false;
    }, 1200);
  }
</script>

<AppShell title="Client Billing & Subscription Portal">
  <div class="space-y-6">
    <!-- Portal Welcome Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-xl font-bold text-zinc-900 tracking-tight">Apex Global Technologies</h2>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/60 uppercase">
            Client Self-Service
          </span>
        </div>
        <p class="text-xs text-zinc-500 mt-1">
          Account ID: CUST-1001 • Primary Billing Contact: Sarah Jenkins
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <a href="/portal/subscriptions">
          <Button variant="outline" size="sm" class="text-xs h-8 border-zinc-200 text-zinc-700 hover:bg-zinc-50">
            <Repeat class="w-3.5 h-3.5 mr-1 text-zinc-400" /> Plan Details
          </Button>
        </a>
        <a href="/portal/payment-methods">
          <Button size="sm" class="gradient-magenta text-white glow-magenta-xs text-xs h-8">
            <CreditCard class="w-3.5 h-3.5 mr-1" /> Payment Settings
          </Button>
        </a>
      </div>
    </div>

    <!-- Outstanding Balance Alert (Conditional) -->
    {#if recentInvoices.some(i => i.status === "Overdue")}
      <div class="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertCircle class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-rose-900">Unpaid Invoice Balance: ₹1,540.00</h4>
            <p class="text-[11px] text-rose-700/80 mt-0.5">
              Invoice INV-2026-004 is overdue since Oct 15, 2026. Please settle to prevent service disruption.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onclick={() => (showPayModal = true)}
          class="gradient-magenta text-white glow-magenta-xs text-xs h-8 shrink-0"
        >
          Pay Balance Now
        </Button>
      </div>
    {/if}

    <!-- Active Subscription Overview Card -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <div class="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Current Subscription Plan</span>
          <div class="flex items-center gap-2 mt-1">
            <h3 class="text-lg font-bold text-zinc-900">Enterprise Cloud Plan</h3>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active & Healthy
            </span>
          </div>
          <p class="text-xs text-zinc-500 mt-1">
            Next billing renewal scheduled on <strong class="text-zinc-800">November 28, 2026</strong> for <strong>₹4,200.00</strong>.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <a href="/portal/subscriptions">
            <Button size="sm" variant="outline" class="text-xs h-8 border-zinc-200 text-zinc-700 hover:bg-zinc-50">
              Upgrade / Change Tier
            </Button>
          </a>
        </div>
      </div>

      <!-- Resource Utilization Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 p-4 bg-zinc-50/50 text-xs">
        <div class="p-3">
          <div class="flex items-center justify-between text-zinc-500 mb-1">
            <span>Seat Allocation</span>
            <span class="font-bold text-zinc-900">18 / 25</span>
          </div>
          <div class="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
            <div class="bg-fuchsia-600 h-full rounded-full" style="width: 72%"></div>
          </div>
          <span class="text-[10px] text-zinc-400 mt-1 block">7 seats available</span>
        </div>

        <div class="p-3">
          <div class="flex items-center justify-between text-zinc-500 mb-1">
            <span>API Rate Limit</span>
            <span class="font-bold text-zinc-900">420K / 1M</span>
          </div>
          <div class="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
            <div class="bg-blue-600 h-full rounded-full" style="width: 42%"></div>
          </div>
          <span class="text-[10px] text-zinc-400 mt-1 block">Refreshes in 18 days</span>
        </div>

        <div class="p-3">
          <div class="flex items-center justify-between text-zinc-500 mb-1">
            <span>Storage Cloud</span>
            <span class="font-bold text-zinc-900">140 GB / 500 GB</span>
          </div>
          <div class="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
            <div class="bg-emerald-600 h-full rounded-full" style="width: 28%"></div>
          </div>
          <span class="text-[10px] text-zinc-400 mt-1 block">360 GB remaining</span>
        </div>
      </div>
    </Card.Root>

    <!-- Recent Invoices & Receipts -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <div class="p-4 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h3 class="text-xs font-bold text-zinc-900">Billing History & Tax Receipts</h3>
          <p class="text-[11px] text-zinc-400">Download official tax invoices and verify receipts</p>
        </div>
        <a href="/portal/invoices" class="text-xs font-semibold text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-1">
          View All Invoices <ArrowUpRight class="w-3.5 h-3.5" />
        </a>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left">
          <thead class="bg-zinc-50/80 text-zinc-500 font-semibold border-b border-zinc-200/80">
            <tr>
              <th class="py-3 px-4">Invoice #</th>
              <th class="py-3 px-4">Billing Period</th>
              <th class="py-3 px-4">Issue Date</th>
              <th class="py-3 px-4 text-right">Amount</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            {#each recentInvoices as inv}
              <tr class="hover:bg-zinc-50/70 transition-colors">
                <td class="py-3 px-4 font-mono font-medium text-zinc-900">{inv.id}</td>
                <td class="py-3 px-4 text-zinc-600">{inv.period}</td>
                <td class="py-3 px-4 text-zinc-500">{inv.date}</td>
                <td class="py-3 px-4 text-right font-semibold text-zinc-900">{inv.amount}</td>
                <td class="py-3 px-4">
                  <span class={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${inv.statusColor}`}>
                    {inv.status}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    {#if inv.status === "Overdue"}
                      <Button
                        size="xs"
                        onclick={() => (showPayModal = true)}
                        class="h-7 text-[11px] gradient-magenta text-white glow-magenta-xs"
                      >
                        Pay Now
                      </Button>
                    {/if}
                    <button
                      class="h-7 px-2 text-[11px] border border-zinc-200 rounded-md text-zinc-700 hover:bg-zinc-50 flex items-center gap-1 transition-colors"
                      title="Download Tax PDF"
                    >
                      <Download class="w-3 h-3 text-zinc-400" /> PDF
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card.Root>

    <!-- Support & Account Manager Information -->
    <div class="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl gradient-magenta text-white flex items-center justify-center font-bold text-xs shrink-0">
          MB
        </div>
        <div>
          <h4 class="text-xs font-bold text-zinc-900">Assigned Account Executive: Marcus Brody</h4>
          <p class="text-[11px] text-zinc-500 mt-0.5">
            Questions regarding custom billing, contract amendments, or purchase orders? Reach out directly.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <a
          href="mailto:marcus.b@brightloop.io"
          class="px-3 py-1.5 text-xs font-semibold bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50"
        >
          Contact Support
        </a>
      </div>
    </div>

    <!-- Instant Checkout / Pay Modal -->
    {#if showPayModal}
      <div class="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div class="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <CreditCard class="w-4 h-4 text-fuchsia-600" />
              <h3 class="text-sm font-bold text-zinc-900">Settle Outstanding Balance</h3>
            </div>
            <button onclick={() => (showPayModal = false)} class="p-1 rounded-md text-zinc-400 hover:text-zinc-600">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="p-5 space-y-4 text-xs">
            <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 space-y-1">
              <div class="flex justify-between text-zinc-500">
                <span>Invoice:</span>
                <span class="font-mono font-medium text-zinc-900">INV-2026-004</span>
              </div>
              <div class="flex justify-between text-zinc-500">
                <span>Account:</span>
                <span class="font-semibold text-zinc-900">Apex Global Technologies</span>
              </div>
              <div class="flex justify-between text-zinc-500 border-t border-zinc-200 pt-1 font-bold text-sm">
                <span>Total Due:</span>
                <span class="text-fuchsia-600">₹1,540.00</span>
              </div>
            </div>

            <div class="space-y-2">
              <div class="text-zinc-600 font-medium">Payment Method:</div>
              <div class="p-3 rounded-xl border border-fuchsia-300 bg-fuchsia-50/40 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <CreditCard class="w-4 h-4 text-fuchsia-600" />
                  <div>
                    <div class="font-semibold text-zinc-900 text-xs">Visa ending in •••• 4242</div>
                    <div class="text-[10px] text-zinc-500">Exp 08/28 • Default</div>
                  </div>
                </div>
                <Check class="w-4 h-4 text-fuchsia-600" />
              </div>
            </div>
          </div>

          <div class="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onclick={() => (showPayModal = false)} class="text-xs h-8">
              Cancel
            </Button>
            <Button
              size="sm"
              onclick={handleSettlePayment}
              disabled={isPaymentSuccess}
              class="gradient-magenta text-white text-xs h-8 glow-magenta-xs"
            >
              {isPaymentSuccess ? "Processing..." : "Pay ₹1,540.00"}
            </Button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</AppShell>