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

  let showUpgradeModal = $state(false);
  let selectedPlan = $state("Enterprise Suite");

  const plans = [
    {
      name: "Starter Cloud",
      price: "$1,800",
      period: "/month",
      desc: "For small teams getting started",
      features: ["Up to 5 Team Seats", "Standard API Access", "Email Support", "10 GB Storage"],
      current: false
    },
    {
      name: "Enterprise Suite",
      price: "$4,200",
      period: "/month",
      desc: "Our complete platform for scaling businesses",
      features: ["Up to 25 Team Seats", "Unlimited API Calls", "24/7 Priority Support", "500 GB Storage", "SSO & SAML Auth", "Audit Logging"],
      current: true
    },
    {
      name: "Dedicated Cloud",
      price: "$8,900",
      period: "/month",
      desc: "Isolated instance with custom SLAs",
      features: ["Unlimited Team Seats", "Custom Integrations", "Dedicated Account Manager", "99.99% Uptime SLA", "Custom Backup Policies"],
      current: false
    }
  ];
</script>

<AppShell title="My Subscriptions & Plan">
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-zinc-900 tracking-tight">Subscription Plan & Entitlements</h2>
        <p class="text-xs text-zinc-500 mt-1">
          Review your active software license, manage team seat allocation, and upgrade tiers.
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
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden p-6">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-[#183f42] uppercase tracking-wider">Active Contract</span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Auto-Renewing
            </span>
          </div>
          <h3 class="text-2xl font-bold text-zinc-900">Enterprise Cloud Plan</h3>
          <p class="text-xs text-zinc-500 max-w-xl leading-relaxed">
            Annual subscription with monthly billing cycles. Includes full enterprise modules, SOC-2 compliance, custom webhooks, and 25 seats.
          </p>
          <div class="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-600">
            <div class="flex items-center gap-1.5">
              <ShieldCheck class="w-4 h-4 text-emerald-600" />
              <span>99.9% Uptime Guarantee</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Users class="w-4 h-4 text-[#183f42]" />
              <span>18 of 25 Seats Active</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Repeat class="w-4 h-4 text-blue-600" />
              <span>Next Renewal: Nov 28, 2026</span>
            </div>
          </div>
        </div>

        <div class="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-right shrink-0">
          <div class="text-xs text-zinc-400">Recurring Price</div>
          <div class="text-2xl font-bold text-zinc-900 mt-1">$4,200.00 <span class="text-xs font-normal text-zinc-500">/mo</span></div>
          <div class="text-[11px] text-zinc-400 mt-0.5">Billed to Visa •••• 4242</div>
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

    <!-- Available Plans Comparison -->
    <div>
      <h3 class="text-sm font-bold text-zinc-900 mb-3">Available Platform Tiers</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        {#each plans as plan}
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
                  onclick={() => (showUpgradeModal = true)}
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
              {#each plans as p}
                <button
                  type="button"
                  onclick={() => (selectedPlan = p.name)}
                  class={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedPlan === p.name
                      ? "border-[#183f42] bg-[#e6f4f2]/40 ring-1 ring-[#183f42]/30"
                      : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50"
                  }`}
                >
                  <div>
                    <div class="font-bold text-zinc-900">{p.name}</div>
                    <div class="text-[11px] text-zinc-500">{p.price} {p.period}</div>
                  </div>
                  {#if selectedPlan === p.name}
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