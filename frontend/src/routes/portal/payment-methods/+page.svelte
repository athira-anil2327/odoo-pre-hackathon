<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import {
    CreditCard,
    Plus,
    Check,
    Trash2,
    ShieldCheck,
    Receipt,
    Building,
    X
  } from "lucide-svelte";

  let autoRenew = $state(true);
  let showAddModal = $state(false);

  let newCardNumber = $state("");
  let newCardExp = $state("");
  let newCardCvc = $state("");
  let newCardName = $state("");

  let paymentMethods = $state([
    {
      id: "pm_1",
      brand: "Visa",
      last4: "4242",
      exp: "08/2028",
      holder: "Sarah Jenkins",
      isDefault: true
    },
    {
      id: "pm_2",
      brand: "Mastercard",
      last4: "8812",
      exp: "11/2029",
      holder: "Apex Tech Ops",
      isDefault: false
    }
  ]);

  function setDefault(id) {
    paymentMethods = paymentMethods.map(pm => ({
      ...pm,
      isDefault: pm.id === id
    }));
  }

  function removeCard(id) {
    paymentMethods = paymentMethods.filter(pm => pm.id !== id);
  }

  function handleAddCard() {
    if (!newCardNumber) return;
    const last4 = newCardNumber.replace(/\s+/g, "").slice(-4) || "9910";
    paymentMethods.push({
      id: `pm_${Date.now()}`,
      brand: "Visa",
      last4,
      exp: newCardExp || "12/2029",
      holder: newCardName || "Sarah Jenkins",
      isDefault: false
    });
    newCardNumber = "";
    newCardExp = "";
    newCardCvc = "";
    newCardName = "";
    showAddModal = false;
  }
</script>

