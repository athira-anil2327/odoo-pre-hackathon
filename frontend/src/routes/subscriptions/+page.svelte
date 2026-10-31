<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import {
    subscriptionsStore,
    customersStore,
    plansStore,
    eventsStore,
    activateSubscription,
    pauseSubscription,
    resumeSubscription,
    closeSubscription,
    renewSubscription
  } from "$lib/stores/coreManagement.js";
  import {
    Plus,
    Eye,
    Pause,
    Play,
    RotateCw,
    XCircle,
    CheckCircle2,
    Calendar,
    Clock,
    DollarSign,
    AlertCircle,
    X,
    Repeat,
    Layers,
    History,
    ShieldAlert,
    Check
  } from "lucide-svelte";

  // Filter tabs: "All", "Confirmed", "Active", "Paused", "Closed"
  let statusFilter = $state("All");

  // Audit History Modal & Pause/Close Modals
  let showHistoryModal = $state(false);
  let showPauseModal = $state(false);
  let showCloseModal = $state(false);
  let selectedSub = $state(null);
  let pauseReason = $state("Customer temporary seasonal pause");
  let closeReason = $state("Customer contract termination");

  // Notifications
  let actionError = $state("");
  let actionSuccess = $state("");

  const filteredSubscriptions = $derived(
    statusFilter === "All"
      ? $subscriptionsStore
      : $subscriptionsStore.filter(s => s.status.toLowerCase() === statusFilter.toLowerCase())
  );

  function getCustomerName(customerId) {
    const c = $customersStore.find(cust => cust.id === customerId);
    return c ? `${c.name} (${c.company})` : customerId;
  }

  function handleActivate(subId) {
    actionError = "";
    actionSuccess = "";
    try {
      activateSubscription(subId);
      actionSuccess = `Subscription ${subId} successfully ACTIVATED! Next billing date scheduled automatically based on plan frequency.`;
    } catch (e) {
      actionError = e.message;
    }
  }

  function handleOpenPause(sub) {
    actionError = "";
    selectedSub = sub;
    showPauseModal = true;
  }

  function handleConfirmPause() {
    actionError = "";
    actionSuccess = "";
    if (!selectedSub) return;
    try {
      pauseSubscription(selectedSub.id, pauseReason);
      actionSuccess = `Subscription ${selectedSub.id} moved to PAUSED. Verified plan.allow_pause = true.`;
      showPauseModal = false;
    } catch (e) {
      actionError = e.message;
      showPauseModal = false;
    }
  }

  function handleResume(subId) {
    actionError = "";
    actionSuccess = "";
    try {
      resumeSubscription(subId);
      actionSuccess = `Subscription ${subId} RESUMED and returned to Active state.`;
    } catch (e) {
      actionError = e.message;
    }
  }

  function handleOpenClose(sub) {
    actionError = "";
    selectedSub = sub;
    showCloseModal = true;
  }

  function handleConfirmClose() {
    actionError = "";
    actionSuccess = "";
    if (!selectedSub) return;
    try {
      closeSubscription(selectedSub.id, closeReason);
      actionSuccess = `Subscription ${selectedSub.id} successfully CLOSED. Verified plan.allow_early_close policy.`;
      showCloseModal = false;
    } catch (e) {
      actionError = e.message;
      showCloseModal = false;
    }
  }

  function handleRenew(subId) {
    actionError = "";
    actionSuccess = "";
    try {
      const renewed = renewSubscription(subId);
      actionSuccess = `Subscription renewed into ${renewed.subscription_number}! Linked via renewed_from_subscription_id = ${subId}.`;
    } catch (e) {
      actionError = e.message;
    }
  }

  function handleOpenHistory(sub) {
    selectedSub = sub;
    showHistoryModal = true;
  }

  const subEvents = $derived(
    selectedSub
      ? $eventsStore.filter(e => e.subscription_id === selectedSub.id)
      : []
  );
</script>

