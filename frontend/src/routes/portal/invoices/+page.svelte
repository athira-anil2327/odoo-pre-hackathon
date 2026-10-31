<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { invoicesStore, recordPayment } from "$lib/stores/invoices.js";
  import {
    Receipt,
    Download,
    Search,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    FileText,
    X,
    Check
  } from "lucide-svelte";

  let searchQuery = $state("");
  let statusFilter = $state("All");
  let showPayModal = $state(false);
  let selectedInvoice = $state(null);
  let isPaying = $state(false);

  function formatAmount(val) {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const todayStr = new Date().toISOString().split("T")[0];

  // ONLY invoices where payment is pending are shown in the customer portal
  const pendingInvoices = $derived(
    $invoicesStore
      .filter(i => {
        const hasPendingAmount = Number(i.outstanding_amount) > 0;
        const isNotCancelled = i.status !== "cancelled";
        const isNotPaid = i.status !== "paid";
        return hasPendingAmount && isNotCancelled && isNotPaid;
      })
      .map(i => {
        const isOverdue = i.due_date && i.due_date < todayStr;
        const status = isOverdue ? "Overdue" : "Pending";
        const statusColor = isOverdue
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-amber-50 text-amber-700 border-amber-200";

        const periodLabel = i.lines?.[0]?.product_name
          ? `${i.lines[0].product_name} Billing`
          : i.billing_period_start
          ? `${i.billing_period_start} Billing`
          : "Monthly Billing";

        return {
          id: i.invoice_number || i.id,
          rawId: i.id,
          period: periodLabel,
          issueDate: i.invoice_date || todayStr,
          dueDate: i.due_date || todayStr,
          subtotal: formatAmount(i.subtotal),
          tax: formatAmount(i.tax_total),
          amount: formatAmount(i.outstanding_amount),
          rawAmount: Number(i.outstanding_amount),
          status,
          statusColor
        };
      })
  );

  const filteredInvoices = $derived(
    pendingInvoices.filter(i => {
      const matchesSearch =
        i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.period.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || i.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    })
  );

  function openPayModal(inv) {
    selectedInvoice = inv;
    showPayModal = true;
  }

  function handleProcessPayment() {
    isPaying = true;
    setTimeout(() => {
      if (selectedInvoice) {
        try {
          recordPayment({
            invoiceId: selectedInvoice.rawId || selectedInvoice.id,
            amount: selectedInvoice.rawAmount,
            paymentMethod: "credit_card",
            referenceNumber: `CC-PORTAL-${Math.floor(100000 + Math.random() * 900000)}`,
            note: "Customer online portal payment settlement"
          });
        } catch (e) {
          console.warn("Payment error:", e);
        }
      }
      isPaying = false;
      showPayModal = false;
    }, 1000);
  }

  function handleDownloadReceipt(invId) {
    window.print();
  }
</script>

<AppShell title="Invoices & Tax Receipts">
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-zinc-900 tracking-tight">Billing Receipts & Tax Invoices</h2>
        <p class="text-xs text-zinc-500 mt-1">
          Access all billing statements, download official GST/VAT receipts, and settle outstanding charges.
        </p>
      </div>

      <button
        onclick={() => handleDownloadReceipt("ALL")}
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-zinc-200/80 rounded-xl text-zinc-700 hover:bg-zinc-50 transition-all shadow-xs"
      >
        <Download class="w-3.5 h-3.5 text-zinc-400" /> Export All Statements
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-zinc-200/80 rounded-xl shadow-xs">
      <div class="relative w-full sm:w-72">
        <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
        <Input
          type="text"
          placeholder="Search by invoice # or term..."
          bind:value={searchQuery}
          class="h-8 pl-9 text-xs bg-zinc-50/70 border-zinc-200 rounded-lg"
        />
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <span class="text-xs text-zinc-400">Status:</span>
        <select
          bind:value={statusFilter}
          class="h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 focus:outline-none"
        >
          <option value="All">All Invoices</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>
    </div>

    <!-- Invoices Table -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left">
          <thead class="bg-zinc-50/80 text-zinc-500 font-semibold border-b border-zinc-200/80">
            <tr>
              <th class="py-3 px-4">Invoice #</th>
              <th class="py-3 px-4">Billing Statement</th>
              <th class="py-3 px-4">Issue Date</th>
              <th class="py-3 px-4">Due Date</th>
              <th class="py-3 px-4 text-right">Tax (10%)</th>
              <th class="py-3 px-4 text-right">Total Amount</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Receipt / Pay</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            {#if filteredInvoices.length === 0}
              <tr>
                <td colspan="8" class="py-8 text-center text-zinc-400">
                  No pending invoices found. All payments are up to date!
                </td>
              </tr>
            {:else}
              {#each filteredInvoices as inv}
                <tr class="hover:bg-zinc-50/70 transition-colors">
                  <td class="py-3 px-4 font-mono font-medium text-zinc-900">{inv.id}</td>
                  <td class="py-3 px-4 font-semibold text-zinc-800">{inv.period}</td>
                  <td class="py-3 px-4 text-zinc-500">{inv.issueDate}</td>
                  <td class="py-3 px-4 text-zinc-500">{inv.dueDate}</td>
                  <td class="py-3 px-4 text-right text-zinc-500">{inv.tax}</td>
                  <td class="py-3 px-4 text-right font-semibold text-zinc-900">{inv.amount}</td>
                  <td class="py-3 px-4">
                    <span class={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${inv.statusColor}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <Button
                        size="xs"
                        onclick={() => openPayModal(inv)}
                        class="h-7 text-[11px] bg-[#183f42] hover:bg-[#123033] text-white shadow-xs"
                      >
                        Pay Now
                      </Button>
                      <button
                        onclick={() => handleDownloadReceipt(inv.id)}
                        class="h-7 px-2.5 text-[11px] border border-zinc-200 rounded-md text-zinc-700 hover:bg-zinc-50 flex items-center gap-1 transition-colors"
                        title="Download PDF"
                      >
                        <Download class="w-3 h-3 text-zinc-400" /> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </Card.Root>

    <!-- Pay Modal -->
    {#if showPayModal && selectedInvoice}
      <div class="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div class="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <CreditCard class="w-4 h-4 text-[#183f42]" />
              <h3 class="text-sm font-bold text-zinc-900">Pay Outstanding Invoice</h3>
            </div>
            <button onclick={() => (showPayModal = false)} class="p-1 rounded-md text-zinc-400 hover:text-zinc-600">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="p-5 space-y-4 text-xs">
            <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 space-y-1">
              <div class="flex justify-between text-zinc-500">
                <span>Invoice Number:</span>
                <span class="font-mono font-medium text-zinc-900">{selectedInvoice.id}</span>
              </div>
              <div class="flex justify-between text-zinc-500">
                <span>Statement:</span>
                <span class="font-semibold text-zinc-900">{selectedInvoice.period}</span>
              </div>
              <div class="flex justify-between text-zinc-500 border-t border-zinc-200 pt-1 font-bold text-sm">
                <span>Amount Due:</span>
                <span class="text-[#183f42]">{selectedInvoice.amount}</span>
              </div>
            </div>

            <div class="p-3 rounded-xl border border-[#bde4df] bg-[#e6f4f2]/40 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <CreditCard class="w-4 h-4 text-[#183f42]" />
                <div>
                  <div class="font-semibold text-zinc-900 text-xs">Visa ending in 4242</div>
                  <div class="text-[10px] text-zinc-500">Authorized primary card</div>
                </div>
              </div>
              <Check class="w-4 h-4 text-[#183f42]" />
            </div>
          </div>

          <div class="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onclick={() => (showPayModal = false)} class="text-xs h-8">
              Cancel
            </Button>
            <Button
              size="sm"
              onclick={handleProcessPayment}
              disabled={isPaying}
              class="bg-[#183f42] hover:bg-[#123033] text-white text-xs h-8 shadow-xs"
            >
              {isPaying ? "Processing..." : `Confirm & Pay ${selectedInvoice.amount}`}
            </Button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</AppShell>
