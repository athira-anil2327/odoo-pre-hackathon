<script>
  import { page } from "$app/state";
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import {
    invoicesStore,
    paymentsStore,
    kpisStore,
    generateInvoiceForSubscription,
    recordPayment,
    confirmInvoice,
    cancelInvoice,
    sendInvoice
  } from "$lib/stores/invoices.js";
  import {
    subscriptionsStore,
    customersStore
  } from "$lib/stores/coreManagement.js";
  import {
    Download,
    Plus,
    Search,
    Filter,
    Calendar,
    ArrowUpDown,
    MoreHorizontal,
    FileText,
    ArrowLeft,
    CheckCircle2,
    Clock,
    AlertCircle,
    Receipt,
    CreditCard,
    Repeat,
    DollarSign,
    Send,
    Printer,
    Building2,
    Mail,
    X,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Ban,
    AlertTriangle,
    Check,
    CalendarClock,
    ShieldCheck
  } from "lucide-svelte";

  // Currency Formatter: Indian Rupee (INR - ₹) as defined in PostgreSQL schema
  function formatINR(val) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(Number(val) || 0);
  }

  // --- TAB STATE ---
  let activeTab = $state("all"); // 'all' | 'payments' | 'recurring' | 'transactions'

  $effect(() => {
    const tabParam = page.url.searchParams.get("tab");
    if (tabParam === "recurring" || tabParam === "billing") {
      activeTab = "recurring";
    } else if (tabParam === "payments") {
      activeTab = "payments";
    } else if (tabParam === "transactions") {
      activeTab = "transactions";
    } else if (tabParam === "all" || tabParam === "invoices") {
      activeTab = "all";
    }
  });

  // Dedicated Detail View State
  let selectedInvoice = $state(null);
  let openDropdownId = $state(null);

  // Modal States
  let isGenerateModalOpen = $state(false);
  let isRecordPaymentModalOpen = $state(false);
  let isCancelConfirmModalOpen = $state(false);
  let invoiceToCancel = $state(null);
  let cancelReason = $state("Commercial dispute / Client requested cancellation");

  // Record Payment Form State
  let paymentTargetInvoiceId = $state("");
  let paymentAmount = $state("");
  let paymentMethod = $state("bank_transfer");
  let paymentRef = $state("");
  let paymentNote = $state("");
  let paymentError = $state("");

  // Generate Invoice Form State
  let genSubId = $state("");
  let genPeriodStart = $state("");
  let genNotes = $state("");
  let genError = $state("");

  // Notification Toast State
  let toastMessage = $state("");
  let toastType = $state("success"); // 'success' | 'error'

  function showToast(msg, type = "success") {
    toastMessage = msg;
    toastType = type;
    setTimeout(() => {
      toastMessage = "";
    }, 4500);
  }

  // Filters State
  let searchQuery = $state("");
  let statusFilter = $state("All");
  let dateRangeFilter = $state("All Time");
  let paymentStatusFilter = $state("All");
  let sortBy = $state("latest"); // 'latest' | 'earliest' | 'amount-high' | 'amount-low'

  // Pagination State
  let currentPage = $state(1);
  let pageSize = $state(10);

  // Status Badge Styling matching existing theme
  const statusStyles = {
    draft: "bg-[#4a5568] text-white border-transparent",
    Draft: "bg-[#4a5568] text-white border-transparent",
    confirmed: "bg-[#183f42] text-white border-transparent",
    Confirmed: "bg-[#183f42] text-white border-transparent",
    partially_paid: "bg-amber-100 text-amber-900 border-amber-300",
    "Partially Paid": "bg-amber-100 text-amber-900 border-amber-300",
    paid: "bg-[#2f855a] text-white border-transparent",
    Paid: "bg-[#2f855a] text-white border-transparent",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200 line-through",
    Cancelled: "bg-rose-50 text-rose-700 border-rose-200 line-through",
    overdue: "bg-rose-600 text-white border-transparent",
    Overdue: "bg-rose-600 text-white border-transparent"
  };

  function getDisplayStatus(inv) {
    if (inv.status === "cancelled") return "Cancelled";
    const today = new Date().toISOString().split("T")[0];
    if (inv.due_date < today && Number(inv.outstanding_amount) > 0) {
      return "Overdue";
    }
    if (inv.status === "paid") return "Paid";
    if (inv.status === "partially_paid") return "Partially Paid";
    if (inv.status === "confirmed") return "Confirmed";
    return "Draft";
  }

  // Filtered and Sorted Invoices
  const filteredInvoices = $derived.by(() => {
    return $invoicesStore
      .filter((inv) => {
        // Search Filter
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          inv.invoice_number.toLowerCase().includes(query) ||
          (inv.customer_name && inv.customer_name.toLowerCase().includes(query)) ||
          (inv.subscription_number && inv.subscription_number.toLowerCase().includes(query));

        if (!matchesSearch) return false;

        // Status Filter
        const dispStatus = getDisplayStatus(inv);
        if (statusFilter !== "All") {
          if (statusFilter === "Overdue" && dispStatus !== "Overdue") return false;
          if (statusFilter === "Paid" && dispStatus !== "Paid") return false;
          if (statusFilter === "Partially Paid" && dispStatus !== "Partially Paid") return false;
          if (statusFilter === "Confirmed" && dispStatus !== "Confirmed") return false;
          if (statusFilter === "Draft" && dispStatus !== "Draft") return false;
          if (statusFilter === "Cancelled" && dispStatus !== "Cancelled") return false;
        }

        // Payment Balance Filter
        if (paymentStatusFilter === "Fully Paid" && Number(inv.outstanding_amount) > 0) return false;
        if (paymentStatusFilter === "Unpaid" && Number(inv.paid_amount) > 0) return false;
        if (paymentStatusFilter === "Partial" && (Number(inv.paid_amount) === 0 || Number(inv.outstanding_amount) === 0)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "latest") return new Date(b.invoice_date || 0) - new Date(a.invoice_date || 0);
        if (sortBy === "earliest") return new Date(a.invoice_date || 0) - new Date(b.invoice_date || 0);
        if (sortBy === "amount-high") return Number(b.total_amount) - Number(a.total_amount);
        if (sortBy === "amount-low") return Number(a.total_amount) - Number(b.total_amount);
        return 0;
      });
  });

  const paginatedInvoices = $derived.by(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  });

  const totalPages = $derived(Math.ceil(filteredInvoices.length / pageSize) || 1);

  // Active Subscriptions for Recurring Billing (Tab 3)
  const activeSubscriptions = $derived(
    $subscriptionsStore.filter((s) => s.status === "Active")
  );

  function isSubscriptionBilledForPeriod(sub) {
    const currentPeriodStart = sub.next_billing_date || new Date().toISOString().split("T")[0];
    return $invoicesStore.some(
      (inv) => inv.subscription_id === sub.id && inv.billing_period_start === currentPeriodStart
    );
  }

  function handleOpenDetails(inv) {
    selectedInvoice = inv;
    openDropdownId = null;
  }

  function handleBackToList() {
    selectedInvoice = null;
  }

  function toggleDropdown(id, e) {
    e.stopPropagation();
    openDropdownId = openDropdownId === id ? null : id;
  }

  function closeDropdown() {
    openDropdownId = null;
  }

  function handlePrintInvoice() {
    window.print();
  }

  // --- ACTIONS ---
  function openRecordPaymentModal(inv = null) {
    if (inv) {
      paymentTargetInvoiceId = inv.id;
      paymentAmount = String(inv.outstanding_amount);
    } else {
      const firstUnpaid = $invoicesStore.find((i) => Number(i.outstanding_amount) > 0 && i.status !== "cancelled");
      paymentTargetInvoiceId = firstUnpaid ? firstUnpaid.id : "";
      paymentAmount = firstUnpaid ? String(firstUnpaid.outstanding_amount) : "";
    }
    paymentMethod = "bank_transfer";
    paymentRef = `TXN-${Date.now().toString().slice(-6)}`;
    paymentNote = "";
    paymentError = "";
    isRecordPaymentModalOpen = true;
    openDropdownId = null;
  }

  function submitRecordPayment(e) {
    e.preventDefault();
    paymentError = "";

    try {
      const amt = parseFloat(paymentAmount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error("Please enter a valid positive payment amount.");
      }

      const payment = recordPayment({
        invoiceId: paymentTargetInvoiceId,
        amount: amt,
        paymentMethod,
        referenceNumber: paymentRef,
        note: paymentNote
      });

      // Update selectedInvoice if currently inspecting it
      if (selectedInvoice && selectedInvoice.id === paymentTargetInvoiceId) {
        selectedInvoice = $invoicesStore.find((i) => i.id === paymentTargetInvoiceId) || null;
      }

      isRecordPaymentModalOpen = false;
      showToast(`Payment of ${formatINR(amt)} successfully recorded against ${payment.invoice_number}!`);
    } catch (err) {
      paymentError = err.message || "Failed to record payment.";
    }
  }

  function openGenerateInvoiceModal(sub = null) {
    if (sub) {
      genSubId = sub.id;
      genPeriodStart = sub.next_billing_date || new Date().toISOString().split("T")[0];
    } else {
      const firstActive = activeSubscriptions[0];
      genSubId = firstActive ? firstActive.id : "";
      genPeriodStart = firstActive?.next_billing_date || new Date().toISOString().split("T")[0];
    }
    genNotes = "";
    genError = "";
    isGenerateModalOpen = true;
  }

  function submitGenerateInvoice(e) {
    e.preventDefault();
    genError = "";

    try {
      if (!genSubId) throw new Error("Please select an active subscription.");

      const newInv = generateInvoiceForSubscription(genSubId, genPeriodStart || null, null, genNotes);
      isGenerateModalOpen = false;
      showToast(`Invoice ${newInv.invoice_number} generated successfully for ${newInv.customer_name}!`);
    } catch (err) {
      genError = err.message || "Failed to generate invoice.";
    }
  }

  function handleDirectGenerateForSub(sub) {
    try {
      const newInv = generateInvoiceForSubscription(sub.id, sub.next_billing_date || null);
      showToast(`Invoice ${newInv.invoice_number} generated for ${sub.subscription_number}! Next billing advanced.`);
    } catch (err) {
      showToast(err.message || "Could not generate invoice.", "error");
    }
  }

  function handleConfirmInvoice(inv) {
    try {
      confirmInvoice(inv.id);
      if (selectedInvoice && selectedInvoice.id === inv.id) {
        selectedInvoice = $invoicesStore.find((i) => i.id === inv.id) || null;
      }
      showToast(`Invoice ${inv.invoice_number} has been CONFIRMED.`);
      openDropdownId = null;
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function handleSendInvoice(inv) {
    try {
      sendInvoice(inv.id);
      if (selectedInvoice && selectedInvoice.id === inv.id) {
        selectedInvoice = $invoicesStore.find((i) => i.id === inv.id) || null;
      }
      showToast(`Invoice ${inv.invoice_number} emailed to customer.`);
      openDropdownId = null;
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function promptCancelInvoice(inv) {
    invoiceToCancel = inv;
    cancelReason = "Commercial dispute / Client requested cancellation";
    isCancelConfirmModalOpen = true;
    openDropdownId = null;
  }

  function executeCancelInvoice() {
    if (!invoiceToCancel) return;
    try {
      cancelInvoice(invoiceToCancel.id, cancelReason);
      if (selectedInvoice && selectedInvoice.id === invoiceToCancel.id) {
        selectedInvoice = $invoicesStore.find((i) => i.id === invoiceToCancel.id) || null;
      }
      showToast(`Invoice ${invoiceToCancel.invoice_number} was CANCELLED.`);
      isCancelConfirmModalOpen = false;
      invoiceToCancel = null;
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // Selected invoice payments history
  const selectedInvoicePayments = $derived.by(() => {
    if (!selectedInvoice) return [];
    return $paymentsStore.filter((p) => p.invoice_id === selectedInvoice.id);
  });
</script>

<svelte:window onclick={closeDropdown} />

<!-- NOTIFICATION TOAST -->
{#if toastMessage}
  <div class="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
    <div class={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
      toastType === 'error'
        ? 'bg-rose-50 text-rose-900 border-rose-200'
        : 'bg-[#183f42] text-white border-[#123033]'
    }`}>
      {#if toastType === 'error'}
        <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
      {:else}
        <CheckCircle2 class="w-4 h-4 text-teal-300 shrink-0" />
      {/if}
      <span>{toastMessage}</span>
    </div>
  </div>
{/if}

<AppShell title="Invoices & Billing">
  <!-- DEDICATED INVOICE DETAILS EXPERIENCE (Section 4) -->
  {#if selectedInvoice}
    <div class="space-y-6 max-w-5xl mx-auto">
      <!-- Breadcrumb & Back Link -->
      <div class="flex items-center justify-between">
        <button
          onclick={handleBackToList}
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#717786] hover:text-[#183f42] transition-colors"
        >
          <ArrowLeft class="w-3.5 h-3.5" /> Back to all invoices
        </button>

        <div class="text-xs text-[#717786]">
          Invoice &amp; Billing / <span class="font-semibold text-[#171923]">{selectedInvoice.invoice_number}</span>
        </div>
      </div>

      <!-- Detail Header Card -->
      <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl">
        <Card.Content class="p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-3">
                <h2 class="text-xl font-bold text-[#171923] tracking-tight">{selectedInvoice.invoice_number}</h2>
                <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyles[getDisplayStatus(selectedInvoice)] || 'bg-zinc-100 text-zinc-700'}`}>
                  {getDisplayStatus(selectedInvoice)}
                </span>
                <span class="text-xs font-mono font-medium text-[#717786] bg-zinc-100 px-2 py-0.5 rounded">
                  {selectedInvoice.currency}
                </span>
              </div>
              <p class="text-xs text-[#717786]">
                Issued to <span class="font-semibold text-[#171923]">{selectedInvoice.customer_name}</span> on {selectedInvoice.invoice_date}
                {#if selectedInvoice.subscription_number}
                  • Linked Sub: <span class="font-mono text-[#183f42]">{selectedInvoice.subscription_number}</span>
                {/if}
              </p>
            </div>

            <!-- Header Action Buttons -->
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onclick={handlePrintInvoice}
                class="text-xs border-[#E5E7EB] text-[#171923] hover:bg-[#F8F9FC] h-8 gap-1.5"
              >
                <Printer class="w-3.5 h-3.5 text-[#717786]" /> Print / PDF
              </Button>

              <Button
                variant="outline"
                size="xs"
                onclick={() => handleSendInvoice(selectedInvoice)}
                class="text-xs border-[#E5E7EB] text-[#171923] hover:bg-[#F8F9FC] h-8 gap-1.5"
              >
                <Send class="w-3.5 h-3.5 text-[#717786]" /> Send Invoice
              </Button>

              {#if selectedInvoice.status === "draft"}
                <Button
                  size="xs"
                  onclick={() => handleConfirmInvoice(selectedInvoice)}
                  class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold h-8 gap-1.5 shadow-xs"
                >
                  <ShieldCheck class="w-3.5 h-3.5" /> Confirm Invoice
                </Button>
              {/if}

              {#if selectedInvoice.status !== "cancelled" && Number(selectedInvoice.outstanding_amount) > 0}
                <Button
                  size="xs"
                  onclick={() => openRecordPaymentModal(selectedInvoice)}
                  class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold h-8 gap-1.5 shadow-xs"
                >
                  <DollarSign class="w-3.5 h-3.5" /> Record Payment
                </Button>
              {/if}

              {#if selectedInvoice.status !== "cancelled" && Number(selectedInvoice.paid_amount) === 0}
                <Button
                  variant="outline"
                  size="xs"
                  onclick={() => promptCancelInvoice(selectedInvoice)}
                  class="text-xs border-rose-200 text-rose-700 hover:bg-rose-50 h-8 gap-1.5"
                >
                  <Ban class="w-3.5 h-3.5 text-rose-600" /> Cancel
                </Button>
              {/if}
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Financial Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl p-5">
          <div class="text-xs font-medium text-[#717786]">Total Amount</div>
          <div class="text-2xl font-bold text-[#171923] mt-1">{formatINR(selectedInvoice.total_amount)}</div>
          <div class="text-[11px] text-[#717786] mt-0.5">Subtotal + GST tax amount</div>
        </Card.Root>

        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl p-5">
          <div class="text-xs font-medium text-[#717786]">Amount Paid</div>
          <div class="text-2xl font-bold text-[#16A34A] mt-1">{formatINR(selectedInvoice.paid_amount)}</div>
          <div class="text-[11px] text-[#717786] mt-0.5">Recorded settlements</div>
        </Card.Root>

        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl p-5">
          <div class="text-xs font-medium text-[#717786]">Outstanding Balance</div>
          <div class={`text-2xl font-bold mt-1 ${Number(selectedInvoice.outstanding_amount) > 0 ? 'text-[#DC2626]' : 'text-[#717786]'}`}>
            {formatINR(selectedInvoice.outstanding_amount)}
          </div>
          <div class="text-[11px] text-[#717786] mt-0.5">
            {selectedInvoice.status === 'cancelled' ? 'Invoice voided' : `Due by ${selectedInvoice.due_date}`}
          </div>
        </Card.Root>
      </div>

      <!-- Invoice Information Details Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl">
          <Card.Header class="pb-3 border-b border-[#E5E7EB]">
            <Card.Title class="text-xs font-bold text-[#171923] uppercase tracking-wider flex items-center gap-2">
              <Building2 class="w-3.5 h-3.5 text-[#717786]" /> Customer Details
            </Card.Title>
          </Card.Header>
          <Card.Content class="p-5 space-y-3 text-xs">
            <div>
              <div class="font-bold text-[#171923] text-sm">{selectedInvoice.customer_name}</div>
              {#if selectedInvoice.contact_name}
                <div class="text-[#717786] mt-0.5">Attn: {selectedInvoice.contact_name}</div>
              {/if}
            </div>
            <div>
              <div class="text-[#717786]">Email Address</div>
              <div class="text-[#171923] font-medium">{selectedInvoice.contact_email || "billing@customer.com"}</div>
            </div>
            <div>
              <div class="text-[#717786]">Billing Address</div>
              <div class="text-[#171923]">{selectedInvoice.billing_address || "None specified"}</div>
            </div>
            <div>
              <div class="text-[#717786]">Tax Registration / GSTIN</div>
              <div class="text-[#171923] font-mono">{selectedInvoice.tax_id || "GST-29AABCU9603R1ZM"}</div>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl">
          <Card.Header class="pb-3 border-b border-[#E5E7EB]">
            <Card.Title class="text-xs font-bold text-[#171923] uppercase tracking-wider flex items-center gap-2">
              <Clock class="w-3.5 h-3.5 text-[#717786]" /> Billing Terms &amp; Cycle
            </Card.Title>
          </Card.Header>
          <Card.Content class="p-5 space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-[#717786]">Invoice Date</div>
                <div class="text-[#171923] font-semibold">{selectedInvoice.invoice_date}</div>
              </div>
              <div>
                <div class="text-[#717786]">Due Date</div>
                <div class="text-[#171923] font-semibold">{selectedInvoice.due_date}</div>
              </div>
            </div>
            <div>
              <div class="text-[#717786]">Billing Period (Unique Constraint Period)</div>
              <div class="text-[#171923] font-medium font-mono text-xs">
                {selectedInvoice.billing_period_start} &rarr; {selectedInvoice.billing_period_end}
              </div>
            </div>
            <div>
              <div class="text-[#717786]">Subscription Reference</div>
              <div class="text-[#183f42] font-medium hover:underline cursor-pointer font-mono">
                {selectedInvoice.subscription_number || "Direct Invoicing"}
              </div>
            </div>
            <div>
              <div class="text-[#717786]">Notes / Audit Trail</div>
              <div class="text-[#586f73] italic">
                {selectedInvoice.notes || "None recorded."}
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Invoice Breakdown Table -->
      <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl overflow-hidden">
        <Card.Header class="pb-3 border-b border-[#E5E7EB]">
          <Card.Title class="text-xs font-bold text-[#171923] uppercase tracking-wider">
            Line Items &amp; Tax Snapshot
          </Card.Title>
        </Card.Header>
        <Card.Content class="p-0">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-[#F8F9FC] border-b border-[#E5E7EB] text-[#717786] font-semibold text-[11px]">
              <tr>
                <th class="py-2.5 px-5">Description</th>
                <th class="py-2.5 px-4 text-center">Period</th>
                <th class="py-2.5 px-4 text-center">Qty</th>
                <th class="py-2.5 px-4 text-right">Unit Price</th>
                <th class="py-2.5 px-4 text-right">Tax (18%)</th>
                <th class="py-2.5 px-5 text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E5E7EB]">
              {#if selectedInvoice.lines && selectedInvoice.lines.length > 0}
                {#each selectedInvoice.lines as item}
                  <tr class="hover:bg-[#F8F9FC]">
                    <td class="py-3 px-5 font-medium text-[#171923]">
                      <div>{item.description}</div>
                      {#if item.variant_name && item.variant_name !== "Standard"}
                        <div class="text-[11px] text-[#717786]">Variant: {item.variant_name}</div>
                      {/if}
                    </td>
                    <td class="py-3 px-4 text-center text-[#717786] font-mono text-[11px]">
                      {item.period_start} - {item.period_end}
                    </td>
                    <td class="py-3 px-4 text-center text-[#717786]">{item.quantity}</td>
                    <td class="py-3 px-4 text-right text-[#717786]">{formatINR(item.unit_price)}</td>
                    <td class="py-3 px-4 text-right text-[#717786]">{formatINR(item.tax_amount)}</td>
                    <td class="py-3 px-5 text-right font-bold text-[#171923]">{formatINR(item.line_total)}</td>
                  </tr>
                {/each}
              {:else}
                <tr class="hover:bg-[#F8F9FC]">
                  <td class="py-3 px-5 font-medium text-[#171923]">Standard Enterprise Service License</td>
                  <td class="py-3 px-4 text-center text-[#717786] font-mono text-[11px]">
                    {selectedInvoice.billing_period_start} - {selectedInvoice.billing_period_end}
                  </td>
                  <td class="py-3 px-4 text-center text-[#717786]">1</td>
                  <td class="py-3 px-4 text-right text-[#717786]">{formatINR(selectedInvoice.subtotal)}</td>
                  <td class="py-3 px-4 text-right text-[#717786]">{formatINR(selectedInvoice.tax_total)}</td>
                  <td class="py-3 px-5 text-right font-bold text-[#171923]">{formatINR(selectedInvoice.total_amount)}</td>
                </tr>
              {/if}
            </tbody>
          </table>

          <!-- Subtotals Summary Box -->
          <div class="p-5 bg-[#F8F9FC] border-t border-[#E5E7EB] flex justify-end">
            <div class="w-72 space-y-2 text-xs">
              <div class="flex justify-between text-[#717786]">
                <span>Subtotal:</span>
                <span class="font-medium text-[#171923]">{formatINR(selectedInvoice.subtotal)}</span>
              </div>
              <div class="flex justify-between text-[#717786]">
                <span>Taxes (GST 18%):</span>
                <span class="font-medium text-[#171923]">{formatINR(selectedInvoice.tax_total)}</span>
              </div>
              {#if Number(selectedInvoice.discount_total) > 0}
                <div class="flex justify-between text-[#717786]">
                  <span>Discount:</span>
                  <span class="font-medium text-emerald-600">-{formatINR(selectedInvoice.discount_total)}</span>
                </div>
              {/if}
              <div class="flex justify-between pt-1 border-t border-[#E5E7EB] font-bold text-sm">
                <span>Total Amount:</span>
                <span class="text-[#171923]">{formatINR(selectedInvoice.total_amount)}</span>
              </div>
              <div class="flex justify-between text-[#16A34A] font-semibold">
                <span>Amount Paid:</span>
                <span>{formatINR(selectedInvoice.paid_amount)}</span>
              </div>
              <div class="flex justify-between pt-1 border-t border-[#E5E7EB] font-bold">
                <span class={Number(selectedInvoice.outstanding_amount) > 0 ? 'text-[#DC2626]' : 'text-[#171923]'}>Balance Due:</span>
                <span class={Number(selectedInvoice.outstanding_amount) > 0 ? 'text-[#DC2626]' : 'text-[#171923]'}>
                  {formatINR(selectedInvoice.outstanding_amount)}
                </span>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Payment History -->
      <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl overflow-hidden">
        <Card.Header class="pb-3 border-b border-[#E5E7EB] flex flex-row items-center justify-between">
          <Card.Title class="text-xs font-bold text-[#171923] uppercase tracking-wider flex items-center gap-2">
            <CreditCard class="w-3.5 h-3.5 text-[#717786]" /> Recorded Payments &amp; History
          </Card.Title>
          {#if selectedInvoice.status !== "cancelled" && Number(selectedInvoice.outstanding_amount) > 0}
            <Button
              size="xs"
              onclick={() => openRecordPaymentModal(selectedInvoice)}
              class="h-7 text-xs bg-[#183f42] hover:bg-[#123033] text-white gap-1 shadow-xs font-semibold"
            >
              <DollarSign class="w-3.5 h-3.5" /> Record Payment
            </Button>
          {/if}
        </Card.Header>
        <Card.Content class="p-0">
          {#if selectedInvoicePayments.length === 0}
            <div class="p-6 text-center text-xs text-[#717786]">
              No payments have been recorded for this invoice yet.
            </div>
          {:else}
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-[#F8F9FC] border-b border-[#E5E7EB] text-[#717786] font-semibold text-[11px]">
                <tr>
                  <th class="py-2.5 px-5">Payment Ref</th>
                  <th class="py-2.5 px-4">Payment Date</th>
                  <th class="py-2.5 px-4">Payment Method</th>
                  <th class="py-2.5 px-4">Reference / UTR</th>
                  <th class="py-2.5 px-4 text-right">Amount</th>
                  <th class="py-2.5 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E5E7EB]">
                {#each selectedInvoicePayments as pay}
                  <tr class="hover:bg-[#F8F9FC]">
                    <td class="py-3 px-5 font-mono font-medium text-[#171923]">{pay.payment_number}</td>
                    <td class="py-3 px-4 text-[#717786]">{pay.payment_date}</td>
                    <td class="py-3 px-4 capitalize text-[#171923] font-medium">{pay.payment_method.replace('_', ' ')}</td>
                    <td class="py-3 px-4 font-mono text-[11px] text-[#717786]">{pay.reference_number || "—"}</td>
                    <td class="py-3 px-4 text-right font-bold text-[#16A34A]">{formatINR(pay.amount)}</td>
                    <td class="py-3 px-5 text-center">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {pay.status || 'Settled'}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>

  <!-- MAIN INVOICES & BILLING LISTING VIEW -->
  {:else}
    <div class="space-y-6">
      <!-- 1. PAGE HEADER -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 class="text-[22px] font-bold text-[#171923] tracking-tight">Invoice &amp; Billing</h1>
          <p class="text-xs text-[#717786] mt-0.5">
            Manage enterprise invoices, schedule recurring billing cycles, and track inbound payment settlements.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="xs"
            onclick={() => openRecordPaymentModal()}
            class="text-xs border-[#E5E7EB] bg-white hover:bg-[#F8F9FC] text-[#171923] font-medium h-8 px-3 rounded-lg gap-1.5 shadow-2xs"
          >
            <DollarSign class="w-3.5 h-3.5 text-[#183f42]" /> Record Payment
          </Button>

          <Button
            variant="default"
            size="xs"
            onclick={() => openGenerateInvoiceModal()}
            class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold h-8 px-3.5 rounded-lg gap-1.5 shadow-xs"
          >
            <Plus class="w-3.5 h-3.5" /> Generate Invoice
          </Button>
        </div>
      </div>

      <!-- 2. FINANCIAL SUMMARY CARDS: Real calculations directly from live data -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Invoiced -->
        <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-start mb-3">
            <Receipt class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">{formatINR($kpisStore.totalInvoiced)}</div>
            <div class="text-xs font-medium text-teal-100/90 mt-1">Total Invoiced</div>
            <div class="text-[11px] text-teal-200/80 mt-1">{$kpisStore.totalCount} total billing cycles</div>
          </div>
        </div>

        <!-- Collected -->
        <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-start mb-3">
            <CheckCircle2 class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">{formatINR($kpisStore.collected)}</div>
            <div class="text-xs font-medium text-teal-100/90 mt-1">Collected</div>
            <div class="text-[11px] text-teal-200/80 mt-1">Verified payment receipts</div>
          </div>
        </div>

        <!-- Outstanding -->
        <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-start mb-3">
            <Clock class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">{formatINR($kpisStore.outstanding)}</div>
            <div class="text-xs font-medium text-teal-100/90 mt-1">Outstanding</div>
            <div class="text-[11px] text-teal-200/80 mt-1">{$kpisStore.pendingCount} open balances pending</div>
          </div>
        </div>

        <!-- Overdue -->
        <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-start mb-3">
            <AlertCircle class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">{formatINR($kpisStore.overdue)}</div>
            <div class="text-xs font-medium text-teal-100/90 mt-1">Overdue</div>
            <div class="text-[11px] text-teal-200/80 mt-1">{$kpisStore.overdueCount} require immediate follow-up</div>
          </div>
        </div>
      </div>

      <!-- 3. NAVIGATION TABS -->
      <div class="flex items-center gap-1 border-b border-[#E5E7EB]">
        <button
          onclick={() => (activeTab = "all")}
          class={`px-3.5 py-2 text-xs font-semibold transition-all relative ${
            activeTab === 'all'
              ? 'text-[#183f42]'
              : 'text-[#717786] hover:text-[#171923]'
          }`}
        >
          All Invoices ({$invoicesStore.length})
          {#if activeTab === 'all'}
            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#183f42]"></div>
          {/if}
        </button>

        <button
          onclick={() => (activeTab = "payments")}
          class={`px-3.5 py-2 text-xs font-semibold transition-all relative ${
            activeTab === 'payments'
              ? 'text-[#183f42]'
              : 'text-[#717786] hover:text-[#171923]'
          }`}
        >
          Payments ({$paymentsStore.length})
          {#if activeTab === 'payments'}
            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#183f42]"></div>
          {/if}
        </button>

        <button
          onclick={() => (activeTab = "recurring")}
          class={`px-3.5 py-2 text-xs font-semibold transition-all relative ${
            activeTab === 'recurring'
              ? 'text-[#183f42]'
              : 'text-[#717786] hover:text-[#171923]'
          }`}
        >
          Recurring Billing ({activeSubscriptions.length})
          {#if activeTab === 'recurring'}
            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#183f42]"></div>
          {/if}
        </button>

        <button
          onclick={() => (activeTab = "transactions")}
          class={`px-3.5 py-2 text-xs font-semibold transition-all relative ${
            activeTab === 'transactions'
              ? 'text-[#183f42]'
              : 'text-[#717786] hover:text-[#171923]'
          }`}
        >
          Transactions ({$paymentsStore.length})
          {#if activeTab === 'transactions'}
            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#183f42]"></div>
          {/if}
        </button>
      </div>

      <!-- ============================================================= -->
      <!-- TAB 1: ALL INVOICES (Main Experience) -->
      <!-- ============================================================= -->
      {#if activeTab === "all"}
        <!-- SEARCH AND FILTERS -->
        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl">
          <Card.Content class="p-3">
            <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
              <!-- Search Control -->
              <div class="relative w-full sm:w-72">
                <Search class="w-3.5 h-3.5 text-[#717786] absolute left-2.5 top-2.5" />
                <Input
                  type="text"
                  placeholder="Search invoice #, customer, sub..."
                  bind:value={searchQuery}
                  class="h-8 pl-8 pr-3 text-xs bg-[#F8F9FC] border-[#E5E7EB] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-lg text-[#171923]"
                />
              </div>

              <!-- Compact Filter Selects -->
              <div class="flex flex-wrap items-center gap-2">
                <!-- Status Filter -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] text-[#717786]">Status:</span>
                  <select
                    bind:value={statusFilter}
                    class="h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2.5 text-[#171923] font-medium outline-none focus:border-[#183f42]"
                  >
                    <option value="All">All</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Draft">Draft</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <!-- Payment Balance Filter -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] text-[#717786]">Balance:</span>
                  <select
                    bind:value={paymentStatusFilter}
                    class="h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2.5 text-[#171923] font-medium outline-none focus:border-[#183f42]"
                  >
                    <option value="All">All</option>
                    <option value="Fully Paid">Fully Settled</option>
                    <option value="Partial">Partially Paid</option>
                    <option value="Unpaid">Unpaid Only</option>
                  </select>
                </div>

                <!-- Sort By -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] text-[#717786]">Sort:</span>
                  <select
                    bind:value={sortBy}
                    class="h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2.5 text-[#171923] font-medium outline-none focus:border-[#183f42]"
                  >
                    <option value="latest">Latest First</option>
                    <option value="earliest">Earliest First</option>
                    <option value="amount-high">Amount (High to Low)</option>
                    <option value="amount-low">Amount (Low to High)</option>
                  </select>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- INVOICE TABLE -->
        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl overflow-hidden">
          <Card.Content class="p-0">
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left border-collapse">
                <thead class="bg-[#F8F9FC] border-b border-[#E5E7EB] text-[#717786] font-semibold text-[11px]">
                  <tr>
                    <th class="py-3 px-5">Invoice #</th>
                    <th class="py-3 px-4">Customer &amp; Sub</th>
                    <th class="py-3 px-4">Billing Period</th>
                    <th class="py-3 px-4">Due Date</th>
                    <th class="py-3 px-4 text-right">Total</th>
                    <th class="py-3 px-4 text-right">Paid</th>
                    <th class="py-3 px-4 text-right">Balance</th>
                    <th class="py-3 px-4 text-center">Status</th>
                    <th class="py-3 px-4 text-right w-12"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E5E7EB]">
                  {#if paginatedInvoices.length === 0}
                    <tr>
                      <td colspan="9" class="py-12 text-center text-[#717786]">
                        No invoices match the filter criteria.
                      </td>
                    </tr>
                  {:else}
                    {#each paginatedInvoices as inv}
                      {@const dispStatus = getDisplayStatus(inv)}
                      <tr class="hover:bg-[#F8F9FC] transition-colors group">
                        <!-- Invoice Number -->
                        <td class="py-3.5 px-5">
                          <button
                            onclick={() => handleOpenDetails(inv)}
                            class="font-semibold text-[#171923] group-hover:text-[#183f42] transition-colors font-mono text-left block"
                          >
                            {inv.invoice_number}
                          </button>
                          <span class="text-[10px] text-[#717786]">Issued: {inv.invoice_date}</span>
                        </td>

                        <!-- Customer Details -->
                        <td class="py-3.5 px-4">
                          <div class="font-medium text-[#171923]">{inv.customer_name}</div>
                          <div class="text-[11px] text-[#183f42] font-mono">{inv.subscription_number || "Direct"}</div>
                        </td>

                        <!-- Billing Period -->
                        <td class="py-3.5 px-4 text-[#717786] text-[11px] font-mono">
                          {inv.billing_period_start} &rarr; {inv.billing_period_end}
                        </td>

                        <!-- Due Date -->
                        <td class="py-3.5 px-4 text-[#717786]">
                          {inv.due_date}
                        </td>

                        <!-- Total Amount -->
                        <td class="py-3.5 px-4 text-right font-bold text-[#171923]">
                          {formatINR(inv.total_amount)}
                        </td>

                        <!-- Paid Amount -->
                        <td class="py-3.5 px-4 text-right font-semibold text-[#16A34A]">
                          {formatINR(inv.paid_amount)}
                        </td>

                        <!-- Balance -->
                        <td class={`py-3.5 px-4 text-right font-semibold ${Number(inv.outstanding_amount) > 0 ? (dispStatus === 'Overdue' ? 'text-[#DC2626]' : 'text-[#D97706]') : 'text-[#717786]'}`}>
                          {formatINR(inv.outstanding_amount)}
                        </td>

                        <!-- Status Badge -->
                        <td class="py-3.5 px-4 text-center">
                          <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyles[dispStatus] || 'bg-zinc-100 text-zinc-700'}`}>
                            {dispStatus}
                          </span>
                        </td>

                        <!-- Actions Dropdown -->
                        <td class="py-3.5 px-4 text-right relative">
                          <button
                            onclick={(e) => toggleDropdown(inv.id, e)}
                            class="h-7 w-7 rounded-md flex items-center justify-center text-[#717786] hover:text-[#171923] hover:bg-zinc-100 transition-colors ml-auto"
                            title="Actions"
                          >
                            <MoreHorizontal class="w-4 h-4" />
                          </button>

                          {#if openDropdownId === inv.id}
                            <div
                              class="absolute right-4 top-10 w-44 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 py-1 text-left text-xs"
                              role="menu"
                              tabindex="-1"
                              onclick={(e) => e.stopPropagation()}
                              onkeydown={(e) => { if (e.key === 'Escape') openDropdownId = null; }}
                            >
                              <button
                                onclick={() => handleOpenDetails(inv)}
                                class="w-full px-3 py-1.5 text-left text-[#171923] hover:bg-[#F8F9FC] flex items-center gap-2"
                              >
                                <FileText class="w-3.5 h-3.5 text-[#717786]" /> View Details
                              </button>

                              {#if inv.status === "draft"}
                                <button
                                  onclick={() => handleConfirmInvoice(inv)}
                                  class="w-full px-3 py-1.5 text-left text-[#183f42] hover:bg-[#F8F9FC] flex items-center gap-2 font-medium"
                                >
                                  <ShieldCheck class="w-3.5 h-3.5 text-[#183f42]" /> Confirm Invoice
                                </button>
                              {/if}

                              {#if inv.status !== "cancelled" && Number(inv.outstanding_amount) > 0}
                                <button
                                  onclick={() => openRecordPaymentModal(inv)}
                                  class="w-full px-3 py-1.5 text-left text-[#183f42] hover:bg-[#e6f4f2] flex items-center gap-2 font-medium"
                                >
                                  <DollarSign class="w-3.5 h-3.5 text-[#183f42]" /> Record Payment
                                </button>
                              {/if}

                              <button
                                onclick={() => handleSendInvoice(inv)}
                                class="w-full px-3 py-1.5 text-left text-[#171923] hover:bg-[#F8F9FC] flex items-center gap-2"
                              >
                                <Send class="w-3.5 h-3.5 text-[#717786]" /> Send Invoice
                              </button>

                              <button
                                onclick={handlePrintInvoice}
                                class="w-full px-3 py-1.5 text-left text-[#171923] hover:bg-[#F8F9FC] flex items-center gap-2"
                              >
                                <Printer class="w-3.5 h-3.5 text-[#717786]" /> Print / PDF
                              </button>

                              {#if inv.status !== "cancelled" && Number(inv.paid_amount) === 0}
                                <div class="border-t border-[#E5E7EB] my-1"></div>
                                <button
                                  onclick={() => promptCancelInvoice(inv)}
                                  class="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <Ban class="w-3.5 h-3.5 text-rose-600" /> Cancel Invoice
                                </button>
                              {/if}
                            </div>
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            </div>

            <!-- PAGINATION -->
            <div class="p-4 border-t border-[#E5E7EB] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#717786]">
              <div class="flex items-center gap-2">
                <span>
                  Showing <strong class="text-[#171923]">{paginatedInvoices.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredInvoices.length)}</strong> of <strong class="text-[#171923]">{filteredInvoices.length}</strong> invoices
                </span>
              </div>

              <div class="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="xs"
                  onclick={() => (currentPage = Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  class="h-7 px-2.5 text-xs border-[#E5E7EB] text-[#717786] gap-1 hover:bg-[#F8F9FC]"
                >
                  <ChevronLeft class="w-3.5 h-3.5" /> Previous
                </Button>

                <span class="px-2 text-xs font-semibold text-[#171923]">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="xs"
                  onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  class="h-7 px-2.5 text-xs border-[#E5E7EB] text-[#717786] gap-1 hover:bg-[#F8F9FC]"
                >
                  Next <ChevronRight class="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card.Root>

      <!-- ============================================================= -->
      <!-- TAB 2: PAYMENTS (Reconciled Payment Records) -->
      <!-- ============================================================= -->
      {:else if activeTab === "payments"}
        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl overflow-hidden">
          <Card.Header class="pb-3 border-b border-[#E5E7EB] flex flex-row items-center justify-between">
            <div>
              <Card.Title class="text-xs font-bold text-[#171923] uppercase tracking-wider">
                Reconciled Inbound Payments
              </Card.Title>
              <Card.Description class="text-xs text-[#717786]">
                All recorded bank transfers, UPI settlements, and credit card payments against invoices.
              </Card.Description>
            </div>
            <Button
              variant="default"
              size="xs"
              onclick={() => openRecordPaymentModal()}
              class="text-xs bg-[#183f42] hover:bg-[#123033] text-white gap-1 font-semibold"
            >
              <DollarSign class="w-3.5 h-3.5" /> Record Payment
            </Button>
          </Card.Header>
          <Card.Content class="p-0">
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left border-collapse">
                <thead class="bg-[#F8F9FC] border-b border-[#E5E7EB] text-[#717786] font-semibold text-[11px]">
                  <tr>
                    <th class="py-3 px-5">Payment Number</th>
                    <th class="py-3 px-4">Invoice #</th>
                    <th class="py-3 px-4">Customer</th>
                    <th class="py-3 px-4">Payment Method</th>
                    <th class="py-3 px-4">Payment Date</th>
                    <th class="py-3 px-4">Reference / UTR</th>
                    <th class="py-3 px-4 text-right">Amount</th>
                    <th class="py-3 px-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E5E7EB]">
                  {#if $paymentsStore.length === 0}
                    <tr>
                      <td colspan="8" class="py-10 text-center text-[#717786]">
                        No payment records found. Record a payment to see settlements here.
                      </td>
                    </tr>
                  {:else}
                    {#each $paymentsStore as p}
                      <tr class="hover:bg-[#F8F9FC]">
                        <td class="py-3.5 px-5 font-mono font-medium text-[#171923]">{p.payment_number}</td>
                        <td class="py-3.5 px-4 font-mono font-semibold text-[#183f42]">
                          <button
                            onclick={() => {
                              const inv = $invoicesStore.find((i) => i.id === p.invoice_id);
                              if (inv) handleOpenDetails(inv);
                            }}
                            class="hover:underline"
                          >
                            {p.invoice_number}
                          </button>
                        </td>
                        <td class="py-3.5 px-4 text-[#171923] font-medium">{p.customer_name}</td>
                        <td class="py-3.5 px-4 capitalize text-[#717786]">
                          {p.payment_method ? p.payment_method.replace('_', ' ') : 'Bank Transfer'}
                        </td>
                        <td class="py-3.5 px-4 text-[#717786]">{p.payment_date}</td>
                        <td class="py-3.5 px-4 font-mono text-[11px] text-[#717786]">{p.reference_number || "—"}</td>
                        <td class="py-3.5 px-4 text-right font-bold text-[#16A34A]">{formatINR(p.amount)}</td>
                        <td class="py-3.5 px-5 text-center">
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {p.status || 'Settled'}
                          </span>
                        </td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card.Root>

      <!-- ============================================================= -->
      <!-- TAB 3: RECURRING BILLING (Subscription Schedules) -->
      <!-- ============================================================= -->
      {:else if activeTab === "recurring"}
        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl overflow-hidden">
          <Card.Header class="pb-3 border-b border-[#E5E7EB] flex flex-row items-center justify-between">
            <div>
              <Card.Title class="text-xs font-bold text-[#171923] uppercase tracking-wider">
                Recurring Billing Process &amp; Schedules
              </Card.Title>
              <Card.Description class="text-xs text-[#717786]">
                Active subscriptions due for scheduled invoice generation with duplicate prevention enforcement.
              </Card.Description>
            </div>
            <Button
              variant="default"
              size="xs"
              onclick={() => openGenerateInvoiceModal()}
              class="text-xs bg-[#183f42] hover:bg-[#123033] text-white gap-1 font-semibold"
            >
              <Plus class="w-3.5 h-3.5" /> Generate Due Invoices
            </Button>
          </Card.Header>
          <Card.Content class="p-0">
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left border-collapse">
                <thead class="bg-[#F8F9FC] border-b border-[#E5E7EB] text-[#717786] font-semibold text-[11px]">
                  <tr>
                    <th class="py-3 px-5">Subscription #</th>
                    <th class="py-3 px-4">Customer</th>
                    <th class="py-3 px-4">Plan &amp; Frequency</th>
                    <th class="py-3 px-4">Next Billing Date</th>
                    <th class="py-3 px-4 text-right">Cycle Amount</th>
                    <th class="py-3 px-4 text-center">Current Period Status</th>
                    <th class="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E5E7EB]">
                  {#if activeSubscriptions.length === 0}
                    <tr>
                      <td colspan="7" class="py-10 text-center text-[#717786]">
                        No active subscriptions currently scheduled for billing.
                      </td>
                    </tr>
                  {:else}
                    {#each activeSubscriptions as sub}
                      {@const isBilled = isSubscriptionBilledForPeriod(sub)}
                      {@const cust = $customersStore.find((c) => c.id === sub.customer_id)}
                      <tr class="hover:bg-[#F8F9FC]">
                        <td class="py-3.5 px-5 font-mono font-semibold text-[#183f42]">
                          {sub.subscription_number}
                        </td>
                        <td class="py-3.5 px-4 font-bold text-[#171923]">
                          {cust ? cust.company || cust.name : "Enterprise Account"}
                        </td>
                        <td class="py-3.5 px-4">
                          <div class="text-[#171923] font-medium">{sub.plan_name}</div>
                          <div class="text-[11px] text-[#717786] capitalize">Billed {sub.billing_frequency}</div>
                        </td>
                        <td class="py-3.5 px-4 text-[#717786] font-mono">
                          <span class="inline-flex items-center gap-1">
                            <Calendar class="w-3 h-3 text-[#183f42]" />
                            {sub.next_billing_date || "Immediate"}
                          </span>
                        </td>
                        <td class="py-3.5 px-4 text-right font-bold text-[#171923]">
                          {formatINR(sub.total_amount)}
                        </td>
                        <td class="py-3.5 px-4 text-center">
                          {#if isBilled}
                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check class="w-3 h-3 text-emerald-600" /> Billed for Cycle
                            </span>
                          {:else}
                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <CalendarClock class="w-3 h-3 text-blue-600" /> Due for Billing
                            </span>
                          {/if}
                        </td>
                        <td class="py-3.5 px-5 text-right">
                          <Button
                            size="xs"
                            disabled={isBilled}
                            onclick={() => handleDirectGenerateForSub(sub)}
                            class={`h-7 text-xs font-semibold px-2.5 rounded-lg ${
                              isBilled
                                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border-zinc-200'
                                : 'bg-[#183f42] hover:bg-[#123033] text-white shadow-xs'
                            }`}
                          >
                            {isBilled ? 'Invoice Issued' : 'Generate Invoice'}
                          </Button>
                        </td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card.Root>

      <!-- ============================================================= -->
      <!-- TAB 4: TRANSACTIONS (Financial Payment Transactions) -->
      <!-- ============================================================= -->
      {:else if activeTab === "transactions"}
        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl overflow-hidden">
          <Card.Header class="pb-3 border-b border-[#E5E7EB]">
            <Card.Title class="text-xs font-bold text-[#171923] uppercase tracking-wider">
              Recorded Financial Transactions
            </Card.Title>
            <Card.Description class="text-xs text-[#717786]">
              Real-time payment transactions derived from recorded payments.
            </Card.Description>
          </Card.Header>
          <Card.Content class="p-0">
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left border-collapse">
                <thead class="bg-[#F8F9FC] border-b border-[#E5E7EB] text-[#717786] font-semibold text-[11px]">
                  <tr>
                    <th class="py-3 px-5">Transaction Ref</th>
                    <th class="py-3 px-4">Invoice #</th>
                    <th class="py-3 px-4">Customer</th>
                    <th class="py-3 px-4">Payment Method</th>
                    <th class="py-3 px-4">Timestamp</th>
                    <th class="py-3 px-4">External Reference</th>
                    <th class="py-3 px-4 text-right">Settled Amount</th>
                    <th class="py-3 px-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E5E7EB]">
                  {#if $paymentsStore.length === 0}
                    <tr>
                      <td colspan="8" class="py-10 text-center text-[#717786]">
                        No financial transactions recorded yet.
                      </td>
                    </tr>
                  {:else}
                    {#each $paymentsStore as tx}
                      <tr class="hover:bg-[#F8F9FC]">
                        <td class="py-3.5 px-5 font-mono font-medium text-[#171923]">{tx.payment_number}</td>
                        <td class="py-3.5 px-4 font-mono font-semibold text-[#183f42]">{tx.invoice_number}</td>
                        <td class="py-3.5 px-4 text-[#171923] font-medium">{tx.customer_name}</td>
                        <td class="py-3.5 px-4 capitalize text-[#717786]">
                          {tx.payment_method ? tx.payment_method.replace('_', ' ') : 'Bank Transfer'}
                        </td>
                        <td class="py-3.5 px-4 text-[#717786]">{tx.created_at || tx.payment_date}</td>
                        <td class="py-3.5 px-4 font-mono text-[11px] text-[#717786]">{tx.reference_number || "—"}</td>
                        <td class="py-3.5 px-4 text-right font-bold text-[#16A34A]">{formatINR(tx.amount)}</td>
                        <td class="py-3.5 px-5 text-center">
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Settled
                          </span>
                        </td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card.Root>
      {/if}
    </div>
  {/if}
</AppShell>

<!-- ============================================================= -->
<!-- MODAL 1: GENERATE INVOICE DIALOG -->
<!-- ============================================================= -->
{#if isGenerateModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
    <div class="bg-white border border-[#E5E7EB] rounded-xl shadow-xl max-w-md w-full overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h3 class="font-bold text-[#171923] text-sm">Generate Recurring Invoice</h3>
          <p class="text-[#717786] text-[11px] mt-0.5">Generates invoice with line items snapshot from active subscription.</p>
        </div>
        <button onclick={() => (isGenerateModalOpen = false)} class="text-[#717786] hover:text-[#171923]">
          <X class="w-4 h-4" />
        </button>
      </div>

      {#if genError}
        <div class="m-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
          <span>{genError}</span>
        </div>
      {/if}

      <form onsubmit={submitGenerateInvoice} class="p-4 space-y-3.5">
        <div class="space-y-1">
          <label for="sub-select" class="font-medium text-[#171923]">Select Active Subscription *</label>
          <select
            id="sub-select"
            bind:value={genSubId}
            required
            class="w-full h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2.5 text-[#171923] outline-none focus:border-[#183f42]"
          >
            {#each activeSubscriptions as s}
              {@const cust = $customersStore.find((c) => c.id === s.customer_id)}
              <option value={s.id}>
                {s.subscription_number} - {cust ? cust.company || cust.name : 'Customer'} ({formatINR(s.total_amount)} / {s.billing_frequency})
              </option>
            {/each}
          </select>
        </div>

        <div class="space-y-1">
          <label for="gen-period-start" class="font-medium text-[#171923]">Billing Period Start (Unique Key) *</label>
          <Input
            id="gen-period-start"
            type="date"
            bind:value={genPeriodStart}
            required
            class="h-8 text-xs"
          />
          <p class="text-[10px] text-[#717786]">
            Enforces PostgreSQL idempotency constraint <code>(subscription_id, billing_period_start)</code>.
          </p>
        </div>

        <div class="space-y-1">
          <label for="gen-notes" class="font-medium text-[#171923]">Invoice Memo / Notes</label>
          <Input
            id="gen-notes"
            type="text"
            placeholder="e.g. Scheduled automated recurring cycle"
            bind:value={genNotes}
            class="h-8 text-xs"
          />
        </div>

        <div class="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
          <Button variant="outline" size="xs" onclick={() => (isGenerateModalOpen = false)}>
            Cancel
          </Button>
          <Button type="submit" size="xs" class="bg-[#183f42] hover:bg-[#123033] text-white font-semibold shadow-xs">
            Generate &amp; Issue Invoice
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- ============================================================= -->
<!-- MODAL 2: RECORD PAYMENT DIALOG -->
<!-- ============================================================= -->
{#if isRecordPaymentModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
    <div class="bg-white border border-[#E5E7EB] rounded-xl shadow-xl max-w-md w-full overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h3 class="font-bold text-[#171923] text-sm">Record Inbound Payment</h3>
          <p class="text-[#717786] text-[11px] mt-0.5">Apply full or partial payment towards an outstanding invoice.</p>
        </div>
        <button onclick={() => (isRecordPaymentModalOpen = false)} class="text-[#717786] hover:text-[#171923]">
          <X class="w-4 h-4" />
        </button>
      </div>

      {#if paymentError}
        <div class="m-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
          <span>{paymentError}</span>
        </div>
      {/if}

      <form onsubmit={submitRecordPayment} class="p-4 space-y-3.5">
        <div class="space-y-1">
          <label for="inv-target" class="font-medium text-[#171923]">Target Invoice *</label>
          <select
            id="inv-target"
            bind:value={paymentTargetInvoiceId}
            onchange={(e) => {
              const selected = $invoicesStore.find((i) => i.id === e.target.value);
              if (selected) paymentAmount = String(selected.outstanding_amount);
            }}
            required
            class="w-full h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2.5 text-[#171923] outline-none focus:border-[#183f42]"
          >
            {#each $invoicesStore.filter((i) => Number(i.outstanding_amount) > 0 && i.status !== 'cancelled') as inv}
              <option value={inv.id}>
                {inv.invoice_number} - {inv.customer_name} (Due: {formatINR(inv.outstanding_amount)})
              </option>
            {/each}
          </select>
        </div>

        <div class="space-y-1">
          <label for="pay-amt" class="font-medium text-[#171923]">Payment Amount (INR - ₹) *</label>
          <Input
            id="pay-amt"
            type="number"
            step="0.01"
            min="0.01"
            bind:value={paymentAmount}
            required
            class="h-8 text-xs"
          />
          <p class="text-[10px] text-[#717786]">
            Supports multiple partial payments. Amount cannot exceed outstanding balance.
          </p>
        </div>

        <div class="space-y-1">
          <label for="pay-method" class="font-medium text-[#171923]">Payment Rail / Method *</label>
          <select
            id="pay-method"
            bind:value={paymentMethod}
            required
            class="w-full h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2.5 text-[#171923] outline-none focus:border-[#183f42]"
          >
            <option value="bank_transfer">Bank Transfer (NEFT / RTGS)</option>
            <option value="upi">UPI Instant Transfer</option>
            <option value="credit_card">Corporate Credit Card</option>
            <option value="debit_card">Debit Card</option>
            <option value="cash">Cash Settlement</option>
            <option value="cheque">Bank Cheque</option>
            <option value="other">Other Banking Rail</option>
          </select>
        </div>

        <div class="space-y-1">
          <label for="pay-ref" class="font-medium text-[#171923]">Bank Reference / UTR Number</label>
          <Input
            id="pay-ref"
            type="text"
            placeholder="e.g. UTR-98210499210"
            bind:value={paymentRef}
            class="h-8 text-xs font-mono"
          />
        </div>

        <div class="space-y-1">
          <label for="pay-notes" class="font-medium text-[#171923]">Notes / Remarks</label>
          <Input
            id="pay-notes"
            type="text"
            placeholder="e.g. Verified against bank statement"
            bind:value={paymentNote}
            class="h-8 text-xs"
          />
        </div>

        <div class="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
          <Button variant="outline" size="xs" onclick={() => (isRecordPaymentModalOpen = false)}>
            Cancel
          </Button>
          <Button type="submit" size="xs" class="bg-[#183f42] hover:bg-[#123033] text-white font-semibold shadow-xs">
            Confirm &amp; Record Payment
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- ============================================================= -->
<!-- MODAL 3: CANCEL INVOICE CONFIRMATION DIALOG -->
<!-- ============================================================= -->
{#if isCancelConfirmModalOpen && invoiceToCancel}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
    <div class="bg-white border border-[#E5E7EB] rounded-xl shadow-xl max-w-md w-full overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="p-4 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <AlertTriangle class="w-4 h-4 text-rose-600" />
          <h3 class="font-bold text-rose-900 text-sm">Cancel Invoice Confirmation</h3>
        </div>
        <button onclick={() => (isCancelConfirmModalOpen = false)} class="text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="p-4 space-y-3">
        <p class="text-zinc-700">
          Are you sure you want to cancel invoice <strong class="font-mono text-zinc-900">{invoiceToCancel.invoice_number}</strong>
          issued to <strong class="text-zinc-900">{invoiceToCancel.customer_name}</strong> for {formatINR(invoiceToCancel.total_amount)}?
        </p>

        <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
          <div class="font-semibold flex items-center gap-1.5">
            <AlertCircle class="w-3.5 h-3.5 text-amber-700" /> Business Rule Enforcement:
          </div>
          <p>
            Cancelled invoices are excluded from outstanding receivables. The billing period remains preserved for audit history.
          </p>
        </div>

        <div class="space-y-1">
          <label for="cancel-reason" class="font-medium text-zinc-800">Reason for Cancellation *</label>
          <Input
            id="cancel-reason"
            type="text"
            bind:value={cancelReason}
            required
            class="h-8 text-xs"
          />
        </div>
      </div>

      <div class="p-4 bg-zinc-50 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
        <Button variant="outline" size="xs" onclick={() => (isCancelConfirmModalOpen = false)}>
          Keep Invoice
        </Button>
        <Button
          size="xs"
          onclick={executeCancelInvoice}
          class="bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
        >
          Confirm Cancellation
        </Button>
      </div>
    </div>
  </div>
{/if}
