<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import {
    Repeat,
    Check,
    ArrowUpRight,
    Sparkles,
    ShieldCheck,
    Users,
    X,
    FileText
  } from "lucide-svelte";
  import { currentUser } from "$lib/stores/auth.js";
  import {
    subscriptionsStore,
    customersStore,
    plansStore
  } from "$lib/stores/coreManagement.js";

  let showUpgradeModal = $state(false);
  let selectedPlanId = $state("");

  function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(num);
  }

  // Find linked customer profile
  const currentCustomer = $derived(
    $customersStore.find(c => c.email?.toLowerCase() === ($currentUser?.email || "").toLowerCase()) ||
    $customersStore[0]
  );

  const mySubscriptions = $derived(
    currentCustomer
      ? $subscriptionsStore.filter(s => s.customer_id === currentCustomer.id)
      : []
  );

  const activeSubscription = $derived(
    mySubscriptions.find(s => s.status?.toLowerCase() === "active") || mySubscriptions[0]
  );

  const activePlan = $derived(
    activeSubscription ? $plansStore.find(p => p.id === activeSubscription.plan_id) : null
  );

  const displayPlans = $derived(
    $plansStore.map(p => {
      const isCurrent = activeSubscription?.plan_id === p.id;
      const features = p.billing_frequency === "yearly"
        ? ["Unlimited Seats Allocation", "24/7 SLA Priority Support", "SOC-2 Compliance Vault", "Dedicated Account Manager"]
        : p.name.includes("Growth")
        ? ["Full Enterprise ERP Module", "Automated Invoicing Engine", "Email & Chat Support", "Standard API Access"]
        : ["Core Billing & Invoicing", "Up to 5 Users", "Standard GST Computation", "Community Support"];

      return {
        id: p.id,
        name: p.name,
        price: formatCurrency(p.price),
        period: `/${p.billing_frequency === 'yearly' ? 'year' : 'month'}`,
        desc: p.name.includes("Enterprise")
          ? "Comprehensive annual contract for scaling enterprise operations"
          : p.name.includes("Growth")
          ? "Our complete software platform for scaling businesses"
          : "Essential starter features for small teams",
        features,
        current: isCurrent
      };
    })
  );
</script>