<AppShell title="Payment Methods & Billing Settings">
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-zinc-900 tracking-tight">Payment Methods & Auto-Billing</h2>
        <p class="text-xs text-zinc-500 mt-1">
          Manage saved credit cards, corporate payment instruments, and automated subscription renewal.
        </p>
      </div>

      <Button
        onclick={() => (showAddModal = true)}
        size="sm"
        class="gradient-magenta text-white glow-magenta-xs text-xs h-8"
      >
        <Plus class="w-3.5 h-3.5 mr-1" /> Add Payment Method
      </Button>
    </div>

    <!-- Auto Renew Banner -->
    <div class="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl gradient-magenta text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldCheck class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-xs font-bold text-zinc-900">Automatic Subscription Renewal</h4>
          <p class="text-[11px] text-zinc-500 mt-0.5">
            Your Enterprise Cloud license will automatically renew on Nov 28, 2026 using your default payment method.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs font-medium text-zinc-600">{autoRenew ? "Enabled" : "Disabled"}</span>
        <button
          onclick={() => (autoRenew = !autoRenew)}
          class={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            autoRenew ? 'bg-fuchsia-600' : 'bg-zinc-200'
          }`}
          role="switch"
          aria-checked={autoRenew}
          aria-label="Toggle automatic subscription renewal"
        >
          <span
            class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              autoRenew ? 'translate-x-5' : 'translate-x-0'
            }`}
          ></span>
        </button>
      </div>
    </div>

    <!-- Saved Cards List -->
    <div>
      <h3 class="text-sm font-bold text-zinc-900 mb-3">Saved Payment Instruments</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each paymentMethods as card}
          <div class={`p-5 rounded-2xl bg-white border transition-all ${
            card.isDefault
              ? "border-fuchsia-400 shadow-md ring-1 ring-fuchsia-200"
              : "border-zinc-200/80 shadow-xs hover:border-zinc-300"
          }`}>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <CreditCard class="w-4 h-4 text-zinc-700" />
                </div>
                <span class="font-bold text-sm text-zinc-900">{card.brand}</span>
              </div>
              {#if card.isDefault}
                <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
                  Default
                </span>
              {/if}
            </div>

            <div class="font-mono text-base font-semibold text-zinc-800 tracking-wider mb-2">
              •••• •••• •••• {card.last4}
            </div>

            <div class="flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-100 pt-3">
              <div>
                <span class="block text-[10px] uppercase tracking-wider text-zinc-400">Cardholder</span>
                <span class="font-medium text-zinc-800">{card.holder}</span>
              </div>
              <div class="text-right">
                <span class="block text-[10px] uppercase tracking-wider text-zinc-400">Expires</span>
                <span class="font-medium text-zinc-800">{card.exp}</span>
              </div>
            </div>

            <div class="flex items-center justify-between pt-4 mt-3 border-t border-zinc-100">
              {#if !card.isDefault}
                <button
                  onclick={() => setDefault(card.id)}
                  class="text-xs font-semibold text-fuchsia-600 hover:text-fuchsia-700 transition-colors"
                >
                  Set as Default
                </button>
                <button
                  onclick={() => removeCard(card.id)}
                  class="text-zinc-400 hover:text-rose-600 p-1 rounded transition-colors"
                  title="Remove Card"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              {:else}
                <span class="text-[11px] text-zinc-400">Active billing instrument</span>
                <span class="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check class="w-3 h-3" /> Verified
                </span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Corporate Tax & Billing Profile -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden p-5">
      <div class="flex items-center gap-2 mb-4">
        <Building class="w-4 h-4 text-fuchsia-600" />
        <h3 class="text-sm font-bold text-zinc-900">Billing Address & Tax Registration</h3>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70">
          <span class="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Registered Entity</span>
          <div class="font-semibold text-zinc-900 mt-1">Apex Global Technologies Ltd.</div>
          <div class="text-zinc-500 mt-0.5">884 Enterprise Way, Suite 400<br/>San Francisco, CA 94107, USA</div>
        </div>

        <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70">
          <span class="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Tax Registration (GST / VAT)</span>
          <div class="font-mono font-semibold text-zinc-900 mt-1">US-EIN-882910399</div>
          <div class="text-zinc-500 mt-0.5">Standard 10% B2B digital services tax bracket applied automatically to invoices.</div>
        </div>
      </div>
    </Card.Root>

    <!-- Add Card Modal -->
    {#if showAddModal}
      <div class="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div class="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <CreditCard class="w-4 h-4 text-fuchsia-600" />
              <h3 class="text-sm font-bold text-zinc-900">Add Payment Card</h3>
            </div>
            <button onclick={() => (showAddModal = false)} class="p-1 rounded-md text-zinc-400 hover:text-zinc-600">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="p-5 space-y-4 text-xs">
            <div class="space-y-1">
              <Label class="text-zinc-700 font-medium">Cardholder Name</Label>
              <Input
                bind:value={newCardName}
                placeholder="Sarah Jenkins"
                class="h-8 text-xs bg-zinc-50 border-zinc-200 rounded-lg"
              />
            </div>

            <div class="space-y-1">
              <Label class="text-zinc-700 font-medium">Card Number</Label>
              <Input
                bind:value={newCardNumber}
                placeholder="4000 1234 5678 9010"
                class="h-8 text-xs bg-zinc-50 border-zinc-200 rounded-lg font-mono"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <Label class="text-zinc-700 font-medium">Expiration</Label>
                <Input
                  bind:value={newCardExp}
                  placeholder="MM/YY"
                  class="h-8 text-xs bg-zinc-50 border-zinc-200 rounded-lg"
                />
              </div>
              <div class="space-y-1">
                <Label class="text-zinc-700 font-medium">Security CVC</Label>
                <Input
                  bind:value={newCardCvc}
                  placeholder="•••"
                  class="h-8 text-xs bg-zinc-50 border-zinc-200 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          <div class="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onclick={() => (showAddModal = false)} class="text-xs h-8">
              Cancel
            </Button>
            <Button size="sm" onclick={handleAddCard} class="gradient-magenta text-white text-xs h-8 glow-magenta-xs">
              Save Card
            </Button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</AppShell>