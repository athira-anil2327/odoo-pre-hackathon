<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import {
    productsStore,
    plansStore,
    addProduct,
    addVariantToProduct,
    addPlan
  } from "$lib/stores/coreManagement.js";
  import {
    Plus,
    Package,
    Layers,
    Tag,
    Calendar,
    Clock,
    DollarSign,
    CheckCircle2,
    Shield,
    X,
    ChevronDown,
    Sliders,
    Sparkles,
    AlertCircle
  } from "lucide-svelte";

  // Tab switcher: "products" or "plans"
  let activeTab = $state("products");

  // Modal states
  let showAddProductModal = $state(false);
  let showAddVariantModal = $state(false);
  let showAddPlanModal = $state(false);
  let selectedProductIdForVariant = $state("");

  // Product Form
  let newProdName = $state("");
  let newProdType = $state("software");
  let newProdSalesPrice = $state(499.00);
  let newProdCostPrice = $state(150.00);
  let newProdNotes = $state("");

  // Variant Form
  let newVarAttribute = $state("Brand");
  let newVarValue = $state("Odoo Enterprise Edition");
  let newVarPriceExtra = $state(560.00);
  let newVarSku = $state("ERP-ODOO-ENT");

  // Plan Form
  let newPlanName = $state("");
  let newPlanFrequency = $state("monthly");
  let newPlanPrice = $state(499.00);
  let newPlanMinQty = $state(1);
  let newPlanStartDate = $state(new Date().toISOString().split("T")[0]);
  let newPlanEndDate = $state("2027-12-31");
  let newPlanAutoClose = $state(false);
  let newPlanAllowEarlyClose = $state(true);
  let newPlanAllowPause = $state(true);
  let newPlanAllowRenewal = $state(true);
  let selectedIncludedProducts = $state([]);

  function handleCreateProduct() {
    if (!newProdName) return;
    addProduct({
      name: newProdName,
      type: newProdType,
      sales_price: newProdSalesPrice,
      cost_price: newProdCostPrice,
      notes: newProdNotes
    });
    newProdName = "";
    newProdNotes = "";
    showAddProductModal = false;
  }

  function handleOpenVariantModal(productId) {
    selectedProductIdForVariant = productId;
    showAddVariantModal = true;
  }

  function handleCreateVariant() {
    if (!selectedProductIdForVariant || !newVarValue) return;
    addVariantToProduct(selectedProductIdForVariant, {
      attribute_name: newVarAttribute,
      attribute_value: newVarValue,
      price_extra: newVarPriceExtra,
      sku: newVarSku
    });
    showAddVariantModal = false;
  }

  function handleCreatePlan() {
    if (!newPlanName) return;
    addPlan({
      name: newPlanName,
      billing_frequency: newPlanFrequency,
      price: newPlanPrice,
      min_quantity: newPlanMinQty,
      start_date: newPlanStartDate,
      end_date: newPlanEndDate,
      auto_close_on_end: newPlanAutoClose,
      allow_early_close: newPlanAllowEarlyClose,
      allow_pause: newPlanAllowPause,
      allow_renewal: newPlanAllowRenewal,
      included_products: selectedIncludedProducts
    });
    newPlanName = "";
    showAddPlanModal = false;
  }
</script>