<AppShell title="My Subscriptions & Plan">
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-zinc-900 tracking-tight">Subscription Plan & Entitlements</h2>
        <p class="text-xs text-zinc-500 mt-1">
          Review your active software license, manage subscription tiers, and upgrade platform capacity.
        </p>
      </div>

      <Button
        onclick={() => (showUpgradeModal = true)}
        size="sm"
        class="bg-[#183f42] text-white shadow-xs text-xs h-8"
      >
        <Sparkles class="w-3.5 h-3.5 mr-1" /> Change / Upgrade Plan
      </Button>
    </div>

    <!-- Active Subscription Highlight Card -->
    {#if activeSubscription}
      <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden p-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-[#183f42] uppercase tracking-wider">
                Contract: {activeSubscription.subscription_number || activeSubscription.id}
              </span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                {activeSubscription.status}
              </span>
            </div>
            <h3 class="text-2xl font-bold text-zinc-900">
              {activePlan?.name || "Enterprise Cloud Plan"}
            </h3>
            <p class="text-xs text-zinc-500 max-w-xl leading-relaxed">
              Licensed to {currentCustomer?.company || currentCustomer?.name || "Corporate Account"}. Recurring automated billing terms managed via Brightloop platform.
            </p>
            <div class="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-600">
              <div class="flex items-center gap-1.5">
                <ShieldCheck class="w-4 h-4 text-emerald-600" />
                <span>99.9% Uptime SLA</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Users class="w-4 h-4 text-[#183f42]" />
                <span>GST Tax ID: {currentCustomer?.tax_id || "GST Verified"}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Repeat class="w-4 h-4 text-blue-600" />
                <span>
                  Next Billing Date: {activeSubscription.next_billing_date ? new Date(activeSubscription.next_billing_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div class="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-right shrink-0 min-w-56">
            <div class="text-xs text-zinc-400">Total Recurring Rate</div>
            <div class="text-2xl font-bold text-zinc-900 mt-1">
              {formatCurrency(activeSubscription.total_amount)}
              <span class="text-xs font-normal text-zinc-500">/mo</span>
            </div>
            <div class="text-[11px] text-zinc-400 mt-0.5">
              Payment Terms: {activeSubscription.payment_terms || "Net 30"}
            </div>
            <Button
              size="sm"
              onclick={() => (showUpgradeModal = true)}
              class="bg-[#183f42] text-white shadow-xs text-xs h-8 mt-3 w-full"
            >
              Modify Tier
            </Button>
          </div>
        </div>
      </Card.Root>
    {:else}
      <Card.Root class="p-8 text-center bg-white border-zinc-200/80 rounded-xl">
        <p class="text-xs text-zinc-500">No active subscription found for your customer account.</p>
      </Card.Root>
    {/if}

    <!-- Available Plans Comparison -->
    <div>
      <h3 class="text-sm font-bold text-zinc-900 mb-3">Available Platform Tiers</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        {#each displayPlans as plan}
          <div class={`rounded-2xl p-5 border bg-white flex flex-col justify-between transition-all ${
            plan.current
              ? "border-[#183f42] shadow-md ring-1 ring-[#bde4df]"
              : "border-zinc-200/80 shadow-xs hover:border-zinc-300"
          }`}>
            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-bold text-zinc-900">{plan.name}</h4>
                {#if plan.current}
                  <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]">
                    Current
                  </span>
                {/if}
              </div>
              <div class="text-xs text-zinc-500 mb-4">{plan.desc}</div>

              <div class="mb-4">
                <span class="text-2xl font-bold text-zinc-900">{plan.price}</span>
                <span class="text-xs text-zinc-400">{plan.period}</span>
              </div>

              <div class="space-y-2 text-xs border-t border-zinc-100 pt-4">
                {#each plan.features as feat}
                  <div class="flex items-center gap-2 text-zinc-600">
                    <Check class="w-3.5 h-3.5 text-[#183f42] shrink-0" />
                    <span>{feat}</span>
                  </div>
                {/each}
              </div>
            </div>

            <div class="pt-6">
              {#if plan.current}
                <Button disabled class="w-full text-xs h-8 bg-zinc-100 text-zinc-400">
                  Current Active Plan
                </Button>
              {:else}
                <Button
                  variant="outline"
                  onclick={() => {
                    selectedPlanId = plan.id;
                    showUpgradeModal = true;
                  }}
                  class="w-full text-xs h-8 border-zinc-200 hover:border-[#bde4df] hover:bg-[#e6f4f2]/50"
                >
                  Select Plan
                </Button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Upgrade Request Modal -->
    {#if showUpgradeModal}
      <div class="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div class="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-[#183f42]" />
              <h3 class="text-sm font-bold text-zinc-900">Request Plan Tier Upgrade</h3>
            </div>
            <button onclick={() => (showUpgradeModal = false)} class="p-1 rounded-md text-zinc-400 hover:text-zinc-600">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="p-5 space-y-4 text-xs">
            <p class="text-zinc-600">
              Select the plan you wish to switch to. Your dedicated Account Executive (Marcus Brody) will confirm prorated adjustments.
            </p>

            <div class="space-y-2">
              {#each displayPlans as p}
                <button
                  type="button"
                  onclick={() => (selectedPlanId = p.id)}
                  class={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedPlanId === p.id
                      ? "border-[#183f42] bg-[#e6f4f2]/40 ring-1 ring-[#183f42]/30"
                      : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50"
                  }`}
                >
                  <div>
                    <div class="font-bold text-zinc-900">{p.name}</div>
                    <div class="text-[11px] text-zinc-500">{p.price} {p.period}</div>
                  </div>
                  {#if selectedPlanId === p.id}
                    <Check class="w-4 h-4 text-[#183f42]" />
                  {/if}
                </button>
              {/each}
            </div>
          </div>

          <div class="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onclick={() => (showUpgradeModal = false)} class="text-xs h-8">
              Cancel
            </Button>
            <Button size="sm" onclick={() => (showUpgradeModal = false)} class="bg-[#183f42] text-white text-xs h-8 shadow-xs">
              Confirm Change Request
            </Button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</AppShell>
