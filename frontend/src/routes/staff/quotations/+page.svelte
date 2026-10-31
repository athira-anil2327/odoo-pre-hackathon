<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import {
    quotationsStore,
    templatesStore,
    customersStore,
    plansStore,
    productsStore,
    createQuotationFromTemplate,
    sendQuotation,
    addDays
  } from "$lib/stores/coreManagement.js";
  import {
    Plus,
    Search,
    FileText,
    Send,
    Eye,
    X,
    Check,
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    Building2,
    Layers,
    Clock,
    Repeat,
    Package,
    Trash2,
    DollarSign,
    Percent,
    Sparkles,
    Calendar,
    ArrowRight
  } from "lucide-svelte";

  // Search and filter state
  let searchQuery = $state("");
  let statusFilter = $state("all"); // "all" | "draft" | "quotation" | "confirmed" | "cancelled"

  // Modals state
  let showCreateModal = $state(false);
  let showViewQuoteModal = $state(false);
  let selectedQuote = $state(null);

  // User notifications
  let actionError = $state("");
  let actionSuccess = $state("");

  // =========================================================================
  // 10-STEP QUOTATION PROPOSAL BUILDER STATE
  // =========================================================================
  let selectedCustomerId = $state("");
  let selectedTemplateId = $state("");
  let quotePlanId = $state("");
  let quoteValidUntil = $state("");
  let quoteDiscountType = $state("percentage"); // "percentage" | "fixed"
  let quoteDiscountValue = $state(0);
  let quoteLines = $state([]);

  // Step 3: Load template's plan and products
  function loadTemplateIntoQuote(tmplId) {
    selectedTemplateId = tmplId;
    const tmpl = ($templatesStore || []).find(t => t.id === tmplId);
    if (!tmpl) return;

    quotePlanId = tmpl.plan_id;
    const today = new Date().toISOString().split("T")[0];
    // Step 8 pre-fill: Set quotation validity based on template
    quoteValidUntil = addDays(today, Number(tmpl.validity_days) || 30);

    // Populate editable quote lines from template products
    quoteLines = (tmpl.lines || []).filter(Boolean).map(l => {
      const prod = ($productsStore || []).find(p => p.id === l.product_id);
      const v = prod?.variants?.find(vr => vr.id === l.variant_id);
      return {
        product_id: l.product_id,
        product_name: l.product_name || prod?.name || "Product",
        variant_id: l.variant_id || "",
        variant_name: l.variant_name || (v ? `${v.attribute_name}: ${v.attribute_value}` : "None"),
        quantity: Number(l.quantity) || 1,
        unit_price: Number(l.unit_price) || Number(prod?.sales_price) || 0,
        price_extra: Number(l.price_extra || l.variant_price_extra || v?.price_extra) || 0
      };
    });

    if (quoteLines.length === 0 && $productsStore && $productsStore.length > 0) {
      handleAddQuoteLine();
    }
  }

  // Open the create modal with pre-loaded default template & customer
  function handleOpenCreateModal(preselectedTmplId = null) {
    actionError = "";
    actionSuccess = "";

    // Step 1 default: Customer selection
    if ($customersStore && $customersStore.length > 0) {
      selectedCustomerId = $customersStore[0].id;
    }

    // Step 2 & 3 default: Select template & load its lines
    const tmplId = preselectedTmplId || ($templatesStore && $templatesStore.length > 0 ? $templatesStore[0].id : "");
    loadTemplateIntoQuote(tmplId);
    quoteDiscountValue = 0;
    showCreateModal = true;
  }

  // Step 6: Add product line
  function handleAddQuoteLine() {
    const prod = $productsStore && $productsStore.length > 0 ? $productsStore[0] : null;
    const v = prod?.variants?.length > 0 ? prod.variants[0] : null;

    quoteLines = [
      ...quoteLines,
      {
        product_id: prod ? prod.id : "",
        product_name: prod ? prod.name : "Product",
        variant_id: v ? v.id : "",
        variant_name: v ? `${v.attribute_name}: ${v.attribute_value}` : "None",
        quantity: 1,
        unit_price: prod ? Number(prod.sales_price || 0) : 0,
        price_extra: v ? Number(v.price_extra || 0) : 0
      }
    ];
  }

  // Step 6: Remove product line
  function handleRemoveQuoteLine(index) {
    if (quoteLines.length > 1) {
      quoteLines = quoteLines.filter((_, i) => i !== index);
    } else {
      actionError = "A quotation must have at least one product line.";
    }
  }

  // Step 6: Product catalogue selection change
  function handleQuoteProductChange(index, productId) {
    if (!quoteLines[index]) return;
    const prod = ($productsStore || []).find(p => p.id === productId);
    if (!prod) return;

    quoteLines[index].product_id = prod.id;
    quoteLines[index].product_name = prod.name;
    quoteLines[index].unit_price = Number(prod.sales_price || 0);

    if (prod.variants && prod.variants.length > 0) {
      const v = prod.variants[0];
      quoteLines[index].variant_id = v.id;
      quoteLines[index].variant_name = `${v.attribute_name}: ${v.attribute_value}`;
      quoteLines[index].price_extra = Number(v.price_extra || 0);
    } else {
      quoteLines[index].variant_id = "";
      quoteLines[index].variant_name = "None";
      quoteLines[index].price_extra = 0;
    }
  }

  // Step 5: Select or change product variants
  function handleQuoteVariantChange(index, variantId) {
    if (!quoteLines[index]) return;
    const line = quoteLines[index];
    const prod = ($productsStore || []).find(p => p.id === line.product_id);
    if (!prod) return;

    if (!variantId) {
      line.variant_id = "";
      line.variant_name = "None";
      line.price_extra = 0;
      return;
    }

    const v = prod.variants?.find(vr => vr.id === variantId);
    if (v) {
      line.variant_id = v.id;
      line.variant_name = `${v.attribute_name}: ${v.attribute_value}`;
      line.price_extra = Number(v.price_extra || 0);
    }
  }

  // Step 7: Live calculation of prices, discounts and taxes
  const quoteSubtotal = $derived(
    (quoteLines || []).reduce((acc, l) => {
      if (!l) return acc;
      const eff = (Number(l.unit_price) || 0) + (Number(l.price_extra) || 0);
      return acc + (Number(l.quantity) || 1) * eff;
    }, 0)
  );

  const quoteDiscountAmount = $derived.by(() => {
    const val = Number(quoteDiscountValue) || 0;
    if (val <= 0) return 0;
    if (quoteDiscountType === "percentage") {
      return (quoteSubtotal * (val / 100));
    }
    return Math.min(quoteSubtotal, val);
  });

  const requiresApproval = $derived(
    quoteDiscountType === "percentage"
      ? Number(quoteDiscountValue) > 15
      : quoteDiscountAmount > quoteSubtotal * 0.15
  );

  const quoteTaxableBase = $derived(Math.max(0, quoteSubtotal - quoteDiscountAmount));
  const quoteTaxAmount = $derived(quoteTaxableBase * 0.18);
  const quoteTotalAmount = $derived(quoteTaxableBase + quoteTaxAmount);

  const activeCustomer = $derived(
    ($customersStore || []).find(c => c.id === selectedCustomerId || c.customer_number === selectedCustomerId)
  );

  const activeTemplate = $derived(
    ($templatesStore || []).find(t => t.id === selectedTemplateId)
  );

  const activePlan = $derived(
    ($plansStore || []).find(pl => pl.id === (activeTemplate?.plan_id || quotePlanId)) || null
  );

  // Step 9 & 10: Save Draft or Send Quotation
  function handleSaveQuoteAction(statusToSet = "Draft") {
    actionError = "";
    if (!selectedCustomerId) {
      actionError = "Please select a target customer.";
      return;
    }
    if (!selectedTemplateId) {
      actionError = "Please select a quotation template.";
      return;
    }
    if (quoteLines.length === 0) {
      actionError = "Please add at least one product line.";
      return;
    }
    if (!quoteValidUntil) {
      actionError = "Please specify a quotation validity date.";
      return;
    }

    // Validate that all lines have a product selected
    for (let i = 0; i < quoteLines.length; i++) {
      if (!quoteLines[i].product_id) {
        actionError = `Please select a product for Line ${i + 1}.`;
        return;
      }
    }

    try {
      const q = createQuotationFromTemplate(
        selectedTemplateId,
        selectedCustomerId,
        quoteLines,
        {
          validUntil: quoteValidUntil,
          discountAmount: quoteDiscountAmount,
          status: statusToSet
        }
      );

      actionSuccess = statusToSet === "Quotation"
        ? `Quotation ${q.quote_number || q.id} successfully created and dispatched to ${activeCustomer?.name || 'customer'}! Status: Quotation (Sent).`
        : `Quotation ${q.quote_number || q.id} saved as Draft.`;

      showCreateModal = false;
    } catch (e) {
      actionError = e.message || "Failed to create quotation.";
    }
  }

  // Lifecycle action from table: Send existing draft quote
  function handleSendExistingQuote(quoteId) {
    actionError = "";
    try {
      sendQuotation(quoteId);
      actionSuccess = `Quotation marked as Sent to customer. Status updated to 'Quotation'.`;
    } catch (e) {
      actionError = e.message || "Failed to send quotation.";
    }
  }

  function handleViewQuote(quote) {
    selectedQuote = quote;
    showViewQuoteModal = true;
  }

  // Filtering quotations
  const filteredQuotations = $derived(
    ($quotationsStore || []).filter(q => {
      if (!q) return false;
      const statusLower = String(q.status || "").toLowerCase();

      // Status filter tab
      if (statusFilter !== "all") {
        if (statusFilter === "draft" && statusLower !== "draft") return false;
        if (statusFilter === "quotation" && statusLower !== "quotation" && statusLower !== "sent") return false;
        if (statusFilter === "confirmed" && statusLower !== "confirmed" && statusLower !== "accepted") return false;
        if (statusFilter === "cancelled" && statusLower !== "cancelled") return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const term = searchQuery.toLowerCase();
      const quoteNum = String(q.quote_number || q.quotation_number || q.id || "").toLowerCase();
      const custName = String(q.customer_name || "").toLowerCase();
      const custCompany = String(q.customer_company || "").toLowerCase();
      const planName = String(q.plan_name || "").toLowerCase();

      return (
        quoteNum.includes(term) ||
        custName.includes(term) ||
        custCompany.includes(term) ||
        planName.includes(term)
      );
    })
  );

  function getCustomerLabel(customerId, q = null) {
    if (q && q.customer_name) {
      return `${q.customer_name}${q.customer_company ? ` (${q.customer_company})` : ""}`;
    }
    if (!customerId) return "—";
    const c = ($customersStore || []).find(cust => cust.id === customerId || cust.customer_number === customerId);
    return c ? `${c.name} (${c.company})` : customerId;
  }

  function getPlanLabel(planId, q = null) {
    if (q && q.plan_name) return q.plan_name;
    if (!planId) return "—";
    const p = ($plansStore || []).find(pl => pl.id === planId);
    return p ? p.name : planId;
  }

  function formatDate(val) {
    if (!val) return "—";
    if (typeof val === "string" && val.includes("T")) {
      return val.split("T")[0];
    }
    return String(val);
  }

  function getStatusBadgeClass(status) {
    const s = String(status || "").toLowerCase();
    if (s === "draft") return "bg-zinc-100 text-zinc-700 border-zinc-200";
    if (s === "quotation" || s === "sent") return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (s === "confirmed" || s === "accepted") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "cancelled") return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
</script>

<AppShell title="Quotations & Proposals">
  <div class="space-y-6">
    <!-- Header with Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#edf2f3] gap-4">
      <div>
        <h2 class="text-base font-bold text-[#122b2e] tracking-tight">Staff Quotation Pipeline</h2>
        <p class="text-xs text-[#7e9599] mt-0.5">
          Select customer &amp; template, configure line items &amp; variants, apply volume discounts, and dispatch quotes.
        </p>
      </div>

      <Button
        onclick={() => handleOpenCreateModal()}
        size="sm"
        class="bg-[#183f42] hover:bg-[#123033] text-white rounded-xl shadow-xs text-xs h-9 px-4 font-semibold gap-1.5"
      >
        <Plus class="w-3.5 h-3.5" /> Create Quotation from Template
      </Button>
    </div>

    <!-- Alert Notifications -->
    {#if actionSuccess}
      <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
        <div class="flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
        <button onclick={() => (actionSuccess = "")} class="text-emerald-600 hover:text-emerald-800">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    {/if}

    {#if actionError}
      <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
        <div class="flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
        <button onclick={() => (actionError = "")} class="text-rose-600 hover:text-rose-800">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    {/if}

    <!-- Quotations Table Card -->
    <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl overflow-hidden">
      <!-- Toolbar: Search & Status Filters -->
      <div class="p-4 border-b border-[#edf2f3] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#fbfdfd]">
        <div class="relative w-full md:w-80">
          <Search class="w-3.5 h-3.5 text-[#7e9599] absolute left-3 top-2.5" />
          <Input
            type="text"
            placeholder="Search by quote #, customer, or plan..."
            bind:value={searchQuery}
            class="h-8 pl-9 text-xs bg-white border-[#e5ecee] rounded-xl focus:border-[#183f42]"
          />
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto text-xs">
          {#each [
            { id: "all", label: "All" },
            { id: "draft", label: "Drafts" },
            { id: "quotation", label: "Sent / Quotation" },
            { id: "confirmed", label: "Confirmed" }
          ] as f}
            <button
              onclick={() => (statusFilter = f.id)}
              class={`px-3 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === f.id
                  ? "bg-[#183f42] text-white shadow-xs"
                  : "bg-white text-[#586f73] hover:text-[#122b2e] border border-[#e5ecee]"
              }`}
            >
              {f.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- Table Body -->
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left">
          <thead class="bg-[#f8fafb] text-[#7e9599] font-semibold border-b border-[#edf2f3]">
            <tr>
              <th class="py-3 px-4">Quote Number</th>
              <th class="py-3 px-4">Customer Account</th>
              <th class="py-3 px-4">Associated Plan</th>
              <th class="py-3 px-4 text-center">Lines</th>
              <th class="py-3 px-4 text-right">Discount</th>
              <th class="py-3 px-4 text-right">Total Amount</th>
              <th class="py-3 px-4">Valid Until</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#edf2f3]">
            {#if filteredQuotations.length === 0}
              <tr>
                <td colspan="9" class="py-12 text-center text-[#7e9599]">
                  <FileText class="w-8 h-8 mx-auto text-[#b0c0c2] mb-2" />
                  <p class="font-medium text-[#122b2e]">No quotations found</p>
                  <p class="text-[11px] mt-0.5">Create a proposal using one of the available templates.</p>
                </td>
              </tr>
            {:else}
              {#each filteredQuotations as quote}
                {@const statusLower = String(quote.status || "").toLowerCase()}
                {@const isDraft = statusLower === "draft"}
                <tr class="hover:bg-[#fbfdfd] transition-colors">
                  <td class="py-3.5 px-4 font-mono font-bold text-[#183f42]">
                    {quote.quote_number || quote.quotation_number || quote.id}
                  </td>
                  <td class="py-3.5 px-4 font-medium text-[#122b2e]">
                    {getCustomerLabel(quote.customer_id, quote)}
                  </td>
                  <td class="py-3.5 px-4 text-[#586f73]">
                    {getPlanLabel(quote.plan_id, quote)}
                  </td>
                  <td class="py-3.5 px-4 text-center text-[#7e9599]">
                    {(quote.lines || []).length}
                  </td>
                  <td class="py-3.5 px-4 text-right text-[#586f73]">
                    {Number(quote.discount_amount || 0) > 0 ? `-$${Number(quote.discount_amount).toFixed(2)}` : "—"}
                  </td>
                  <td class="py-3.5 px-4 text-right font-extrabold text-[#122b2e]">
                    ${Number(quote.total_amount || 0).toFixed(2)}
                  </td>
                  <td class="py-3.5 px-4 text-[#7e9599]">
                    {formatDate(quote.valid_until)}
                  </td>
                  <td class="py-3.5 px-4">
                    <span class={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadgeClass(quote.status)}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        onclick={() => handleViewQuote(quote)}
                        class="p-1.5 rounded-lg text-[#7e9599] hover:text-[#183f42] hover:bg-[#e6f4f2] transition-colors"
                        title="View Proposal Details"
                      >
                        <Eye class="w-3.5 h-3.5" />
                      </button>

                      {#if isDraft}
                        <button
                          onclick={() => handleSendExistingQuote(quote.id)}
                          class="p-1.5 rounded-lg text-[#7e9599] hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                          title="Send to Customer"
                        >
                          <Send class="w-3.5 h-3.5" />
                        </button>
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

    <!-- ========================================================================= -->
    <!-- 10-STEP PROPOSAL BUILDER MODAL (CREATE QUOTATION FROM TEMPLATE)           -->
    <!-- ========================================================================= -->
    {#if showCreateModal}
      <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full p-6 text-xs animate-in fade-in zoom-in-95 duration-150 my-6">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-[#edf2f3] mb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-[#e6f4f2] text-[#183f42] flex items-center justify-center shadow-xs">
                <FileText class="w-4 h-4" />
              </div>
              <div>
                <h3 class="font-bold text-[#122b2e] text-sm">Create Quotation from Template</h3>
                <p class="text-[11px] text-[#7e9599]">Step-by-step proposal generator with variants, live pricing, discounts &amp; tax calculations.</p>
              </div>
            </div>
            <button onclick={() => (showCreateModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            
            <!-- Step 1 & 2: Select Customer & Select Quotation Template -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#f8fafb] border border-[#e5ecee] rounded-xl">
              <div>
                <Label for="staff-q-cust" class="font-semibold text-[#122b2e] flex items-center gap-1.5">
                  <Building2 class="w-3.5 h-3.5 text-[#183f42]" /> 1. Select Customer *
                </Label>
                <select
                  id="staff-q-cust"
                  bind:value={selectedCustomerId}
                  class="w-full h-9 bg-white border border-[#e5ecee] rounded-xl px-2.5 mt-1 text-xs focus:border-[#183f42]"
                >
                  {#each ($customersStore || []) as c}
                    <option value={c.id}>{c.name} — {c.company}</option>
                  {/each}
                </select>
                {#if activeCustomer}
                  <div class="text-[10px] text-[#7e9599] mt-1">
                    ID: <b>{activeCustomer.customer_number || activeCustomer.id}</b> • {activeCustomer.email}
                  </div>
                {/if}
              </div>

              <div>
                <Label for="staff-q-tmpl" class="font-semibold text-[#122b2e] flex items-center gap-1.5">
                  <Layers class="w-3.5 h-3.5 text-[#183f42]" /> 2. Select Quotation Template *
                </Label>
                <select
                  id="staff-q-tmpl"
                  value={selectedTemplateId}
                  onchange={(e) => loadTemplateIntoQuote(e.target.value)}
                  class="w-full h-9 bg-white border border-[#e5ecee] rounded-xl px-2.5 mt-1 text-xs focus:border-[#183f42]"
                >
                  {#each ($templatesStore || []) as t}
                    <option value={t.id}>{t.name} ({t.validity_days || 30} Days Validity)</option>
                  {/each}
                </select>
                {#if activePlan}
                  <div class="text-[10px] text-[#183f42] font-semibold mt-1 flex items-center gap-1">
                    <Repeat class="w-3 h-3" />
                    Plan: <b>{activePlan.name}</b> ({activePlan.billing_frequency} • Min Qty: {activePlan.min_quantity})
                  </div>
                {/if}
              </div>
            </div>

            <!-- Step 8: Set Quotation Validity -->
            <div class="p-3 bg-[#f8fafb] border border-[#e5ecee] rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div>
                <Label for="staff-q-validity" class="font-semibold text-[#122b2e] flex items-center gap-1.5">
                  <Clock class="w-3.5 h-3.5 text-[#183f42]" /> 3. Set Quotation Validity *
                </Label>
                <p class="text-[10px] text-[#7e9599] mt-0.5">Pre-filled with template validity duration. Adjust if necessary.</p>
              </div>
              <div>
                <Input
                  id="staff-q-validity"
                  type="date"
                  bind:value={quoteValidUntil}
                  class="h-9 text-xs bg-white border-[#e5ecee] rounded-xl w-44 focus:border-[#183f42]"
                />
              </div>
            </div>

            <!-- Step 3, 4, 5 & 6: Products, Quantities, Variants & Add/Remove Lines -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider">
                  4. Template Products, Quantities &amp; Variants
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onclick={handleAddQuoteLine}
                  class="rounded-xl h-7 text-[11px] border-[#183f42] text-[#183f42] hover:bg-[#e6f4f2] gap-1 font-semibold"
                >
                  <Plus class="w-3 h-3" /> Add Product Line
                </Button>
              </div>

              <div class="space-y-2.5">
                {#each (quoteLines || []) as line, idx}
                  {@const prod = ($productsStore || []).find(p => p.id === line.product_id)}
                  {@const hasVariants = prod && prod.variants && prod.variants.length > 0}
                  {@const effUnitPrice = (Number(line.unit_price) || 0) + (Number(line.price_extra) || 0)}
                  {@const lineTotal = (Number(line.quantity) || 1) * effUnitPrice}

                  <div class="p-3.5 bg-white border border-[#edf2f3] shadow-xs rounded-xl space-y-2.5 relative">
                    <div class="flex items-center justify-between pb-1.5 border-b border-[#f4f7f8]">
                      <span class="font-bold text-[#122b2e] text-[11px] flex items-center gap-1.5">
                        <Package class="w-3.5 h-3.5 text-[#183f42]" /> Line {idx + 1}
                      </span>
                      {#if quoteLines.length > 1}
                        <button
                          type="button"
                          onclick={() => handleRemoveQuoteLine(idx)}
                          class="text-zinc-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                          title="Remove Line"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                      {/if}
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <!-- Step 6: Select Product from Catalog -->
                      <div>
                        <Label class="text-[11px] font-semibold text-[#122b2e]">Product *</Label>
                        <select
                          value={line.product_id}
                          onchange={(e) => handleQuoteProductChange(idx, e.target.value)}
                          class="w-full h-8 bg-[#f8fafb] border border-[#e5ecee] rounded-lg px-2 mt-1 text-xs focus:border-[#183f42]"
                        >
                          {#each ($productsStore || []) as p}
                            <option value={p.id}>{p.name} (${Number(p.sales_price || 0).toFixed(2)})</option>
                          {/each}
                        </select>
                      </div>

                      <!-- Step 5: Select or Change Product Variants -->
                      <div>
                        <Label class="text-[11px] font-semibold text-[#122b2e]">Product Variant &amp; Surcharge</Label>
                        {#if hasVariants}
                          <select
                            value={line.variant_id}
                            onchange={(e) => handleQuoteVariantChange(idx, e.target.value)}
                            class="w-full h-8 bg-[#f8fafb] border border-[#e5ecee] rounded-lg px-2 mt-1 text-xs focus:border-[#183f42]"
                          >
                            <option value="">No Variant / Base ($0.00)</option>
                            {#each prod.variants as v}
                              <option value={v.id}>
                                {v.attribute_name}: {v.attribute_value} (+${Number(v.price_extra || 0).toFixed(2)})
                              </option>
                            {/each}
                          </select>
                        {:else}
                          <div class="h-8 bg-[#f8fafb] border border-[#edf2f3] rounded-lg px-2.5 mt-1 flex items-center text-[10px] text-[#7e9599]">
                            Standard product (No variants configured)
                          </div>
                        {/if}
                      </div>
                    </div>

                    <!-- Step 4: Modify Quantities & Pricing Overrides -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <div>
                        <Label class="text-[11px] font-semibold text-[#122b2e]">Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          bind:value={line.quantity}
                          class="h-8 text-xs mt-1 bg-[#f8fafb] border-[#e5ecee] rounded-lg focus:border-[#183f42]"
                        />
                      </div>

                      <div>
                        <div class="flex items-center justify-between">
                          <Label class="text-[11px] font-semibold text-[#122b2e]">Unit Price ($)</Label>
                          <span class="text-[9px] text-[#7e9599]">Base: ${Number(prod?.sales_price || 0).toFixed(2)}</span>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          bind:value={line.unit_price}
                          class="h-8 text-xs mt-1 bg-[#f8fafb] border-[#e5ecee] rounded-lg focus:border-[#183f42]"
                        />
                      </div>

                      <div class="p-2 bg-[#f8fafb] border border-[#e5ecee] rounded-lg text-right">
                        <span class="text-[10px] text-[#7e9599] block">
                          Effective: ${effUnitPrice.toFixed(2)}
                          {#if line.price_extra > 0}
                            <span class="text-teal-700 font-semibold">(+${Number(line.price_extra).toFixed(2)})</span>
                          {/if}
                        </span>
                        <span class="font-extrabold text-[#183f42] text-xs">
                          Line Subtotal: ${lineTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Step 7: Calculate Prices, Discounts and Taxes -->
            <div class="p-3.5 bg-[#f8fafb] border border-[#e5ecee] rounded-xl space-y-2">
              <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider block">
                5. Discounts &amp; Pricing Concessions
              </span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <Label class="text-[11px] font-semibold text-[#122b2e]">Discount Type</Label>
                  <select
                    bind:value={quoteDiscountType}
                    class="w-full h-8 bg-white border border-[#e5ecee] rounded-lg px-2 mt-1 text-xs focus:border-[#183f42]"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Fixed Dollar Discount ($)</option>
                  </select>
                </div>

                <div>
                  <Label class="text-[11px] font-semibold text-[#122b2e]">
                    Discount Value {quoteDiscountType === 'percentage' ? '(%)' : '($)'}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    bind:value={quoteDiscountValue}
                    placeholder="0"
                    class="h-8 text-xs mt-1 bg-white border-[#e5ecee] rounded-lg focus:border-[#183f42]"
                  />
                </div>
              </div>

              {#if requiresApproval}
                <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2 mt-2">
                  <AlertTriangle class="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Discounts exceeding 15% will route to Enterprise Administration for sign-off.</span>
                </div>
              {/if}
            </div>

            <!-- Automated Calculation Breakdown -->
            <div class="p-3.5 bg-[#f8fafb] border border-[#bde4df] rounded-xl space-y-2 text-xs">
              <div class="font-bold text-[#122b2e] flex items-center justify-between">
                <span>Quotation Financial Breakdown:</span>
                <span class="text-[10px] bg-[#e6f4f2] text-[#143e42] px-2 py-0.5 rounded border border-[#bde4df]">
                  18% Standard GST/VAT Included
                </span>
              </div>

              <div class="space-y-1 pt-1 border-t border-[#edf2f3]">
                <div class="flex justify-between text-[#586f73]">
                  <span>Gross Subtotal ({quoteLines.length} lines):</span>
                  <b>${quoteSubtotal.toFixed(2)}</b>
                </div>

                {#if quoteDiscountAmount > 0}
                  <div class="flex justify-between text-teal-700 font-semibold">
                    <span>Applied Discount ({quoteDiscountType === 'percentage' ? `${quoteDiscountValue}%` : `$${quoteDiscountValue}`}):</span>
                    <b>-${quoteDiscountAmount.toFixed(2)}</b>
                  </div>
                {/if}

                <div class="flex justify-between text-[#586f73]">
                  <span>Taxable Base:</span>
                  <b>${quoteTaxableBase.toFixed(2)}</b>
                </div>

                <div class="flex justify-between text-[#586f73]">
                  <span>Automated Tax (18%):</span>
                  <b>${quoteTaxAmount.toFixed(2)}</b>
                </div>

                <div class="flex justify-between text-base font-extrabold text-[#183f42] pt-1.5 border-t border-[#edf2f3]">
                  <span>Total Quotation Amount:</span>
                  <span>${quoteTotalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 9 & 10 Actions (Save Draft & Send to Customer) -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-[#edf2f3] mt-4">
            <Button
              variant="outline"
              size="xs"
              onclick={() => (showCreateModal = false)}
              class="rounded-xl h-8 px-4"
            >
              Cancel
            </Button>

            <div class="flex items-center gap-2">
              <!-- Step 9: Save the Quotation as Draft -->
              <Button
                type="button"
                variant="outline"
                size="xs"
                onclick={() => handleSaveQuoteAction("Draft")}
                class="rounded-xl h-8 px-4 border-[#183f42] text-[#183f42] hover:bg-[#e6f4f2] font-semibold"
              >
                Save as Draft
              </Button>

              <!-- Step 10: Send the Quotation to the Customer -->
              <Button
                type="button"
                size="xs"
                onclick={() => handleSaveQuoteAction("Quotation")}
                class="bg-[#183f42] hover:bg-[#123033] text-white rounded-xl h-8 px-5 font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Send class="w-3.5 h-3.5" />
                <span>Save &amp; Send to Customer</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- ========================================================================= -->
    <!-- VIEW QUOTATION PROPOSAL DETAILS MODAL                                     -->
    <!-- ========================================================================= -->
    {#if showViewQuoteModal && selectedQuote}
      {@const statusLower = String(selectedQuote.status || "").toLowerCase()}
      {@const isDraft = statusLower === "draft"}
      <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-xl w-full p-6 text-xs animate-in fade-in zoom-in-95 duration-150 my-6">
          <div class="flex items-center justify-between pb-3 border-b border-[#edf2f3] mb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-[#e6f4f2] text-[#183f42] flex items-center justify-center shadow-xs">
                <Eye class="w-4 h-4" />
              </div>
              <div>
                <h3 class="font-bold text-[#122b2e] text-sm">Quotation Details</h3>
                <span class="font-mono text-[11px] text-[#7e9599]">
                  {selectedQuote.quote_number || selectedQuote.quotation_number || selectedQuote.id}
                </span>
              </div>
            </div>
            <button onclick={() => (showViewQuoteModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3 p-3 bg-[#f8fafb] rounded-xl border border-[#edf2f3]">
              <div>
                <span class="text-[#7e9599] text-[10px] block">Customer:</span>
                <b class="text-[#122b2e] text-xs">{getCustomerLabel(selectedQuote.customer_id, selectedQuote)}</b>
              </div>
              <div>
                <span class="text-[#7e9599] text-[10px] block">Associated Plan:</span>
                <b class="text-[#122b2e] text-xs">{getPlanLabel(selectedQuote.plan_id, selectedQuote)}</b>
              </div>
              <div>
                <span class="text-[#7e9599] text-[10px] block">Valid Until:</span>
                <b class="text-[#122b2e] text-xs">{formatDate(selectedQuote.valid_until)}</b>
              </div>
              <div>
                <span class="text-[#7e9599] text-[10px] block">Current Status:</span>
                <span class={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadgeClass(selectedQuote.status)}`}>
                  {selectedQuote.status}
                </span>
              </div>
            </div>

            <!-- Itemized lines -->
            <div class="space-y-1.5">
              <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider block">Itemized Lines:</span>
              <div class="border border-[#edf2f3] rounded-xl divide-y divide-[#edf2f3] overflow-hidden">
                {#each (selectedQuote.lines || []).filter(Boolean) as line}
                  <div class="p-2.5 bg-white flex items-center justify-between text-xs">
                    <div>
                      <span class="font-bold text-[#122b2e]">{line.product_name || line.catalog_product_name || line.product_id}</span>
                      <span class="text-[#7e9599] ml-1">× {line.quantity}</span>
                      {#if line.variant_name && line.variant_name !== 'None'}
                        <span class="text-[10px] text-[#183f42] ml-1 bg-[#f2f7f7] px-1.5 py-0.5 rounded border border-[#dde7e8]">
                          {line.variant_name}
                        </span>
                      {/if}
                    </div>
                    <div class="text-right">
                      <span class="font-bold text-[#122b2e]">
                        ${Number(line.line_total || line.line_subtotal || (line.unit_price * line.quantity) || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Totals Breakdown -->
            <div class="pt-2 border-t border-[#edf2f3] space-y-1 text-right text-xs">
              <div>
                <span class="text-[#7e9599]">Subtotal:</span>
                <b class="text-[#122b2e] ml-1">${Number(selectedQuote.subtotal || 0).toFixed(2)}</b>
              </div>
              {#if Number(selectedQuote.discount_amount || 0) > 0}
                <div class="text-teal-700 font-semibold">
                  <span>Applied Discount:</span>
                  <span class="ml-1">-${Number(selectedQuote.discount_amount).toFixed(2)}</span>
                </div>
              {/if}
              <div>
                <span class="text-[#7e9599]">Tax Amount (18%):</span>
                <b class="text-[#122b2e] ml-1">${Number(selectedQuote.tax_amount || 0).toFixed(2)}</b>
              </div>
              <div class="text-sm font-extrabold text-[#183f42] pt-1 border-t border-[#edf2f3]">
                <span>Total Quotation:</span>
                <span class="ml-1">${Number(selectedQuote.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-[#edf2f3] mt-4">
            <Button variant="outline" size="xs" onclick={() => (showViewQuoteModal = false)} class="rounded-xl h-8 px-4">
              Close
            </Button>
            {#if isDraft}
              <Button
                size="xs"
                onclick={() => {
                  handleSendExistingQuote(selectedQuote.id);
                  showViewQuoteModal = false;
                }}
                class="bg-[#183f42] hover:bg-[#123033] text-white rounded-xl h-8 px-4 font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Send class="w-3.5 h-3.5" /> Send to Customer
              </Button>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</AppShell>