<AppShell title="Catalog & Subscription Plans">
  <div class="space-y-6">
    <!-- Header with Tab Navigation -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#edf2f3] gap-4">
      <div>
        <h2 class="text-base font-bold text-[#122b2e] tracking-tight">Product &amp; Plan Catalog</h2>
        <p class="text-xs text-[#7e9599] mt-0.5">
          Manage core software, add-ons, price surcharge variants (e.g. Brand = Odoo +$560), and recurring lifecycle rules.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <!-- View Switcher -->
        <div class="bg-[#f2f7f7] p-1 rounded-xl flex items-center border border-[#dde7e8] text-xs">
          <button
            onclick={() => (activeTab = "products")}
            class={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === "products"
                ? "bg-[#183f42] text-white shadow-xs"
                : "text-[#586f73] hover:text-[#122b2e]"
            }`}
          >
            Products ({$productsStore.length})
          </button>
          <button
            onclick={() => (activeTab = "plans")}
            class={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === "plans"
                ? "bg-[#183f42] text-white shadow-xs"
                : "text-[#586f73] hover:text-[#122b2e]"
            }`}
          >
            Plans ({$plansStore.length})
          </button>
        </div>

        {#if activeTab === "products"}
          <Button
            onclick={() => (showAddProductModal = true)}
            size="xs"
            class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs"
          >
            <Plus class="w-3.5 h-3.5" /> Add Product
          </Button>
        {:else}
          <Button
            onclick={() => (showAddPlanModal = true)}
            size="xs"
            class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs"
          >
            <Plus class="w-3.5 h-3.5" /> New Plan
          </Button>
        {/if}
      </div>
    </div>

    <!-- TAB 1: PRODUCTS & VARIANTS -->
    {#if activeTab === "products"}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {#each $productsStore as p}
          <Card.Root class="bg-white border-[#edf2f3] shadow-xs hover:border-[#183f42]/30 transition-all rounded-2xl relative overflow-hidden group">
            <Card.Header class="pb-2.5">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-semibold text-[#8c9ba5] uppercase tracking-wider">{p.type}</span>
                <span class="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]">
                  {p.is_active ? "Active" : "Archived"}
                </span>
              </div>
              <Card.Title class="text-sm font-bold text-[#122b2e] mt-1">{p.name}</Card.Title>
            </Card.Header>
            <Card.Content class="space-y-3.5 text-xs">
              <p class="text-[#586f73] leading-relaxed">{p.notes || "No notes configured."}</p>

              <!-- Base Pricing -->
              <div class="p-3 bg-[#f8fafb] border border-[#e8eff0] rounded-xl flex items-center justify-between">
                <span class="text-[#586f73] font-medium flex items-center gap-1.5">
                  <DollarSign class="w-3.5 h-3.5 text-[#183f42]" /> Base Sales Price
                </span>
                <span class="font-bold text-[#122b2e] text-sm">${Number(p.sales_price).toFixed(2)}</span>
              </div>

              <!-- Product Variants Section (Scene 2 Requirement) -->
              <div class="space-y-2 pt-1 border-t border-[#f4f7f8]">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold text-[#122b2e] flex items-center gap-1.5">
                    <Tag class="w-3 h-3 text-[#183f42]" /> Attached Variants ({(p.variants || []).length}):
                  </span>
                  <button
                    onclick={() => handleOpenVariantModal(p.id)}
                    class="text-[11px] font-semibold text-[#183f42] hover:underline flex items-center gap-1"
                  >
                    <Plus class="w-3 h-3" /> Add Variant
                  </button>
                </div>

                {#if (p.variants || []).length > 0}
                  <div class="space-y-1.5">
                    {#each p.variants as v}
                      <div class="p-2.5 bg-white border border-[#edf2f3] rounded-xl flex items-center justify-between text-[11px]">
                        <div>
                          <div class="font-bold text-[#122b2e]">{v.attribute_name}: {v.attribute_value}</div>
                          <div class="text-[10px] text-[#7e9599]">SKU: {v.sku}</div>
                        </div>
                        <div class="text-right">
                          <span class="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[#143e42] bg-[#e6f4f2] border border-[#bde4df]">
                            +{Number(v.price_extra).toFixed(2)} Surcharge
                          </span>
                          <div class="text-[10px] text-[#586f73] mt-0.5">
                            Total: ${(Number(p.sales_price) + Number(v.price_extra)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="p-2.5 bg-[#fbfcfc] border border-dashed border-[#e2eaeb] rounded-xl text-center text-[#7e9599] text-[11px]">
                    Standard product (no variants attached).
                  </div>
                {/if}
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>

    <!-- TAB 2: SUBSCRIPTION PLANS & LIFECYCLE RULES -->
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each $plansStore as plan}
          <Card.Root class="bg-white border-[#edf2f3] shadow-xs hover:border-[#183f42]/30 transition-all rounded-2xl flex flex-col justify-between">
            <Card.Header class="pb-2">
              <div class="flex items-center justify-between">
                <span class="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-blue-50 text-blue-700 border border-blue-200">
                  {plan.billing_frequency}
                </span>
                <span class="text-xs font-bold text-[#122b2e] bg-[#f8fafb] px-2.5 py-0.5 rounded-lg border border-[#e5ecee]">
                  Min Qty: {plan.min_quantity}
                </span>
              </div>
              <Card.Title class="text-base font-bold text-[#122b2e] mt-2">{plan.name}</Card.Title>
              <div class="text-xl font-extrabold text-[#183f42] mt-1">
                ${Number(plan.price).toFixed(2)}
                <span class="text-xs font-medium text-[#7e9599]">/{plan.billing_frequency}</span>
              </div>
            </Card.Header>

            <Card.Content class="space-y-3.5 text-xs pt-1">
              <!-- Availability Window -->
              <div class="p-2.5 bg-[#f8fafb] border border-[#e8eff0] rounded-xl space-y-1 text-[11px]">
                <div class="flex items-center justify-between text-[#586f73]">
                  <span class="flex items-center gap-1"><Calendar class="w-3 h-3 text-[#183f42]" /> Available From:</span>
                  <span class="font-semibold text-[#122b2e]">{plan.start_date || "Open"}</span>
                </div>
                <div class="flex items-center justify-between text-[#586f73]">
                  <span class="flex items-center gap-1"><Clock class="w-3 h-3 text-[#183f42]" /> Ends At:</span>
                  <span class="font-semibold text-[#122b2e]">{plan.end_date || "Perpetual"}</span>
                </div>
              </div>

              <!-- Lifecycle Flags Matrix (Scene 2 Blueprint Requirement) -->
              <div class="space-y-1.5 pt-1 border-t border-[#f4f7f8]">
                <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider block mb-1">
                  Lifecycle State Toggles:
                </span>
                <div class="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div class="p-1.5 rounded-lg border flex items-center justify-between {plan.allow_pause ? 'bg-[#e6f4f2] text-[#143e42] border-[#bde4df]' : 'bg-zinc-50 text-zinc-400 border-zinc-200'}">
                    <span>Allow Pause:</span>
                    <b>{plan.allow_pause ? 'YES' : 'NO'}</b>
                  </div>
                  <div class="p-1.5 rounded-lg border flex items-center justify-between {plan.allow_early_close ? 'bg-[#e6f4f2] text-[#143e42] border-[#bde4df]' : 'bg-zinc-50 text-zinc-400 border-zinc-200'}">
                    <span>Early Close:</span>
                    <b>{plan.allow_early_close ? 'YES' : 'NO'}</b>
                  </div>
                  <div class="p-1.5 rounded-lg border flex items-center justify-between {plan.allow_renewal ? 'bg-[#e6f4f2] text-[#143e42] border-[#bde4df]' : 'bg-zinc-50 text-zinc-400 border-zinc-200'}">
                    <span>Renewal:</span>
                    <b>{plan.allow_renewal ? 'YES' : 'NO'}</b>
                  </div>
                  <div class="p-1.5 rounded-lg border flex items-center justify-between {plan.auto_close_on_end ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-zinc-50 text-zinc-400 border-zinc-200'}">
                    <span>Auto-Close:</span>
                    <b>{plan.auto_close_on_end ? 'YES' : 'NO'}</b>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {/if}
  </div>
</AppShell>

<!-- MODAL: ADD PRODUCT -->
{#if showAddProductModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div class="flex items-center gap-2">
          <Package class="w-4 h-4 text-[#183f42]" />
          <h3 class="font-bold text-[#122b2e]">Create New Product</h3>
        </div>
        <button onclick={() => (showAddProductModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3">
        <div>
          <Label for="p-name" class="font-medium text-[#122b2e]">Product Name *</Label>
          <Input id="p-name" bind:value={newProdName} placeholder="e.g. Platform Core Engine" class="h-9 text-xs mt-1" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <Label for="p-type" class="font-medium text-[#122b2e]">Product Type</Label>
            <select id="p-type" bind:value={newProdType} class="w-full h-9 bg-[#f8fafb] border border-[#e5ecee] rounded-xl px-2 mt-1 text-xs">
              <option value="software">Software</option>
              <option value="addon">Add-on</option>
              <option value="service">Service</option>
            </select>
          </div>

          <div>
            <Label for="p-price" class="font-medium text-[#122b2e]">Sales Price ($)</Label>
            <Input id="p-price" type="number" step="0.01" bind:value={newProdSalesPrice} class="h-9 text-xs mt-1" />
          </div>
        </div>

        <div>
          <Label for="p-cost" class="font-medium text-[#122b2e]">Cost Price ($)</Label>
          <Input id="p-cost" type="number" step="0.01" bind:value={newProdCostPrice} class="h-9 text-xs mt-1" />
        </div>

        <div>
          <Label for="p-notes" class="font-medium text-[#122b2e]">Internal Notes</Label>
          <textarea
            id="p-notes"
            bind:value={newProdNotes}
            placeholder="Technical details, included modules..."
            class="w-full h-20 bg-[#f8fafb] border border-[#e5ecee] rounded-xl p-2.5 mt-1 text-xs resize-none"
          ></textarea>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 mt-4">
        <Button variant="outline" size="xs" onclick={() => (showAddProductModal = false)} class="rounded-xl">Cancel</Button>
        <Button size="xs" onclick={handleCreateProduct} class="bg-[#183f42] text-white rounded-xl">Save Product</Button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL: ADD VARIANT (e.g. Brand = Odoo +$560) -->
{#if showAddVariantModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-sm w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div class="flex items-center gap-2">
          <Tag class="w-4 h-4 text-[#183f42]" />
          <h3 class="font-bold text-[#122b2e]">Attach Product Variant</h3>
        </div>
        <button onclick={() => (showAddVariantModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3">
        <div>
          <Label for="v-attr" class="font-medium text-[#122b2e]">Attribute Name (e.g. Brand, Tier)</Label>
          <Input id="v-attr" bind:value={newVarAttribute} placeholder="e.g. Brand" class="h-9 text-xs mt-1" />
        </div>

        <div>
          <Label for="v-val" class="font-medium text-[#122b2e]">Attribute Value (e.g. Odoo)</Label>
          <Input id="v-val" bind:value={newVarValue} placeholder="e.g. Odoo Enterprise" class="h-9 text-xs mt-1" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <Label for="v-extra" class="font-medium text-[#122b2e]">Price Extra (+$)</Label>
            <Input id="v-extra" type="number" step="0.01" bind:value={newVarPriceExtra} class="h-9 text-xs mt-1" />
          </div>

          <div>
            <Label for="v-sku" class="font-medium text-[#122b2e]">SKU Code</Label>
            <Input id="v-sku" bind:value={newVarSku} placeholder="ERP-ODOO-560" class="h-9 text-xs mt-1" />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 mt-4">
        <Button variant="outline" size="xs" onclick={() => (showAddVariantModal = false)} class="rounded-xl">Cancel</Button>
        <Button size="xs" onclick={handleCreateVariant} class="bg-[#183f42] text-white rounded-xl">Attach Variant</Button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL: ADD PLAN (With Lifecycle Toggles) -->
{#if showAddPlanModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div class="flex items-center gap-2">
          <Layers class="w-4 h-4 text-[#183f42]" />
          <h3 class="font-bold text-[#122b2e]">Create Subscription Plan</h3>
        </div>
        <button onclick={() => (showAddPlanModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3">
        <div>
          <Label for="pl-name" class="font-medium text-[#122b2e]">Plan Name *</Label>
          <Input id="pl-name" bind:value={newPlanName} placeholder="e.g. Enterprise Annual Tier" class="h-9 text-xs mt-1" />
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div>
            <Label for="pl-freq" class="font-medium text-[#122b2e]">Billing Frequency</Label>
            <select id="pl-freq" bind:value={newPlanFrequency} class="w-full h-9 bg-[#f8fafb] border border-[#e5ecee] rounded-xl px-2 mt-1 text-xs">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <Label for="pl-price" class="font-medium text-[#122b2e]">Base Price ($)</Label>
            <Input id="pl-price" type="number" step="0.01" bind:value={newPlanPrice} class="h-9 text-xs mt-1" />
          </div>

          <div>
            <Label for="pl-qty" class="font-medium text-[#122b2e]">Min Qty</Label>
            <Input id="pl-qty" type="number" min="1" bind:value={newPlanMinQty} class="h-9 text-xs mt-1" />
          </div>
        </div>

        <!-- Lifecycle Toggles (Scene 2 Blueprint Requirement) -->
        <div class="p-3 bg-[#f8fafb] border border-[#e8eff0] rounded-xl space-y-2 mt-2">
          <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider block">
            Plan Lifecycle Rules:
          </span>
          <div class="grid grid-cols-2 gap-2 text-[11px]">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" bind:checked={newPlanAllowPause} class="rounded text-[#183f42] focus:ring-[#183f42]" />
              <span>Allow Pause</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" bind:checked={newPlanAllowEarlyClose} class="rounded text-[#183f42] focus:ring-[#183f42]" />
              <span>Allow Early Close</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" bind:checked={newPlanAllowRenewal} class="rounded text-[#183f42] focus:ring-[#183f42]" />
              <span>Allow Renewal</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" bind:checked={newPlanAutoClose} class="rounded text-[#183f42] focus:ring-[#183f42]" />
              <span>Auto-Close on End</span>
            </label>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 mt-4">
        <Button variant="outline" size="xs" onclick={() => (showAddPlanModal = false)} class="rounded-xl">Cancel</Button>
        <Button size="xs" onclick={handleCreatePlan} class="bg-[#183f42] text-white rounded-xl">Save Plan</Button>
      </div>
    </div>
  </div>
{/if}
