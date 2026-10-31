<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import {
    Receipt,
    Search,
    Send,
    CheckCircle,
    Clock,
    AlertCircle,
    X,
    CreditCard
  } from "lucide-svelte";

  let searchQuery = $state("");
  let showPaymentModal = $state(false);
  let selectedInvoice = $state(null);
  let paymentMethod = $state("Wire Transfer");
  let paymentReference = $state("");

  let invoices = $state([
    {
      id: "INV-2026-001",
      customer: "CloudSphere AI",
      amount: "$1,240.00",
      rawAmount: 1240,
      dueDate: "Oct 15, 2026",
      status: "Overdue",
      statusColor: "bg-rose-50 text-rose-700 border-rose-200"
    },
    {
      id: "INV-2026-002",
      customer: "BioSynth Labs",
      amount: "$2,450.00",
      rawAmount: 2450,
      dueDate: "Oct 20, 2026",
      status: "Overdue",
      statusColor: "bg-rose-50 text-rose-700 border-rose-200"
    },
    {
      id: "INV-2026-003",
      customer: "Apex Global Tech",
      amount: "$4,200.00",
      rawAmount: 4200,
      dueDate: "Nov 05, 2026",
      status: "Sent",
      statusColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
    },
    {
      id: "INV-2026-004",
      customer: "Starlight Media Group",
      amount: "$950.00",
      rawAmount: 950,
      dueDate: "Nov 12, 2026",
      status: "Partially Paid",
      statusColor: "bg-amber-50 text-amber-700 border-amber-200"
    },
    {
      id: "INV-2026-005",
      customer: "Vanguard Dynamics",
      amount: "$5,600.00",
      rawAmount: 5600,
      dueDate: "Oct 28, 2026",
      status: "Paid",
      statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    }
  ]);

  function openRecordPayment(inv) {
    selectedInvoice = inv;
    paymentReference = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    showPaymentModal = true;
  }

  function handleRecordPayment() {
    if (!selectedInvoice) return;
    invoices = invoices.map(i => {
      if (i.id === selectedInvoice.id) {
        return {
          ...i,
          status: "Paid",
          statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
        };
      }
      return i;
    });
    showPaymentModal = false;
  }
</script>

<AppShell title="Billing & Collections">
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-zinc-900 tracking-tight">Staff Billing & Collections</h2>
        <p class="text-xs text-zinc-500 mt-1">
          Monitor receivables across assigned customer accounts and record offline receipts.
        </p>
      </div>
    </div>

    <!-- Collection Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden p-4">
        <div class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total Overdue Receivables</div>
        <div class="text-xl font-bold text-rose-600 mt-1">$3,690.00</div>
        <div class="text-[11px] text-zinc-500 mt-0.5">2 accounts require immediate follow-up</div>
      </Card.Root>

      <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden p-4">
        <div class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Pending Current Term</div>
        <div class="text-xl font-bold text-zinc-900 mt-1">$5,150.00</div>
        <div class="text-[11px] text-zinc-500 mt-0.5">Due within the next 14 days</div>
      </Card.Root>

      <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden p-4">
        <div class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Collected This Month</div>
        <div class="text-xl font-bold text-emerald-600 mt-1">$14,200.00</div>
        <div class="text-[11px] text-zinc-500 mt-0.5">8 invoices successfully closed</div>
      </Card.Root>
    </div>

    <!-- Invoices Table -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <div class="p-3 border-b border-zinc-100 flex items-center justify-between">
        <div class="relative w-72">
          <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <Input
            type="text"
            placeholder="Search invoice or customer..."
            bind:value={searchQuery}
            class="h-8 pl-9 text-xs bg-zinc-50/70 border-zinc-200 rounded-lg"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left">
          <thead class="bg-zinc-50/80 text-zinc-500 font-semibold border-b border-zinc-200/80">
            <tr>
              <th class="py-3 px-4">Invoice #</th>
              <th class="py-3 px-4">Customer Account</th>
              <th class="py-3 px-4">Due Date</th>
              <th class="py-3 px-4 text-right">Amount</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Collections Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            {#each invoices as inv}
              <tr class="hover:bg-zinc-50/70 transition-colors">
                <td class="py-3 px-4 font-mono font-medium text-zinc-900">{inv.id}</td>
                <td class="py-3 px-4 font-semibold text-zinc-900">{inv.customer}</td>
                <td class="py-3 px-4 text-zinc-500">{inv.dueDate}</td>
                <td class="py-3 px-4 text-right font-semibold text-zinc-900">{inv.amount}</td>
                <td class="py-3 px-4">
                  <span class={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${inv.statusColor}`}>
                    {inv.status}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    {#if inv.status !== "Paid"}
                      <Button
                        size="xs"
                        variant="outline"
                        onclick={() => openRecordPayment(inv)}
                        class="h-7 text-[11px] border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      >
                        Record Payment
                      </Button>
                      <button
                        class="p-1 rounded text-zinc-400 hover:text-[#183f42] hover:bg-[#e6f4f2]/60 transition-colors"
                        title="Send Reminder Email"
                      >
                        <Send class="w-3.5 h-3.5" />
                      </button>
                    {:else}
                      <span class="text-[11px] text-emerald-600 font-medium">Settled</span>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card.Root>

    <!-- Record Offline Payment Modal -->
    {#if showPaymentModal && selectedInvoice}
      <div class="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div class="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <CreditCard class="w-4 h-4 text-[#183f42]" />
              <h3 class="text-sm font-bold text-zinc-900">Record Offline Payment</h3>
            </div>
            <button onclick={() => (showPaymentModal = false)} class="p-1 rounded-md text-zinc-400 hover:text-zinc-600">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="p-5 space-y-4 text-xs">
            <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 space-y-1">
              <div class="flex justify-between text-zinc-500">
                <span>Invoice:</span>
                <span class="font-mono font-medium text-zinc-900">{selectedInvoice.id}</span>
              </div>
              <div class="flex justify-between text-zinc-500">
                <span>Customer:</span>
                <span class="font-semibold text-zinc-900">{selectedInvoice.customer}</span>
              </div>
              <div class="flex justify-between text-zinc-500">
                <span>Outstanding Balance:</span>
                <span class="font-bold text-zinc-900">{selectedInvoice.amount}</span>
              </div>
            </div>

            <div class="space-y-1">
              <Label class="text-zinc-700 font-medium">Payment Channel</Label>
              <select bind:value={paymentMethod} class="w-full h-8 px-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
                <option value="Wire Transfer">Bank Wire / NEFT / RTGS</option>
                <option value="Corporate Cheque">Corporate Cheque</option>
                <option value="Direct Debit">Direct Debit</option>
                <option value="UPI / Card POS">UPI / Card Terminal</option>
              </select>
            </div>

            <div class="space-y-1">
              <Label class="text-zinc-700 font-medium">Bank Reference / UTR Number</Label>
              <Input
                bind:value={paymentReference}
                placeholder="e.g. UTR-9821820129"
                class="h-8 text-xs bg-zinc-50 border-zinc-200 rounded-lg"
              />
            </div>
          </div>

          <div class="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onclick={() => (showPaymentModal = false)} class="text-xs h-8">
              Cancel
            </Button>
            <Button size="sm" onclick={handleRecordPayment} class="bg-[#183f42] text-white text-xs h-8 shadow-xs">
              Confirm Receipt
            </Button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</AppShell>