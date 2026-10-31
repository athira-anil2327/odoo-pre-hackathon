<script>
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
    addTemplate
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
    DollarSign
  } from "lucide-svelte";

  // Tab: "quotations" or "templates"
  let activeTab = $state("quotations");

  // Modals
  let showCreateModal = $state(false);
  let showTemplateModal = $state(false);
  let showViewQuoteModal = $state(false);
  let selectedQuote = $state(null);

  // Error/Success banners
  let actionError = $state("");
  let actionSuccess = $state("");

  // Create Quote from Template Form
  let selectedTemplateId = $state("");
  let selectedCustomerId = $state("");

  // New Template Form
  let newTmplName = $state("");
  let newTmplPlanId = $state("");
  let newTmplValidityDays = $state(30);
  let newTmplDesc = $state("");

  function handleOpenCreateModal() {
    actionError = "";
    actionSuccess = "";
    if ($templatesStore.length > 0) {
      selectedTemplateId = $templatesStore[0].id;
    }
    if ($customersStore.length > 0) {
      selectedCustomerId = $customersStore[0].id;
    }
    showCreateModal = true;
  }

  function handleInstantiateQuote() {
    actionError = "";
    if (!selectedTemplateId || !selectedCustomerId) {
      actionError = "Please select both a quotation template and a customer.";
      return;
    }
    try {
      const q = createQuotationFromTemplate(selectedTemplateId, selectedCustomerId);
      actionSuccess = `Quotation ${q.quote_number} generated from template with auto-calculated line items and validity date (${q.valid_until}).`;
      showCreateModal = false;
    } catch (e) {
      actionError = e.message;
    }
  }

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
      actionSuccess = `Quotation confirmed successfully! Plan min_quantity validated. Subscription ${sub.subscription_number} generated.`;
    } catch (e) {
      actionError = e.message;
    }
  }

  function handleViewQuote(quote) {
    selectedQuote = quote;
    showViewQuoteModal = true;
  }

  function handleCreateTemplate() {
    if (!newTmplName || !newTmplPlanId) return;
    addTemplate({
      name: newTmplName,
      plan_id: newTmplPlanId,
      validity_days: newTmplValidityDays,
      description: newTmplDesc,
      lines: [
        {
          product_id: "PROD-1001",
          product_name: "Business ERP Suite",
          variant_id: "VAR-1001-ODOO",
          variant_name: "Odoo Enterprise Edition (+560.00)",
          quantity: 1,
          unit_price: 499.00,
          price_extra: 560.00
        }
      ]
    });
    newTmplName = "";
    showTemplateModal = false;
  }

  function getCustomerName(customerId) {
    const c = $customersStore.find(cust => cust.id === customerId);
    return c ? `${c.name} (${c.company})` : customerId;
  }

  function getPlanName(planId) {
    const p = $plansStore.find(pl => pl.id === planId);
    return p ? p.name : planId;
  }
</script>

