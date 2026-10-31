<script>
  import { page } from "$app/state";
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
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
    confirmQuotation,
    addTemplate,
    addDays
  } from "$lib/stores/coreManagement.js";
  import {
    Plus,
    Eye,
    Send,
    Repeat,
    HeartHandshake,
    CheckCircle2,
    Calendar,
    Check,
    AlertCircle,
    X,
    FileText,
    Layers,
    Tag,
    Clock,
    DollarSign,
    Trash2,
    Sparkles,
    ArrowRight,
    Building2,
    Package,
    Percent,
    ShieldAlert
  } from "lucide-svelte";

  // Tab: "quotations" or "templates"
  let activeTab = $state("quotations");

  $effect(() => {
    try {
      const tabParam = page.url.searchParams.get("tab");
      if (tabParam === "templates" || tabParam === "quotations") {
        activeTab = tabParam;
      }
    } catch (e) {
      // Ignore if page.url is momentarily unavailable
    }
  });

  // Modals
  let showCreateModal = $state(false);
  let showTemplateModal = $state(false);
  let showViewQuoteModal = $state(false);
  let selectedQuote = $state(null);

  // Error/Success banners
  let actionError = $state("");
  let actionSuccess = $state("");

  // =========================================================================
  // 1. CREATE QUOTATION FROM TEMPLATE STATE (Interactive Proposal Builder)
  // =========================================================================
  let selectedCustomerId = $state("");
  let selectedTemplateId = $state("");
  let quotePlanId = $state("");
  let quoteValidUntil = $state("");
  let quoteDiscountType = $state("percentage"); // "percentage" | "fixed"
  let quoteDiscountValue = $state(0);
  let quoteLines = $state([]);

  function loadTemplateIntoQuote(tmplId) {
    selectedTemplateId = tmplId;
    const tmpl = ($templatesStore || []).find(t => t.id === tmplId);
    if (!tmpl) return;

    quotePlanId = tmpl.plan_id;
    const today = new Date().toISOString().split("T")[0];
    quoteValidUntil = addDays(today, Number(tmpl.validity_days) || 30);

    // Load template's product lines into editable quote lines
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

  function handleOpenCreateModal(preselectedTmplId = null) {
    actionError = "";
    actionSuccess = "";

    if ($customersStore && $customersStore.length > 0) {
      selectedCustomerId = $customersStore[0].id;
    }

    const tmplId = preselectedTmplId || ($templatesStore && $templatesStore.length > 0 ? $templatesStore[0].id : "");
    loadTemplateIntoQuote(tmplId);
    quoteDiscountValue = 0;
    showCreateModal = true;
  }

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

  function handleRemoveQuoteLine(index) {
    if (quoteLines.length > 1) {
      quoteLines = quoteLines.filter((_, i) => i !== index);
    } else {
      actionError = "A quotation must have at least one product line.";
    }
  }

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

  // Live Calculations for Quotation Builder
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
    getPlanObject(activeTemplate?.plan_id || quotePlanId)
  );

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

    // Verify all lines have a product selected
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
        ? `Quotation ${q.quote_number || q.id} created and dispatched to ${activeCustomer?.name || 'customer'}! Status: Quotation (Sent).`
        : `Quotation ${q.quote_number || q.id} saved as Draft.`;

      showCreateModal = false;
      activeTab = "quotations";
    } catch (e) {
      actionError = e.message || "Failed to create quotation.";
    }
  }

  // =========================================================================
  // 2. CREATE QUOTATION TEMPLATE STATE
  // =========================================================================
  let newTmplName = $state("");
  let newTmplPlanId = $state("");
  let newTmplValidityDays = $state(30);
  let newTmplDesc = $state("");
  let newTmplLines = $state([]);

  function openNewTemplateModal() {
    actionError = "";
    actionSuccess = "";
    newTmplName = "";
    newTmplDesc = "";
    newTmplValidityDays = 30;

    if ($plansStore && $plansStore.length > 0) {
      newTmplPlanId = $plansStore[0].id;
    }

    const firstProd = $productsStore && $productsStore.length > 0 ? $productsStore[0] : null;
    const firstVariant = firstProd?.variants?.length > 0 ? firstProd.variants[0] : null;

    newTmplLines = [
      {
        product_id: firstProd ? firstProd.id : "",
        product_name: firstProd ? firstProd.name : "",
        variant_id: firstVariant ? firstVariant.id : "",
        variant_name: firstVariant ? `${firstVariant.attribute_name}: ${firstVariant.attribute_value}` : "None",
        quantity: 1,
        unit_price: firstProd ? Number(firstProd.sales_price || 0) : 0,
        price_extra: firstVariant ? Number(firstVariant.price_extra || 0) : 0
      }
    ];

    showTemplateModal = true;
  }

  function handleProductChange(index, productId) {
    if (!newTmplLines[index]) return;
    const prod = ($productsStore || []).find(p => p.id === productId);
    if (!prod) return;

    newTmplLines[index].product_id = prod.id;
    newTmplLines[index].product_name = prod.name;
    newTmplLines[index].unit_price = Number(prod.sales_price || 0);

    if (prod.variants && prod.variants.length > 0) {
      const v = prod.variants[0];
      newTmplLines[index].variant_id = v.id;
      newTmplLines[index].variant_name = `${v.attribute_name}: ${v.attribute_value}`;
      newTmplLines[index].price_extra = Number(v.price_extra || 0);
    } else {
      newTmplLines[index].variant_id = "";
      newTmplLines[index].variant_name = "None";
      newTmplLines[index].price_extra = 0;
    }
  }

  function handleVariantChange(index, variantId) {
    if (!newTmplLines[index]) return;
    const line = newTmplLines[index];
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

  function handleAddLine() {
    const prod = $productsStore && $productsStore.length > 0 ? $productsStore[0] : null;
    const v = prod?.variants?.length > 0 ? prod.variants[0] : null;

    newTmplLines = [
      ...newTmplLines,
      {
        product_id: prod ? prod.id : "",
        product_name: prod ? prod.name : "",
        variant_id: v ? v.id : "",
        variant_name: v ? `${v.attribute_name}: ${v.attribute_value}` : "None",
        quantity: 1,
        unit_price: prod ? Number(prod.sales_price || 0) : 0,
        price_extra: v ? Number(v.price_extra || 0) : 0
      }
    ];
  }

  function handleRemoveLine(index) {
    if (newTmplLines.length > 1) {
      newTmplLines = newTmplLines.filter((_, i) => i !== index);
    } else {
      actionError = "A quotation template must contain at least one product line.";
    }
  }

  const newTmplSubtotal = $derived(
    (newTmplLines || []).reduce((acc, line) => {
      if (!line) return acc;
      const eff = (Number(line.unit_price) || 0) + (Number(line.price_extra) || 0);
      return acc + (Number(line.quantity) || 1) * eff;
    }, 0)
  );
  const newTmplTax = $derived(newTmplSubtotal * 0.18);
  const newTmplTotal = $derived(newTmplSubtotal + newTmplTax);

  function handleSaveTemplate() {
    actionError = "";
    if (!newTmplName.trim()) {
      actionError = "Template name is required.";
      return;
    }
    if (!newTmplPlanId) {
      actionError = "Associated subscription plan is required.";
      return;
    }
    if (newTmplLines.length === 0) {
      actionError = "Please add at least one product line.";
      return;
    }

    for (let i = 0; i < newTmplLines.length; i++) {
      if (!newTmplLines[i].product_id) {
        actionError = `Please select a product for Line ${i + 1}.`;
        return;
      }
    }

    try {
      const tmpl = addTemplate({
        name: newTmplName.trim(),
        plan_id: newTmplPlanId,
        validity_days: Number(newTmplValidityDays) || 30,
        description: newTmplDesc.trim(),
        lines: newTmplLines
      });

      actionSuccess = `Quotation template '${tmpl.name}' created and saved successfully with ${newTmplLines.length} product lines.`;
      showTemplateModal = false;
      activeTab = "templates";
    } catch (e) {
      actionError = e.message || "Failed to create template.";
    }
  }

  // =========================================================================
  // 3. LIFECYCLE ACTIONS (Send & Confirm)
  // =========================================================================
  function handleSendQuote(quoteId) {
    actionError = "";
    sendQuotation(quoteId);
    actionSuccess = `Quotation marked as Sent to customer. Status updated to 'Quotation'.`;
  }

  function handleConfirmQuote(quoteId) {
    actionError = "";
    actionSuccess = "";
    try {
      const sub = confirmQuotation(quoteId);
      actionSuccess = `Quotation confirmed successfully! Plan min_quantity validated. Subscription ${sub.subscription_number || sub.id} generated.`;
    } catch (e) {
      actionError = e.message;
    }
  }

  function handleViewQuote(quote) {
    selectedQuote = quote;
    showViewQuoteModal = true;
  }

  function getCustomerName(customerId, q = null) {
    if (q && q.customer_name) {
      return `${q.customer_name}${q.customer_company ? ` (${q.customer_company})` : ""}`;
    }
    if (!customerId) return "—";
    const c = ($customersStore || []).find(cust => cust.id === customerId || cust.customer_number === customerId);
    return c ? `${c.name} (${c.company})` : customerId;
  }

  function getPlanName(planId, q = null) {
    if (q && q.plan_name) return q.plan_name;
    if (!planId) return "—";
    const p = ($plansStore || []).find(pl => pl.id === planId);
    return p ? p.name : planId;
  }

  function getPlanObject(planId) {
    if (!planId) return null;
    return ($plansStore || []).find(pl => pl.id === planId) || null;
  }

  function formatDate(val) {
    if (!val) return "—";
    if (typeof val === "string" && val.includes("T")) {
      return val.split("T")[0];
    }
    return String(val);
  }
</script>

<AppShell title="Quotations &amp; Proposals">
  <div class="space-y-6">
    <!-- Header with Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#edf2f3] gap-4">
      <div>
        <h2 class="text-base font-bold text-[#122b2e] tracking-tight">Quotations &amp; Proposals</h2>
        <p class="text-xs text-[#7e9599] mt-0.5">
          Build template-driven proposals, modify quantities and variants, apply smart discounts, and dispatch formal quotes to customers.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <!-- Tab Selector -->
        <div class="bg-[#f2f7f7] p-1 rounded-xl flex items-center border border-[#dde7e8] text-xs">
          <button
            onclick={() => (activeTab = "quotations")}
            class={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === "quotations"
                ? "bg-[#183f42] text-white shadow-xs"
                : "text-[#586f73] hover:text-[#122b2e]"
            }`}
          >
            Quotations ({($quotationsStore || []).length})
          </button>
          <button
            onclick={() => (activeTab = "templates")}
            class={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === "templates"
                ? "bg-[#183f42] text-white shadow-xs"
                : "text-[#586f73] hover:text-[#122b2e]"
            }`}
          >
            Quotation Templates ({($templatesStore || []).length})
          </button>
        </div>

        {#if activeTab === "quotations"}
          <Button
            onclick={() => handleOpenCreateModal()}
            size="xs"
            class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs"
          >
            <Plus class="w-3.5 h-3.5" /> Create Quote from Template
          </Button>
        {:else}
          <Button
            onclick={openNewTemplateModal}
            size="xs"
            class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs"
          >
            <Plus class="w-3.5 h-3.5" /> Create Template
          </Button>
        {/if}
      </div>
    </div>

    <!-- Alert Banners -->
    {#if actionError}
      <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
        <div class="flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
          <span><b>Validation Notice:</b> {actionError}</span>
        </div>
        <button onclick={() => (actionError = "")} class="text-rose-500 hover:text-rose-700">
          <X class="w-4 h-4" />
        </button>
      </div>
    {/if}

    {#if actionSuccess}
      <div class="p-3.5 rounded-xl bg-[#e6f4f2] border border-[#bde4df] text-[#143e42] text-xs flex items-center justify-between">
        <div class="flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 shrink-0 text-[#143e42]" />
          <span>{actionSuccess}</span>
        </div>
        <button onclick={() => (actionSuccess = "")} class="text-[#143e42] hover:opacity-75">
          <X class="w-4 h-4" />
        </button>
      </div>
    {/if}

    <!-- ========================================================================= -->
    <!-- TAB 1: QUOTATIONS LIST                                                    -->
    <!-- ========================================================================= -->
    {#if activeTab === "quotations"}
      <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl overflow-hidden">
        <Card.Content class="p-3">
          <Table.Root>
            <Table.Header class="text-[#8c9ba5]">
              <Table.Row class="hover:bg-transparent border-[#edf2f3]">
                <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Quote #</Table.Head>
                <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Customer</Table.Head>
                <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Plan</Table.Head>
                <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Valid Until</Table.Head>
                <Table.Head class="h-9 text-xs font-semibold px-4 text-right text-[#8c9ba5]">Total Amount</Table.Head>
                <Table.Head class="h-9 text-xs font-semibold px-4 text-center text-[#8c9ba5]">Status</Table.Head>
                <Table.Head class="h-9 text-xs font-semibold px-4 text-center text-[#8c9ba5]">Converted Sub</Table.Head>
                <Table.Head class="h-9 text-xs font-semibold px-4 text-right text-[#8c9ba5]">Lifecycle Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body class="text-xs">
              {#if ($quotationsStore || []).length === 0}
                <Table.Row>
                  <Table.Cell colspan="8" class="text-center py-8 text-[#7e9599]">
                    No quotations drafted yet. Click "Create Quote from Template" to start.
                  </Table.Cell>
                </Table.Row>
              {/if}
              {#each ($quotationsStore || []).filter(Boolean) as q}
                {@const statusLower = String(q.status || "draft").toLowerCase()}
                {@const convertedSub = q.converted_subscription_id || q.converted_subscription_number}

                <Table.Row class="transition-all hover:bg-[#f8fafb] border-[#f4f7f8]">
                  <Table.Cell class="py-3 px-4 font-bold text-[#122b2e]">{q.quotation_number || q.quote_number || q.id}</Table.Cell>
                  <Table.Cell class="py-3 px-4 font-medium text-[#122b2e]">{getCustomerName(q.customer_id, q)}</Table.Cell>
                  <Table.Cell class="py-3 px-4 text-[#586f73]">{getPlanName(q.plan_id, q)}</Table.Cell>
                  <Table.Cell class="py-3 px-4 text-[#7e9599]">
                    <span class="inline-flex items-center gap-1">
                      <Clock class="w-3 h-3 text-zinc-400" /> {formatDate(q.valid_until)}
                    </span>
                  </Table.Cell>
                  <Table.Cell class="py-3 px-4 text-right font-bold text-[#122b2e]">
                    ${Number(q.total_amount || 0).toFixed(2)}
                  </Table.Cell>
                  <Table.Cell class="py-3 px-4 text-center">
                    <span class={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      statusLower === 'confirmed'
                        ? 'bg-[#e6f4f2] text-[#143e42] border-[#bde4df]'
                        : statusLower === 'quotation'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}>
                      {q.status ? (q.status.charAt(0).toUpperCase() + q.status.slice(1)) : 'Draft'}
                    </span>
                  </Table.Cell>
                  <Table.Cell class="py-3 px-4 text-center text-[#586f73] font-medium">
                    {#if convertedSub}
                      <span class="inline-flex items-center gap-1 text-[11px] font-bold text-[#143e42] bg-[#e6f4f2] px-2 py-0.5 rounded border border-[#bde4df]">
                        <Repeat class="w-3 h-3" /> {convertedSub}
                      </span>
                    {:else}
                      <span class="text-zinc-400">—</span>
                    {/if}
                  </Table.Cell>
                  <Table.Cell class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <!-- View Details -->
                      <button
                        onclick={() => handleViewQuote(q)}
                        class="p-1 rounded text-zinc-400 hover:text-[#183f42] hover:bg-[#e6f4f2]/50 transition-colors"
                        title="View Line Pricing Breakdown"
                      >
                        <Eye class="w-4 h-4" />
                      </button>

                      <!-- Action: Send Quote (Draft -> Quotation) -->
                      {#if statusLower === 'draft'}
                        <Button
                          onclick={() => handleSendQuote(q.id)}
                          size="xs"
                          class="h-7 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg gap-1"
                        >
                          <Send class="w-3 h-3" /> Send Quote
                        </Button>
                      {/if}

                      <!-- Action: Confirm Quote (Quotation -> Confirmed) -->
                      {#if statusLower === 'quotation'}
                        <Button
                          onclick={() => handleConfirmQuote(q.id)}
                          size="xs"
                          class="h-7 text-[11px] bg-[#183f42] hover:bg-[#123033] text-white rounded-lg gap-1 shadow-xs"
                        >
                          <Check class="w-3 h-3" /> Confirm Offer
                        </Button>
                      {/if}
                    </div>
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </Card.Content>
      </Card.Root>

    <!-- ========================================================================= -->
    <!-- TAB 2: QUOTATION TEMPLATES CATALOG                                        -->
    <!-- ========================================================================= -->
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {#each ($templatesStore || []).filter(Boolean) as tmpl}
          {@const plan = getPlanObject(tmpl.plan_id)}
          {@const tmplSub = (tmpl.lines || []).filter(Boolean).reduce((acc, l) => {
            const eff = (Number(l.unit_price) || 0) + (Number(l.price_extra || l.variant_price_extra) || 0);
            return acc + (Number(l.quantity) || 1) * eff;
          }, 0)}
          {@const tmplTax = tmplSub * 0.18}
          {@const tmplTotal = tmplSub + tmplTax}

          <Card.Root class="bg-white border-[#edf2f3] shadow-xs hover:border-[#183f42]/30 transition-all rounded-2xl flex flex-col justify-between">
            <Card.Header class="pb-3 border-b border-[#f4f7f8]">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider flex items-center gap-1">
                  <Layers class="w-3 h-3" /> Template #{tmpl.id}
                </span>
                <span class="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <Clock class="w-3 h-3 mr-1" /> {tmpl.validity_days || 30} Days Validity
                </span>
              </div>
              <Card.Title class="text-base font-bold text-[#122b2e] mt-1.5">{tmpl.name}</Card.Title>
              <p class="text-xs text-[#7e9599] mt-0.5 leading-relaxed">{tmpl.description || "Reusable quotation baseline."}</p>
            </Card.Header>

            <Card.Content class="space-y-3 pt-3 text-xs flex-1">
              <!-- Target Plan Info -->
              <div class="p-2.5 bg-[#f8fafb] border border-[#e8eff0] rounded-xl flex items-center justify-between text-[11px]">
                <div class="flex items-center gap-1.5">
                  <Repeat class="w-3.5 h-3.5 text-[#183f42]" />
                  <span class="text-[#586f73]">Target Plan:</span>
                  <b class="text-[#122b2e]">{plan ? plan.name : (tmpl.plan_name || tmpl.plan_id)}</b>
                </div>
                {#if plan}
                  <span class="text-[10px] font-semibold text-[#183f42] uppercase bg-[#e6f4f2] px-2 py-0.5 rounded border border-[#bde4df]">
                    {plan.billing_frequency} • Min Qty: {plan.min_quantity}
                  </span>
                {/if}
              </div>

              <!-- Product Lines List -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider">
                  <span>Included Product Lines ({tmpl.lines ? tmpl.lines.length : 0})</span>
                  <span>Effective Total</span>
                </div>

                {#each (tmpl.lines || []).filter(Boolean) as l}
                  {@const extra = Number(l.price_extra || l.variant_price_extra) || 0}
                  {@const base = Number(l.unit_price) || 0}
                  {@const eff = base + extra}
                  {@const lineTot = (Number(l.quantity) || 1) * eff}

                  <div class="p-2.5 rounded-xl bg-white border border-[#edf2f3] flex items-center justify-between text-[11px]">
                    <div class="space-y-0.5">
                      <div class="font-bold text-[#122b2e]">
                        {l.product_name || l.product_id}
                        <span class="text-[#7e9599] font-normal text-[10px] ml-1">× {l.quantity}</span>
                      </div>
                      <div class="text-[10px] text-[#586f73] flex items-center gap-1.5">
                        {#if l.variant_name && l.variant_name !== 'None'}
                          <span class="bg-[#f2f7f7] text-[#183f42] px-1.5 py-0.2 rounded border border-[#dde7e8] font-medium">
                            {l.variant_name}
                          </span>
                        {/if}
                        {#if extra > 0}
                          <span class="text-teal-700 font-semibold">(+${extra.toFixed(2)} Surcharge)</span>
                        {/if}
                        <span>Unit: ${eff.toFixed(2)}</span>
                      </div>
                    </div>
                    <span class="font-bold text-[#122b2e] text-xs">${lineTot.toFixed(2)}</span>
                  </div>
                {/each}
              </div>

              <!-- Estimated Value Summary -->
              <div class="p-2.5 bg-[#f8fafb] border border-[#edf2f3] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span class="text-[#7e9599] text-[11px]">Est. Proposal Total (incl. 18% Tax):</span>
                </div>
                <div class="font-bold text-[#183f42] text-sm">
                  ${tmplTotal.toFixed(2)}
                </div>
              </div>
            </Card.Content>

            <!-- Card Bottom Action -->
            <div class="p-3 border-t border-[#f4f7f8] bg-[#fafcfc] rounded-b-2xl">
              <Button
                onclick={() => handleOpenCreateModal(tmpl.id)}
                size="xs"
                class="w-full bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl h-8 gap-1.5 shadow-xs"
              >
                <HeartHandshake class="w-3.5 h-3.5" />
                <span>Create Quote from this Template</span>
              </Button>
            </div>
          </Card.Root>
        {/each}
      </div>
    {/if}
  </div>
</AppShell>

<!-- ========================================================================= -->
<!-- MODAL: INTERACTIVE QUOTATION PROPOSAL BUILDER (10-Step Workflow)          -->
<!-- ========================================================================= -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full p-6 text-xs animate-in fade-in zoom-in-95 duration-150 my-6">
      
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 border-b border-[#edf2f3] mb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-[#e6f4f2] text-[#183f42] flex items-center justify-center shadow-xs">
            <HeartHandshake class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-bold text-[#122b2e] text-sm">Create Quotation from Template</h3>
            <p class="text-[11px] text-[#7e9599]">Select customer, load template plan &amp; products, customize quantities, variants &amp; discounts, then save or send.</p>
          </div>
        </div>
        <button onclick={() => (showCreateModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        
        <!-- Step 1 & 2: Select Customer & Select Template -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#f8fafb] border border-[#e5ecee] rounded-xl">
          <div>
            <Label for="q-cust" class="font-semibold text-[#122b2e] flex items-center gap-1.5">
              <Building2 class="w-3.5 h-3.5 text-[#183f42]" /> 1. Target Customer *
            </Label>
            <select
              id="q-cust"
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
            <Label for="q-tmpl" class="font-semibold text-[#122b2e] flex items-center gap-1.5">
              <Layers class="w-3.5 h-3.5 text-[#183f42]" /> 2. Quotation Template *
            </Label>
            <select
              id="q-tmpl"
              value={selectedTemplateId}
              onchange={(e) => loadTemplateIntoQuote(e.target.value)}
              class="w-full h-9 bg-white border border-[#e5ecee] rounded-xl px-2.5 mt-1 text-xs focus:border-[#183f42]"
            >
              {#each ($templatesStore || []) as t}
                <option value={t.id}>{t.name} ({t.validity_days || 30} Days)</option>
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

        <!-- Step 3: Set Quotation Validity -->
        <div class="p-3 bg-[#f8fafb] border border-[#e5ecee] rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div>
            <Label for="q-validity" class="font-semibold text-[#122b2e] flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-[#183f42]" /> 3. Quotation Validity Expiry Date *
            </Label>
            <p class="text-[10px] text-[#7e9599] mt-0.5">Pre-filled from template validity window. You may override with a custom expiry date.</p>
          </div>
          <div>
            <Input
              id="q-validity"
              type="date"
              bind:value={quoteValidUntil}
              class="h-9 text-xs bg-white border-[#e5ecee] rounded-xl w-44 focus:border-[#183f42]"
            />
          </div>
        </div>

        <!-- Step 4, 5 & 6: Products, Quantities, Variants & Add/Remove Lines -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider">
              4. Product Lines &amp; Variant Selections
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
                  <!-- Product Catalogue Selector -->
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

                  <!-- Variant Selector with Surcharge Calculation -->
                  <div>
                    <Label class="text-[11px] font-semibold text-[#122b2e]">Variant &amp; Surcharge</Label>
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

                <!-- Quantity & Pricing Override -->
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

        <!-- Step 7: Smart Discounts Configuration -->
        <div class="p-3.5 bg-[#f8fafb] border border-[#e5ecee] rounded-xl space-y-2">
          <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider block">
            5. Proposal Discounts &amp; Pricing Incentives
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
        </div>

        <!-- Step 8: Price, Discount & Tax Calculation Breakdown -->
        <div class="p-3.5 bg-[#f8fafb] border border-[#bde4df] rounded-xl space-y-2 text-xs">
          <div class="font-bold text-[#122b2e] flex items-center justify-between">
            <span>Summary &amp; Automated Tax Calculation:</span>
            <span class="text-[10px] bg-[#e6f4f2] text-[#143e42] px-2 py-0.5 rounded border border-[#bde4df]">
              Standard 18% GST/VAT Applied
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

      <!-- Modal Footer with Step 9 (Save Draft) & Step 10 (Send to Customer) -->
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
          <!-- Step 9: Save as Draft -->
          <Button
            type="button"
            variant="outline"
            size="xs"
            onclick={() => handleSaveQuoteAction("Draft")}
            class="rounded-xl h-8 px-4 border-[#183f42] text-[#183f42] hover:bg-[#e6f4f2] font-semibold"
          >
            Save as Draft
          </Button>

          <!-- Step 10: Send to Customer -->
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
<!-- MODAL: CREATE NEW QUOTATION TEMPLATE                                      -->
<!-- ========================================================================= -->
{#if showTemplateModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full p-6 text-xs animate-in fade-in zoom-in-95 duration-150 my-6">
      
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 border-b border-[#edf2f3] mb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-[#e6f4f2] text-[#183f42] flex items-center justify-center shadow-xs">
            <Layers class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-bold text-[#122b2e] text-sm">Create Reusable Quotation Template</h3>
            <p class="text-[11px] text-[#7e9599]">Configure basic information, catalog products, variant surcharges, and default pricing overrides.</p>
          </div>
        </div>
        <button onclick={() => (showTemplateModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        
        <!-- Step 1: Basic Information -->
        <div class="space-y-3 p-3.5 bg-[#f8fafb] border border-[#e5ecee] rounded-xl">
          <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider block">
            1. Basic Information
          </span>

          <div>
            <Label for="t-name" class="font-semibold text-[#122b2e]">Template Name *</Label>
            <Input
              id="t-name"
              bind:value={newTmplName}
              placeholder="e.g. Enterprise Multi-Seat Annual Bundle"
              class="h-9 text-xs mt-1 bg-white border-[#e5ecee] rounded-xl focus:border-[#183f42]"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label for="t-plan" class="font-semibold text-[#122b2e]">Associated Subscription Plan *</Label>
              <select
                id="t-plan"
                bind:value={newTmplPlanId}
                class="w-full h-9 bg-white border border-[#e5ecee] rounded-xl px-2.5 mt-1 text-xs focus:border-[#183f42]"
              >
                {#each ($plansStore || []) as p}
                  <option value={p.id}>{p.name} ({p.billing_frequency} • Min Qty: {p.min_quantity})</option>
                {/each}
              </select>
            </div>

            <div>
              <Label for="t-days" class="font-semibold text-[#122b2e]">Validity Period (Days) *</Label>
              <Input
                id="t-days"
                type="number"
                min="1"
                bind:value={newTmplValidityDays}
                placeholder="30"
                class="h-9 text-xs mt-1 bg-white border-[#e5ecee] rounded-xl focus:border-[#183f42]"
              />
            </div>
          </div>

          <div>
            <Label for="t-desc" class="font-semibold text-[#122b2e]">Description / Proposal Scope</Label>
            <textarea
              id="t-desc"
              bind:value={newTmplDesc}
              placeholder="Optional sales notes describing the included package features, SLA guarantees, or discounts..."
              class="w-full h-16 bg-white border border-[#e5ecee] rounded-xl p-2.5 mt-1 text-xs resize-none focus:border-[#183f42]"
            ></textarea>
          </div>
        </div>

        <!-- Step 2: Add Products, Select Variants & Configure Pricing -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider">
              2. Product Lines, Variants &amp; Pricing Overrides
            </span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onclick={handleAddLine}
              class="rounded-xl h-7 text-[11px] border-[#183f42] text-[#183f42] hover:bg-[#e6f4f2] gap-1 font-semibold"
            >
              <Plus class="w-3 h-3" /> Add Product Line
            </Button>
          </div>

          <div class="space-y-2.5">
            {#each (newTmplLines || []) as line, idx}
              {@const prod = ($productsStore || []).find(p => p.id === line.product_id)}
              {@const hasVariants = prod && prod.variants && prod.variants.length > 0}
              {@const effUnitPrice = (Number(line.unit_price) || 0) + (Number(line.price_extra) || 0)}
              {@const lineTotal = (Number(line.quantity) || 1) * effUnitPrice}

              <div class="p-3.5 bg-white border border-[#edf2f3] shadow-xs rounded-xl space-y-2.5 relative">
                <div class="flex items-center justify-between pb-1.5 border-b border-[#f4f7f8]">
                  <span class="font-bold text-[#122b2e] text-[11px] flex items-center gap-1.5">
                    <Package class="w-3.5 h-3.5 text-[#183f42]" /> Line {idx + 1}
                  </span>
                  {#if newTmplLines.length > 1}
                    <button
                      type="button"
                      onclick={() => handleRemoveLine(idx)}
                      class="text-zinc-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                      title="Remove Line"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  {/if}
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Select Product -->
                  <div>
                    <Label class="text-[11px] font-semibold text-[#122b2e]">Product (Catalogue) *</Label>
                    <select
                      value={line.product_id}
                      onchange={(e) => handleProductChange(idx, e.target.value)}
                      class="w-full h-8 bg-[#f8fafb] border border-[#e5ecee] rounded-lg px-2 mt-1 text-xs focus:border-[#183f42]"
                    >
                      {#each ($productsStore || []) as p}
                        <option value={p.id}>{p.name} (${Number(p.sales_price || 0).toFixed(2)})</option>
                      {/each}
                    </select>
                  </div>

                  <!-- Select Variant -->
                  <div>
                    <Label class="text-[11px] font-semibold text-[#122b2e]">Product Variant</Label>
                    {#if hasVariants}
                      <select
                        value={line.variant_id}
                        onchange={(e) => handleVariantChange(idx, e.target.value)}
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
                        No variants configured for this product.
                      </div>
                    {/if}
                  </div>
                </div>

                <!-- Quantities & Unit Price Override -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div>
                    <Label class="text-[11px] font-semibold text-[#122b2e]">Default Quantity *</Label>
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
                      Line Total: ${lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Live Template Summary Box -->
        <div class="p-3.5 bg-[#f8fafb] border border-[#bde4df] rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div class="space-y-0.5">
            <div class="font-bold text-[#122b2e]">Estimated Template Summary:</div>
            <div class="text-[11px] text-[#586f73]">
              {newTmplLines.length} product lines • Subtotal: ${newTmplSubtotal.toFixed(2)} • 18% Tax: ${newTmplTax.toFixed(2)}
            </div>
          </div>
          <div class="text-right">
            <span class="text-[10px] uppercase font-bold text-[#8c9ba5] block">Total Est. Proposal</span>
            <span class="text-base font-extrabold text-[#183f42]">${newTmplTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-2 pt-4 border-t border-[#edf2f3] mt-4">
        <Button
          variant="outline"
          size="xs"
          onclick={() => (showTemplateModal = false)}
          class="rounded-xl h-8 px-4"
        >
          Cancel
        </Button>
        <Button
          size="xs"
          onclick={handleSaveTemplate}
          class="bg-[#183f42] hover:bg-[#123033] text-white rounded-xl h-8 px-5 font-semibold shadow-xs"
        >
          Save Template &amp; Product Lines
        </Button>
      </div>
    </div>
  </div>
{/if}

<!-- ========================================================================= -->
<!-- MODAL: VIEW QUOTE DETAILS & LINE ITEMS BREAKDOWN                          -->
<!-- ========================================================================= -->
{#if showViewQuoteModal && selectedQuote}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-lg w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div>
          <h3 class="font-bold text-[#122b2e] text-sm">{selectedQuote.quotation_number || selectedQuote.quote_number || selectedQuote.id} Details</h3>
          <p class="text-[11px] text-[#7e9599]">Client proposal breakdown &amp; line formulas</p>
        </div>
        <button onclick={() => (showViewQuoteModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        <div class="grid grid-cols-2 gap-2 p-3 bg-[#f8fafb] border border-[#edf2f3] rounded-xl text-[11px]">
          <div><span class="text-[#7e9599]">Customer:</span> <b class="text-[#122b2e] block">{getCustomerName(selectedQuote.customer_id, selectedQuote)}</b></div>
          <div><span class="text-[#7e9599]">Status:</span> <b class="text-[#183f42] block">{selectedQuote.status}</b></div>
          <div><span class="text-[#7e9599]">Issue Date:</span> <b class="text-[#122b2e] block">{formatDate(selectedQuote.issue_date)}</b></div>
          <div><span class="text-[#7e9599]">Valid Until:</span> <b class="text-[#122b2e] block">{formatDate(selectedQuote.valid_until)}</b></div>
        </div>

        <div class="space-y-1.5">
          <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider block">Line Items (Formula Breakdown):</span>
          {#if !selectedQuote.lines || selectedQuote.lines.length === 0}
            <div class="p-3 text-center text-zinc-400 bg-[#f8fafb] rounded-xl">
              No individual lines itemized for this quotation.
            </div>
          {/if}
          {#each (selectedQuote.lines || []).filter(Boolean) as l}
            <div class="p-2.5 rounded-xl border border-[#edf2f3] bg-white space-y-1">
              <div class="flex items-center justify-between font-bold text-[#122b2e]">
                <span>{l.product_name || "Product"}</span>
                <span>${Number(l.line_total || (l.quantity * (l.unit_price + (l.price_extra || 0)))).toFixed(2)}</span>
              </div>
              <div class="text-[11px] text-[#586f73] flex flex-wrap gap-2">
                <span>Variant: <b>{l.variant_name || "None"}</b></span>
                {#if Number(l.price_extra) > 0}
                  <span class="text-teal-700 font-semibold">(+${Number(l.price_extra).toFixed(2)} Surcharge)</span>
                {/if}
                <span>Qty: <b>{l.quantity}</b></span>
                <span>Effective Unit: <b>${Number(l.effective_unit_price || (l.unit_price + (l.price_extra || 0))).toFixed(2)}</b></span>
              </div>
              <div class="text-[10px] text-[#7e9599]">
                Taxable Base: ${Number(l.line_subtotal || (l.quantity * (l.unit_price + (l.price_extra || 0)))).toFixed(2)} + 18% Tax
              </div>
            </div>
          {/each}
        </div>

        <!-- Totals Summary -->
        <div class="pt-2 border-t border-zinc-100 space-y-1 text-right text-xs">
          <div><span class="text-[#7e9599]">Subtotal:</span> <b class="text-[#122b2e]">${Number(selectedQuote.subtotal || 0).toFixed(2)}</b></div>
          {#if Number(selectedQuote.discount_amount || 0) > 0}
            <div class="text-teal-700 font-semibold">
              <span>Applied Discount:</span> -${Number(selectedQuote.discount_amount).toFixed(2)}
            </div>
          {/if}
          <div><span class="text-[#7e9599]">Tax Amount (18%):</span> <b class="text-[#122b2e]">${Number(selectedQuote.tax_amount || 0).toFixed(2)}</b></div>
          <div class="text-sm font-extrabold text-[#183f42] pt-1 border-t border-[#edf2f3]">
            <span>Total Quotation:</span> ${Number(selectedQuote.total_amount || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end pt-3 border-t border-zinc-100 mt-4">
        <Button size="xs" onclick={() => (showViewQuoteModal = false)} class="bg-[#183f42] text-white rounded-xl">Close</Button>
      </div>
    </div>
  </div>
{/if}
