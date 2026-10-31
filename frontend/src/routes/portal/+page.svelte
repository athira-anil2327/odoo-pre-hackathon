<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { currentUser } from "$lib/stores/auth.js";
  import {
    subscriptionsStore,
    customersStore,
    plansStore,
    pauseSubscription,
    resumeSubscription
  } from "$lib/stores/coreManagement.js";
  import {
    Repeat,
    Receipt,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Clock,
    DollarSign,
    Pause,
    Play,
    ShieldCheck,
    Check,
    X,
    Building2,
    Mail,
    Phone
  } from "lucide-svelte";

  let showPayModal = $state(false);
  let isPaymentSuccess = $state(false);
  let actionMessage = $state("");

  function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(num);
  }

  // Find linked customer profile and their subscriptions
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

  function getPlanName(planId, fallback) {
    const p = $plansStore.find(plan => plan.id === planId);
    return p ? p.name : (fallback || "Enterprise Cloud Subscription");
  }

  function getPlanFrequency(planId, fallback) {
    const p = $plansStore.find(plan => plan.id === planId);
    return p ? p.billing_frequency : (fallback || "monthly");
  }

  function handleCustomerPause(subId) {
    try {
      pauseSubscription(subId, "Self-service pause requested by customer");
      actionMessage = "Subscription paused. Billing cycle suspended.";
    } catch (e) {
      actionMessage = e.message;
    }
  }

  function handleCustomerResume(subId) {
    try {
      resumeSubscription(subId, "Self-service resume requested by customer");
      actionMessage = "Subscription resumed. Service is active.";
    } catch (e) {
      actionMessage = e.message;
    }
  }
</script>

