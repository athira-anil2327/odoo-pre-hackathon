<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { invoicesStore, paymentsStore, recordPayment } from "$lib/stores/invoices.js";
  import { customersStore } from "$lib/stores/coreManagement.js";
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
  let paymentMethod = $state("bank_transfer");
  let paymentReference = $state("");
  let paymentAmount = $state(0);
  let isRecording = $state(false);

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

  // Derive live metrics from the database invoice store
  const activeInvoices = $derived($invoicesStore.filter(i => i.status !== "cancelled"));
  
  const overdueInvoices = $derived(
    activeInvoices.filter(i => Number(i.outstanding_amount) > 0 && i.due_date && i.due_date < todayStr)
  );
  const totalOverdue = $derived(
    overdueInvoices.reduce((acc, i) => acc + (Number(i.outstanding_amount) || 0), 0)
  );

  const pendingInvoices = $derived(
    activeInvoices.filter(i => Number(i.outstanding_amount) > 0 && (!i.due_date || i.due_date >= todayStr))
  );
  const totalPending = $derived(
    pendingInvoices.reduce((acc, i) => acc + (Number(i.outstanding_amount) || 0), 0)
  );

  const totalCollected = $derived(
    $paymentsStore.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) ||
    activeInvoices.reduce((acc, i) => acc + (Number(i.paid_amount) || 0), 0)
  );

  const displayInvoices = $derived(
    activeInvoices
      .filter(i => {
        const q = searchQuery.toLowerCase();
        const cName = (i.customer_name || i.customer_company || getCustomerName(i.customer_id) || "").toLowerCase();
        const num = (i.invoice_number || i.id || "").toLowerCase();
        return cName.includes(q) || num.includes(q);
      })
      .map(i => {
        const isOverdue = Number(i.outstanding_amount) > 0 && i.due_date && i.due_date < todayStr;
        const isPaid = i.status === "paid" || Number(i.outstanding_amount) <= 0;
        const isPartial = i.status === "partially_paid" || (Number(i.paid_amount) > 0 && !isPaid);

        let status = "Confirmed";
        let statusColor = "bg-indigo-50 text-indigo-700 border-indigo-200";

        if (isPaid) {
          status = "Paid";
          statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
        } else if (isOverdue) {
          status = "Overdue";
          statusColor = "bg-rose-50 text-rose-700 border-rose-200";
        } else if (isPartial) {
          status = "Partially Paid";
          statusColor = "bg-amber-50 text-amber-700 border-amber-200";
        }

        return {
          raw: i,
          id: i.invoice_number || i.id,
          customer: i.customer_name || i.customer_company || getCustomerName(i.customer_id),
          amount: formatCurrency(i.total_amount),
          outstanding: formatCurrency(i.outstanding_amount),
          rawOutstanding: Number(i.outstanding_amount) || 0,
          dueDate: i.due_date ? new Date(i.due_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
          status,
          statusColor
        };
      })
  );

  function openRecordPayment(inv) {
    selectedInvoice = inv;
    paymentAmount = inv.rawOutstanding;
    paymentReference = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    showPaymentModal = true;
  }

  async function handleRecordPayment() {
    if (!selectedInvoice || !paymentAmount) return;
    isRecording = true;
    try {
      await recordPayment({
        invoice_id: selectedInvoice.raw.id,
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        reference_number: paymentReference,
        notes: "Recorded by staff collections officer"
      });
      showPaymentModal = false;
    } catch (e) {
      alert("Error recording payment: " + e.message);
    } finally {
      isRecording = false;
    }
  }
</script>

<AppShell title="Billing & Collections">
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-zinc-900 tracking-tight">Staff Billing & Collections</h2>
        <p class="text-xs text-zinc-500 mt-1">
          Live receivables tracking and offline ledger payments directly connected to PostgreSQL.
        </p>
      </div>
    </div>

    <!-- Collection Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden p-4">
        <div class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total Overdue Receivables</div>
        <div class="text-xl font-bold text-rose-600 mt-1">{formatCurrency(totalOverdue)}</div>
        <div class="text-[11px] text-zinc-500 mt-0.5">{overdueInvoices.length} account(s) past due terms</div>
      </Card.Root>

      <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden p-4">
        <div class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Pending Current Term</div>
        <div class="text-xl font-bold text-zinc-900 mt-1">{formatCurrency(totalPending)}</div>
        <div class="text-[11px] text-zinc-500 mt-0.5">{pendingInvoices.length} upcoming invoices pending payment</div>
      </Card.Root>

      <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden p-4">
        <div class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Collected Ledger Total</div>
        <div class="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</div>
        <div class="text-[11px] text-zinc-500 mt-0.5">Recorded across {$paymentsStore.length} reconciled payments</div>
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
        <div class="text-xs text-zinc-500">
          Showing <span class="font-bold text-zinc-900">{displayInvoices.length}</span> live invoices
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left">
          <thead class="bg-zinc-50/80 text-zinc-500 font-semibold border-b border-zinc-200/80">
            <tr>
              <th class="py-3 px-4">Invoice #</th>
              <th class="py-3 px-4">Customer Account</th>
              <th class="py-3 px-4">Due Date</th>
              <th class="py-3 px-4 text-right">Total Amount</th>
              <th class="py-3 px-4 text-right">Outstanding</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Collections Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            {#if displayInvoices.length === 0}
              <tr>
                <td colspan="7" class="py-8 text-center text-zinc-400">
                  No invoices found matching criteria.
                </td>
              </tr>
            {:else}
              {#each displayInvoices as inv}
                <tr class="hover:bg-zinc-50/70 transition-colors">
                  <td class="py-3 px-4 font-mono font-medium text-zinc-900">{inv.id}</td>
                  <td class="py-3 px-4 font-semibold text-zinc-900">{inv.customer}</td>
                  <td class="py-3 px-4 text-zinc-500">{inv.dueDate}</td>
                  <td class="py-3 px-4 text-right font-semibold text-zinc-900">{inv.amount}</td>
                  <td class="py-3 px-4 text-right font-bold text-rose-600">
                    {inv.rawOutstanding > 0 ? inv.outstanding : "—"}
                  </td>
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
                      {:else}
                        <span class="text-[11px] text-emerald-600 font-medium">Reconciled</span>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            {/if}
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
              <h3 class="text-sm font-bold text-zinc-900">Record Ledger Payment</h3>
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
                <span class="font-bold text-rose-600">{selectedInvoice.outstanding}</span>
              </div>
            </div>

            <div class="space-y-1">
              <Label class="text-zinc-700 font-medium">Payment Amount (INR)</Label>
              <Input
                type="number"
                step="0.01"
                bind:value={paymentAmount}
                max={selectedInvoice.rawOutstanding}
                class="h-8 text-xs bg-zinc-50 border-zinc-200 rounded-lg"
              />
            </div>

            <div class="space-y-1">
              <Label class="text-zinc-700 font-medium">Payment Channel</Label>
              <select bind:value={paymentMethod} class="w-full h-8 px-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
                <option value="bank_transfer">Bank Wire / NEFT / RTGS</option>
                <option value="upi">UPI Handle Transfer</option>
                <option value="credit_card">Corporate Credit Card</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash Settlement</option>
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
            <Button size="sm" onclick={handleRecordPayment} disabled={isRecording} class="bg-[#183f42] text-white text-xs h-8 shadow-xs">
              {isRecording ? "Reconciling..." : "Confirm & Reconcile"}
            </Button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</AppShell>