<AppShell title="Quotations Queue">
  <div class="space-y-6">
    <!-- Header with Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#edf2f3] gap-4">
      <div>
        <h2 class="text-base font-bold text-[#122b2e] tracking-tight">Quotations &amp; Proposals</h2>
        <p class="text-xs text-[#7e9599] mt-0.5">
          Instantiate client proposals from reusable templates, apply line formulas with variant surcharges, and confirm into active contracts.
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
            Quotations ({$quotationsStore.length})
          </button>
          <button
            onclick={() => (activeTab = "templates")}
            class={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === "templates"
                ? "bg-[#183f42] text-white shadow-xs"
                : "text-[#586f73] hover:text-[#122b2e]"
            }`}
          >
            Templates ({$templatesStore.length})
          </button>
        </div>

        {#if activeTab === "quotations"}
          <Button
            onclick={handleOpenCreateModal}
            size="xs"
            class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs"
          >
            <Plus class="w-3.5 h-3.5" /> Create Quote from Template
          </Button>
        {:else}
          <Button
            onclick={() => (showTemplateModal = true)}
            size="xs"
            class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs"
          >
            <Plus class="w-3.5 h-3.5" /> New Template
          </Button>
        {/if}
      </div>
    </div>

    <!-- Alert Banners -->
    {#if actionError}
      <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
        <div class="flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
          <span><b>Validation Error:</b> {actionError}</span>
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

    <!-- TAB 1: QUOTATIONS LIST -->
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
              {#each $quotationsStore as q}
                <Table.Row class="transition-all hover:bg-[#f8fafb] border-[#f4f7f8]">
                  <Table.Cell class="py-3 px-4 font-bold text-[#122b2e]">{q.quote_number}</Table.Cell>
                  <Table.Cell class="py-3 px-4 font-medium text-[#122b2e]">{getCustomerName(q.customer_id)}</Table.Cell>
                  <Table.Cell class="py-3 px-4 text-[#586f73]">{getPlanName(q.plan_id)}</Table.Cell>
                  <Table.Cell class="py-3 px-4 text-[#7e9599]">
                    <span class="inline-flex items-center gap-1">
                      <Clock class="w-3 h-3 text-zinc-400" /> {q.valid_until}
                    </span>
                  </Table.Cell>
                  <Table.Cell class="py-3 px-4 text-right font-bold text-[#122b2e]">${Number(q.total_amount).toFixed(2)}</Table.Cell>
                  <Table.Cell class="py-3 px-4 text-center">
                    <span class={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      q.status === 'Confirmed'
                        ? 'bg-[#e6f4f2] text-[#143e42] border-[#bde4df]'
                        : q.status === 'Quotation'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}>
                      {q.status}
                    </span>
                  </Table.Cell>
                  <Table.Cell class="py-3 px-4 text-center text-[#586f73] font-medium">
                    {#if q.converted_subscription_id}
                      <span class="inline-flex items-center gap-1 text-[11px] font-bold text-[#143e42] bg-[#e6f4f2] px-2 py-0.5 rounded border border-[#bde4df]">
                        <Repeat class="w-3 h-3" /> {q.converted_subscription_id}
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
                      {#if q.status === 'Draft'}
                        <Button
                          onclick={() => handleSendQuote(q.id)}
                          size="xs"
                          class="h-7 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg gap-1"
                        >
                          <Send class="w-3 h-3" /> Send Quote
                        </Button>
                      {/if}

                      <!-- Action: Confirm Quote (Quotation -> Confirmed) -->
                      {#if q.status === 'Quotation'}
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

    <!-- TAB 2: QUOTATION TEMPLATES -->
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each $templatesStore as tmpl}
          <Card.Root class="bg-white border-[#edf2f3] shadow-xs hover:border-[#183f42]/30 transition-all rounded-2xl">
            <Card.Header class="pb-2">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-[#8c9ba5] uppercase tracking-wider">Template</span>
                <span class="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {tmpl.validity_days} Days Validity
                </span>
              </div>
              <Card.Title class="text-sm font-bold text-[#122b2e] mt-1">{tmpl.name}</Card.Title>
              <p class="text-xs text-[#7e9599] mt-1">{tmpl.description || "Reusable quotation baseline."}</p>
            </Card.Header>

            <Card.Content class="space-y-3 text-xs">
              <div class="p-2.5 bg-[#f8fafb] border border-[#e8eff0] rounded-xl text-[11px]">
                <div class="flex items-center justify-between text-[#586f73]">
                  <span>Target Plan:</span>
                  <b class="text-[#122b2e]">{getPlanName(tmpl.plan_id)}</b>
                </div>
              </div>

              <!-- Pre-filled Lines Preview -->
              <div class="space-y-1">
                <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider block">
                  Included Product Lines:
                </span>
                {#each tmpl.lines as l}
                  <div class="p-2 rounded-lg bg-white border border-[#edf2f3] flex items-center justify-between text-[11px]">
                    <span class="text-[#122b2e] font-medium">{l.product_name || l.product_id} (Qty: {l.quantity})</span>
                    <span class="font-bold text-[#183f42]">
                      ${(Number(l.unit_price) + Number(l.price_extra || l.variant_price_extra || 0)).toFixed(2)}
                    </span>
                  </div>
                {/each}
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {/if}
  </div>
</AppShell>

<!-- MODAL: CREATE QUOTATION FROM TEMPLATE (One-Click) -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div class="flex items-center gap-2">
          <HeartHandshake class="w-4 h-4 text-[#183f42]" />
          <h3 class="font-bold text-[#122b2e]">Instantiate Quotation from Template</h3>
        </div>
        <button onclick={() => (showCreateModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3.5">
        <div>
          <Label for="q-cust" class="font-medium text-[#122b2e]">Target Customer *</Label>
          <select id="q-cust" bind:value={selectedCustomerId} class="w-full h-9 bg-[#f8fafb] border border-[#e5ecee] rounded-xl px-2.5 mt-1 text-xs">
            {#each $customersStore as c}
              <option value={c.id}>{c.name} — {c.company}</option>
            {/each}
          </select>
        </div>

        <div>
          <Label for="q-tmpl" class="font-medium text-[#122b2e]">Quotation Template *</Label>
          <select id="q-tmpl" bind:value={selectedTemplateId} class="w-full h-9 bg-[#f8fafb] border border-[#e5ecee] rounded-xl px-2.5 mt-1 text-xs">
            {#each $templatesStore as t}
              <option value={t.id}>{t.name} ({t.validity_days} Days)</option>
            {/each}
          </select>
        </div>

        <div class="p-3 bg-[#f8fafb] border border-[#e8eff0] rounded-xl text-[11px] space-y-1.5 text-[#586f73]">
          <div class="font-bold text-[#122b2e]">Automated Pricing &amp; Validity Calculation:</div>
          <div>• Valid Until automatically calculated from Template's <code>validity_days</code>.</div>
          <div>• Variant surcharges (e.g. Odoo +$560.00) pre-applied to line item totals.</div>
          <div>• Standard 18% Tax Rate calculated on taxable base.</div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 mt-4">
        <Button variant="outline" size="xs" onclick={() => (showCreateModal = false)} class="rounded-xl">Cancel</Button>
        <Button size="xs" onclick={handleInstantiateQuote} class="bg-[#183f42] text-white rounded-xl">Generate Quotation</Button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL: VIEW QUOTE DETAILS & LINE ITEMS BREAKDOWN -->
{#if showViewQuoteModal && selectedQuote}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-lg w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div>
          <h3 class="font-bold text-[#122b2e] text-sm">{selectedQuote.quote_number} Details</h3>
          <p class="text-[11px] text-[#7e9599]">Client proposal breakdown &amp; line formulas</p>
        </div>
        <button onclick={() => (showViewQuoteModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-2 p-3 bg-[#f8fafb] border border-[#edf2f3] rounded-xl text-[11px]">
          <div><span class="text-[#7e9599]">Customer:</span> <b class="text-[#122b2e] block">{getCustomerName(selectedQuote.customer_id)}</b></div>
          <div><span class="text-[#7e9599]">Status:</span> <b class="text-[#183f42] block">{selectedQuote.status}</b></div>
          <div><span class="text-[#7e9599]">Issue Date:</span> <b class="text-[#122b2e] block">{selectedQuote.issue_date}</b></div>
          <div><span class="text-[#7e9599]">Valid Until:</span> <b class="text-[#122b2e] block">{selectedQuote.valid_until}</b></div>
        </div>

        <div class="space-y-1.5">
          <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider block">Line Items (Formula Breakdown):</span>
          {#each selectedQuote.lines as l}
            <div class="p-2.5 rounded-xl border border-[#edf2f3] bg-white space-y-1">
              <div class="flex items-center justify-between font-bold text-[#122b2e]">
                <span>{l.product_name}</span>
                <span>${Number(l.line_total).toFixed(2)}</span>
              </div>
              <div class="text-[11px] text-[#586f73] flex flex-wrap gap-2">
                <span>Variant: <b>{l.variant_name}</b></span>
                {#if Number(l.price_extra) > 0}
                  <span class="text-teal-700 font-semibold">(+{Number(l.price_extra).toFixed(2)} Surcharge)</span>
                {/if}
                <span>Qty: <b>{l.quantity}</b></span>
                <span>Effective Unit: <b>${Number(l.effective_unit_price).toFixed(2)}</b></span>
              </div>
              <div class="text-[10px] text-[#7e9599]">
                Taxable Base: ${Number(l.line_subtotal).toFixed(2)} + 18% Tax: ${Number(l.tax_amount).toFixed(2)}
              </div>
            </div>
          {/each}
        </div>

        <!-- Totals Summary -->
        <div class="pt-2 border-t border-zinc-100 space-y-1 text-right text-xs">
          <div><span class="text-[#7e9599]">Subtotal:</span> <b class="text-[#122b2e]">${Number(selectedQuote.subtotal).toFixed(2)}</b></div>
          <div><span class="text-[#7e9599]">Tax Amount (18%):</span> <b class="text-[#122b2e]">${Number(selectedQuote.tax_amount).toFixed(2)}</b></div>
          <div class="text-sm font-extrabold text-[#183f42] pt-1">
            <span>Total Quotation:</span> ${Number(selectedQuote.total_amount).toFixed(2)}
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end pt-3 border-t border-zinc-100 mt-4">
        <Button size="xs" onclick={() => (showViewQuoteModal = false)} class="bg-[#183f42] text-white rounded-xl">Close</Button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL: NEW TEMPLATE -->
{#if showTemplateModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div class="flex items-center gap-2">
          <Layers class="w-4 h-4 text-[#183f42]" />
          <h3 class="font-bold text-[#122b2e]">Create Reusable Quotation Template</h3>
        </div>
        <button onclick={() => (showTemplateModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3">
        <div>
          <Label for="t-name" class="font-medium text-[#122b2e]">Template Name *</Label>
          <Input id="t-name" bind:value={newTmplName} placeholder="e.g. Enterprise Cloud Standard Bundle" class="h-9 text-xs mt-1" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <Label for="t-plan" class="font-medium text-[#122b2e]">Target Plan *</Label>
            <select id="t-plan" bind:value={newTmplPlanId} class="w-full h-9 bg-[#f8fafb] border border-[#e5ecee] rounded-xl px-2 mt-1 text-xs">
              {#each $plansStore as p}
                <option value={p.id}>{p.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <Label for="t-days" class="font-medium text-[#122b2e]">Validity Days</Label>
            <Input id="t-days" type="number" min="1" bind:value={newTmplValidityDays} class="h-9 text-xs mt-1" />
          </div>
        </div>

        <div>
          <Label for="t-desc" class="font-medium text-[#122b2e]">Description</Label>
          <textarea id="t-desc" bind:value={newTmplDesc} class="w-full h-16 bg-[#f8fafb] border border-[#e5ecee] rounded-xl p-2.5 mt-1 text-xs resize-none"></textarea>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 mt-4">
        <Button variant="outline" size="xs" onclick={() => (showTemplateModal = false)} class="rounded-xl">Cancel</Button>
        <Button size="xs" onclick={handleCreateTemplate} class="bg-[#183f42] text-white rounded-xl">Save Template</Button>
      </div>
    </div>
  </div>
{/if}