<AppShell title="Customer Self-Service Portal">
  <div class="space-y-6">
    <!-- Portal Welcome Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#edf2f3] gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-base font-bold text-[#122b2e] tracking-tight">{currentCustomer?.company || "My Enterprise Account"}</h2>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e6f4f2] text-[#143e42] border border-[#bde4df] uppercase">
            Client Portal
          </span>
        </div>
        <p class="text-xs text-[#7e9599] mt-0.5">
          Customer ID: <b>{currentCustomer?.customer_number}</b> • Contact: {currentCustomer?.name} ({currentCustomer?.email})
        </p>
      </div>

      <div class="flex items-center gap-2">
        <a href="/subscriptions">
          <Button variant="outline" size="xs" class="text-xs border-[#e2eaeb] text-[#586f73] hover:bg-[#f8fafb] rounded-xl gap-1">
            <Repeat class="w-3.5 h-3.5 text-[#183f42]" /> All Subscriptions
          </Button>
        </a>
      </div>
    </div>

    {#if actionMessage}
      <div class="p-3.5 rounded-xl bg-[#e6f4f2] border border-[#bde4df] text-[#143e42] text-xs flex items-center justify-between">
        <div class="flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 shrink-0 text-[#143e42]" />
          <span>{actionMessage}</span>
        </div>
        <button onclick={() => (actionMessage = "")} class="text-[#143e42]">
          <X class="w-4 h-4" />
        </button>
      </div>
    {/if}

    <!-- Active Subscription Card -->
    {#if activeSubscription}
      <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl overflow-hidden">
        <div class="p-5 border-b border-[#edf2f3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider">Current Active Plan</span>
            <div class="flex items-center gap-2 mt-1">
              <h3 class="text-lg font-bold text-[#122b2e]">
                {activeSubscription.plan_name || getPlanName(activeSubscription.plan_id)}
              </h3>
              <span class="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e6f4f2] text-[#143e42] border border-[#bde4df] uppercase">
                {activeSubscription.status}
              </span>
            </div>
            <p class="text-xs text-[#7e9599] mt-1">
              Contract #{activeSubscription.subscription_number} • Billed {activeSubscription.billing_frequency || getPlanFrequency(activeSubscription.plan_id)}
            </p>
          </div>

          <!-- Customer Self-Service Actions -->
          <div class="flex items-center gap-2">
            {#if activeSubscription.status?.toLowerCase() === "active"}
              <Button
                onclick={() => handleCustomerPause(activeSubscription.id)}
                variant="outline"
                size="xs"
                class="text-xs border-amber-300 text-amber-800 hover:bg-amber-50 rounded-xl gap-1"
              >
                <Pause class="w-3.5 h-3.5" /> Pause Plan
              </Button>
            {:else if activeSubscription.status?.toLowerCase() === "paused"}
              <Button
                onclick={() => handleCustomerResume(activeSubscription.id)}
                size="xs"
                class="text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl gap-1"
              >
                <Play class="w-3.5 h-3.5" /> Resume Plan
              </Button>
            {/if}
          </div>
        </div>

        <!-- Key Dates & Pricing Banner -->
        <div class="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#edf2f3] p-4 bg-[#f8fafb] text-xs">
          <div class="p-3">
            <div class="text-[#7e9599] text-[11px] flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-[#183f42]" /> Next Billing Date
            </div>
            <div class="text-sm font-bold text-[#122b2e] mt-1">
              {activeSubscription.next_billing_date ? new Date(activeSubscription.next_billing_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </div>
          </div>

          <div class="p-3">
            <div class="text-[#7e9599] text-[11px] flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-[#183f42]" /> Contract Expiry Date
            </div>
            <div class="text-sm font-bold text-[#122b2e] mt-1">
              {activeSubscription.expiry_date ? new Date(activeSubscription.expiry_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Perpetual"}
            </div>
          </div>

          <div class="p-3">
            <div class="text-[#7e9599] text-[11px] flex items-center gap-1.5">
              <DollarSign class="w-3.5 h-3.5 text-[#183f42]" /> Recurring Amount
            </div>
            <div class="text-base font-extrabold text-[#183f42] mt-0.5">
              {formatCurrency(activeSubscription.total_amount)}
              <span class="text-xs font-normal text-[#7e9599]">/{activeSubscription.billing_frequency || getPlanFrequency(activeSubscription.plan_id)}</span>
            </div>
          </div>
        </div>
      </Card.Root>
    {/if}

    <!-- All Subscriptions for this Customer -->
    <div class="space-y-3">
      <h3 class="text-sm font-bold text-[#122b2e]">All Subscriptions in this Account</h3>
      <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl overflow-hidden">
        <Card.Content class="p-3">
          <Table.Root>
            <Table.Header class="text-[#8c9ba5]">
              <Table.Row class="hover:bg-transparent border-[#edf2f3]">
                <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Subscription #</Table.Head>
                <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Plan Name</Table.Head>
                <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Cycle</Table.Head>
                <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Next Renewal</Table.Head>
                <Table.Head class="h-9 text-xs font-semibold px-4 text-right text-[#8c9ba5]">Recurring Fee</Table.Head>
                <Table.Head class="h-9 text-xs font-semibold px-4 text-center text-[#8c9ba5]">Status</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body class="text-xs">
              {#if mySubscriptions.length === 0}
                <Table.Row>
                  <Table.Cell colspan="6" class="text-center py-6 text-zinc-400">No subscriptions registered under this account.</Table.Cell>
                </Table.Row>
              {:else}
                {#each mySubscriptions as sub}
                  <Table.Row class="hover:bg-[#f8fafb] border-[#f4f7f8]">
                    <Table.Cell class="py-3 px-4 font-bold text-[#122b2e]">{sub.subscription_number || sub.id}</Table.Cell>
                    <Table.Cell class="py-3 px-4 font-medium text-[#122b2e]">
                      {sub.plan_name || getPlanName(sub.plan_id)}
                    </Table.Cell>
                    <Table.Cell class="py-3 px-4 text-[#586f73] capitalize">{sub.billing_frequency || getPlanFrequency(sub.plan_id)}</Table.Cell>
                    <Table.Cell class="py-3 px-4 text-[#7e9599]">
                      {sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </Table.Cell>
                    <Table.Cell class="py-3 px-4 text-right font-bold text-[#122b2e]">
                      {formatCurrency(sub.total_amount)}
                    </Table.Cell>
                    <Table.Cell class="py-3 px-4 text-center">
                      <span class={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        sub.status?.toLowerCase() === 'active'
                          ? 'bg-[#e6f4f2] text-[#143e42] border-[#bde4df]'
                          : sub.status?.toLowerCase() === 'confirmed'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : sub.status?.toLowerCase() === 'paused'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}>
                        {sub.status}
                      </span>
                    </Table.Cell>
                  </Table.Row>
                {/each}
              {/if}
            </Table.Body>
          </Table.Root>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</AppShell>