<AppShell title="Subscription Contracts">
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#edf2f3] gap-4">
      <div>
        <h2 class="text-base font-bold text-[#122b2e] tracking-tight">Active Subscriptions &amp; State Machine</h2>
        <p class="text-xs text-[#7e9599] mt-0.5">
          Sequential lifecycle enforcement: Confirmed &rarr; Active &harr; Paused &rarr; Closed, with automated billing scheduling &amp; event audit logs.
        </p>
      </div>

      <!-- Status Filters -->
      <div class="bg-[#f2f7f7] p-1 rounded-xl flex items-center border border-[#dde7e8] text-xs">
        {#each ["All", "Confirmed", "Active", "Paused", "Closed"] as tab}
          <button
            onclick={() => (statusFilter = tab)}
            class={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              statusFilter === tab
                ? "bg-[#183f42] text-white shadow-xs"
                : "text-[#586f73] hover:text-[#122b2e]"
            }`}
          >
            {tab}
          </button>
        {/each}
      </div>
    </div>

    <!-- Alert Notifications -->
    {#if actionError}
      <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
        <div class="flex items-center gap-2">
          <ShieldAlert class="w-4 h-4 shrink-0 text-rose-600" />
          <span><b>Lifecycle Constraint Violation:</b> {actionError}</span>
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

    <!-- Table -->
    <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl overflow-hidden">
      <Card.Content class="p-3">
        <Table.Root>
          <Table.Header class="text-[#8c9ba5]">
            <Table.Row class="hover:bg-transparent border-[#edf2f3]">
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Subscription #</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Customer</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Plan</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Frequency</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Next Billing</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right text-[#8c9ba5]">Recurring Fee</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center text-[#8c9ba5]">Status</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right text-[#8c9ba5]">Lifecycle Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs">
            {#each filteredSubscriptions as sub}
              <Table.Row class="transition-all hover:bg-[#f8fafb] border-[#f4f7f8]">
                <Table.Cell class="py-3 px-4 font-bold text-[#122b2e]">
                  {sub.subscription_number}
                  {#if sub.renewed_from_subscription_id}
                    <div class="text-[10px] text-teal-700 font-normal">
                      Renewed from: {sub.renewed_from_subscription_id}
                    </div>
                  {/if}
                </Table.Cell>
                <Table.Cell class="py-3 px-4 font-semibold text-[#122b2e]">
                  {getCustomerName(sub.customer_id)}
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-[#122b2e]">{sub.plan_name}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-[#586f73] font-medium capitalize">{sub.billing_frequency}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-[#7e9599]">
                  {#if sub.next_billing_date}
                    <span class="inline-flex items-center gap-1 font-semibold text-[#143e42] bg-[#e6f4f2] px-2 py-0.5 rounded border border-[#bde4df]">
                      <Calendar class="w-3 h-3" /> {sub.next_billing_date}
                    </span>
                  {:else}
                    <span class="text-zinc-400">Awaiting Activation</span>
                  {/if}
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-right font-bold text-[#122b2e]">
                  ${Number(sub.total_amount).toFixed(2)}
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-center">
                  <span class={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    sub.status === 'Active'
                      ? 'bg-[#e6f4f2] text-[#143e42] border-[#bde4df]'
                      : sub.status === 'Confirmed'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : sub.status === 'Paused'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}>
                    {sub.status}
                  </span>
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Action 1: Audit History (Eye) -->
                    <button
                      onclick={() => handleOpenHistory(sub)}
                      class="p-1 rounded text-zinc-400 hover:text-[#183f42] hover:bg-[#e6f4f2]/50 transition-colors"
                      title="View Event Audit Trail"
                    >
                      <History class="w-4 h-4" />
                    </button>

                    <!-- Action 2: Activate (Confirmed -> Active) -->
                    {#if sub.status === 'Confirmed'}
                      <Button
                        onclick={() => handleActivate(sub.id)}
                        size="xs"
                        class="h-7 text-[11px] bg-[#183f42] hover:bg-[#123033] text-white rounded-lg gap-1 shadow-xs"
                      >
                        <Play class="w-3 h-3" /> Activate
                      </Button>
                    {/if}

                    <!-- Action 3: Pause (Active -> Paused) -->
                    {#if sub.status === 'Active'}
                      <Button
                        onclick={() => handleOpenPause(sub)}
                        variant="outline"
                        size="xs"
                        class="h-7 text-[11px] border-amber-300 text-amber-800 hover:bg-amber-50 rounded-lg gap-1"
                        title="Pause Subscription"
                      >
                        <Pause class="w-3 h-3" /> Pause
                      </Button>
                    {/if}

                    <!-- Action 4: Resume (Paused -> Active) -->
                    {#if sub.status === 'Paused'}
                      <Button
                        onclick={() => handleResume(sub.id)}
                        size="xs"
                        class="h-7 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg gap-1"
                        title="Resume Subscription"
                      >
                        <Play class="w-3 h-3" /> Resume
                      </Button>
                    {/if}

                    <!-- Action 5: Renew (Active -> New Subscription) -->
                    {#if sub.status === 'Active'}
                      <Button
                        onclick={() => handleRenew(sub.id)}
                        variant="outline"
                        size="xs"
                        class="h-7 text-[11px] border-[#bde4df] text-[#143e42] hover:bg-[#e6f4f2] rounded-lg gap-1"
                        title="Renew Subscription"
                      >
                        <RotateCw class="w-3 h-3" /> Renew
                      </Button>
                    {/if}

                    <!-- Action 6: Early Close (Active -> Closed) -->
                    {#if sub.status === 'Active' || sub.status === 'Paused'}
                      <button
                        onclick={() => handleOpenClose(sub)}
                        class="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Early Termination / Close"
                      >
                        <XCircle class="w-4 h-4" />
                      </button>
                    {/if}
                  </div>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </Card.Content>
    </Card.Root>
  </div>
</AppShell>

<!-- MODAL: AUDIT EVENT LOG TIMELINE -->
{#if showHistoryModal && selectedSub}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-lg w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div class="flex items-center gap-2">
          <History class="w-4 h-4 text-[#183f42]" />
          <div>
            <h3 class="font-bold text-[#122b2e] text-sm">{selectedSub.subscription_number} Audit Log</h3>
            <p class="text-[11px] text-[#7e9599]">Full state transition history from <code>subscription_events</code></p>
          </div>
        </div>
        <button onclick={() => (showHistoryModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3">
        {#if subEvents.length > 0}
          <div class="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e2eaeb]">
            {#each subEvents as evt}
              <div class="relative">
                <div class="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#183f42] ring-4 ring-[#e6f4f2]"></div>
                <div class="p-3 bg-[#f8fafb] border border-[#edf2f3] rounded-xl text-xs space-y-1">
                  <div class="flex items-center justify-between font-bold text-[#122b2e]">
                    <span class="capitalize font-semibold text-[#183f42]">{evt.event_type}</span>
                    <span class="text-[10px] text-[#7e9599]">{evt.timestamp}</span>
                  </div>
                  <div class="text-[11px] text-[#586f73]">
                    Transition: <span class="font-semibold text-zinc-600">{evt.from_status}</span> &rarr; <span class="font-bold text-[#143e42]">{evt.to_status}</span>
                  </div>
                  <div class="text-[11px] text-[#122b2e] bg-white p-2 rounded-lg border border-[#eef2f3]">
                    {evt.reason}
                  </div>
                  <div class="text-[10px] text-[#7e9599]">
                    Actor: <b>{evt.performed_by}</b>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="p-4 bg-[#f8fafb] border border-dashed border-[#e2eaeb] rounded-xl text-center text-[#7e9599]">
            No recorded transitions for this contract yet.
          </div>
        {/if}
      </div>

      <div class="flex items-center justify-end pt-3 border-t border-zinc-100 mt-4">
        <Button size="xs" onclick={() => (showHistoryModal = false)} class="bg-[#183f42] text-white rounded-xl">Close</Button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL: PAUSE SUBSCRIPTION (Checks plan.allow_pause) -->
{#if showPauseModal && selectedSub}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-sm w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div class="flex items-center gap-2">
          <Pause class="w-4 h-4 text-amber-700" />
          <h3 class="font-bold text-[#122b2e]">Pause Subscription</h3>
        </div>
        <button onclick={() => (showPauseModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3">
        <p class="text-[#586f73] leading-relaxed">
          Verifying <code>plan.allow_pause</code> lifecycle toggle before moving contract into <b>Paused</b> state.
        </p>

        <div>
          <Label for="p-reason" class="font-medium text-[#122b2e]">Pause Reason</Label>
          <Input id="p-reason" bind:value={pauseReason} class="h-9 text-xs mt-1" />
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 mt-4">
        <Button variant="outline" size="xs" onclick={() => (showPauseModal = false)} class="rounded-xl">Cancel</Button>
        <Button size="xs" onclick={handleConfirmPause} class="bg-amber-700 hover:bg-amber-800 text-white rounded-xl">Confirm Pause</Button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL: CLOSE EARLY SUBSCRIPTION (Checks plan.allow_early_close) -->
{#if showCloseModal && selectedSub}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-sm w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div class="flex items-center gap-2">
          <XCircle class="w-4 h-4 text-rose-600" />
          <h3 class="font-bold text-[#122b2e]">Early Termination / Close</h3>
        </div>
        <button onclick={() => (showCloseModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3">
        <p class="text-[#586f73] leading-relaxed">
          Closing subscription before its expiry date ({selectedSub.expiry_date}). System will enforce <code>plan.allow_early_close</code>.
        </p>

        <div>
          <Label for="c-reason" class="font-medium text-[#122b2e]">Closure Reason</Label>
          <Input id="c-reason" bind:value={closeReason} class="h-9 text-xs mt-1" />
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 mt-4">
        <Button variant="outline" size="xs" onclick={() => (showCloseModal = false)} class="rounded-xl">Cancel</Button>
        <Button size="xs" onclick={handleConfirmClose} class="bg-rose-700 hover:bg-rose-800 text-white rounded-xl">Terminate Contract</Button>
      </div>
    </div>
  </div>
{/if}
