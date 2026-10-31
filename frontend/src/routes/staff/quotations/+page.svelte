<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import {
    Plus,
    Search,
    FileText,
    Send,
    CheckCircle,
    AlertTriangle,
    Eye,
    X,
    Check
  } from "lucide-svelte";

  let searchQuery = $state("");
  let showCreateModal = $state(false);

  // Form state
  let customerName = $state("CloudSphere AI");
  let planSelected = $state("Enterprise Suite");
  let discountPct = $state(10);
  let basePrice = $state(12400);

  let calculatedTotal = $derived(
    basePrice - (basePrice * (discountPct / 100))
  );

  let requiresApproval = $derived(discountPct > 15);

  let quotations = $state([
    {
      id: "QT-2026-088",
      customer: "CloudSphere AI",
      plan: "Enterprise Suite",
      discount: "10%",
      subtotal: "₹12,400.00",
      total: "₹11,160.00",
      date: "Oct 28, 2026",
      status: "Sent",
      statusColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
    },
    {
      id: "QT-2026-089",
      customer: "BioSynth Labs",
      plan: "Growth Cloud",
      discount: "5%",
      subtotal: "₹6,800.00",
      total: "₹6,460.00",
      date: "Oct 29, 2026",
      status: "In Review",
      statusColor: "bg-amber-50 text-amber-700 border-amber-200"
    },
    {
      id: "QT-2026-090",
      customer: "Apex Global Tech",
      plan: "Seat Expansion (x10)",
      discount: "0%",
      subtotal: "₹4,500.00",
      total: "₹4,500.00",
      date: "Oct 30, 2026",
      status: "Draft",
      statusColor: "bg-zinc-100 text-zinc-700 border-zinc-200"
    },
    {
      id: "QT-2026-091",
      customer: "Acme Logistics",
      plan: "Standard Cloud",
      discount: "15%",
      subtotal: "₹14,500.00",
      total: "₹12,325.00",
      date: "Oct 24, 2026",
      status: "Accepted",
      statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    }
  ]);

  function handleSaveQuote() {
    const newQuote = {
      id: `QT-2026-0${92 + quotations.length}`,
      customer: customerName,
      plan: planSelected,
      discount: `${discountPct}%`,
      subtotal: `₹${basePrice.toLocaleString()}.00`,
      total: `₹${calculatedTotal.toLocaleString()}.00`,
      date: "Just now",
      status: requiresApproval ? "Pending Approval" : "Draft",
      statusColor: requiresApproval
        ? "bg-purple-50 text-purple-700 border-purple-200"
        : "bg-zinc-100 text-zinc-700 border-zinc-200"
    };
    quotations = [newQuote, ...quotations];
    showCreateModal = false;
  }
</script>

<AppShell title="Quotations & Proposals">
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-zinc-900 tracking-tight">Staff Quotation Pipeline</h2>
        <p class="text-xs text-zinc-500 mt-1">
          Draft contract proposals, configure client discounts, and submit quotes for enterprise sign-off.
        </p>
      </div>

      <Button
        onclick={() => (showCreateModal = true)}
        size="sm"
        class="bg-[#183f42] text-white shadow-xs text-xs h-8"
      >
        <Plus class="w-3.5 h-3.5 mr-1" /> Create Quotation
      </Button>
    </div>

    <!-- Quotations Table -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <div class="p-3 border-b border-zinc-100 flex items-center justify-between">
        <div class="relative w-72">
          <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <Input
            type="text"
            placeholder="Search quotations..."
            bind:value={searchQuery}
            class="h-8 pl-9 text-xs bg-zinc-50/70 border-zinc-200 rounded-lg"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left">
          <thead class="bg-zinc-50/80 text-zinc-500 font-semibold border-b border-zinc-200/80">
            <tr>
              <th class="py-3 px-4">Quote ID</th>
              <th class="py-3 px-4">Customer Account</th>
              <th class="py-3 px-4">Plan / Package</th>
              <th class="py-3 px-4 text-center">Discount</th>
              <th class="py-3 px-4 text-right">Quote Total</th>
              <th class="py-3 px-4">Date</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            {#each quotations as quote}
              <tr class="hover:bg-zinc-50/70 transition-colors">
                <td class="py-3 px-4 font-mono font-medium text-zinc-900">{quote.id}</td>
                <td class="py-3 px-4 font-semibold text-zinc-900">{quote.customer}</td>
                <td class="py-3 px-4 text-zinc-600">{quote.plan}</td>
                <td class="py-3 px-4 text-center text-zinc-500">{quote.discount}</td>
                <td class="py-3 px-4 text-right font-semibold text-zinc-900">{quote.total}</td>
                <td class="py-3 px-4 text-zinc-500">{quote.date}</td>
                <td class="py-3 px-4">
                  <span class={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${quote.statusColor}`}>
                    {quote.status}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button class="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors" title="View Proposal">
                      <Eye class="w-3.5 h-3.5" />
                    </button>
                    <button class="p-1 rounded text-zinc-400 hover:text-[#183f42] hover:bg-[#e6f4f2]/60 transition-colors" title="Send to Customer">
                      <Send class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card.Root>

    <!-- Create Quotation Modal -->
    {#if showCreateModal}
      <div class="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div class="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <FileText class="w-4 h-4 text-[#183f42]" />
              <h3 class="text-sm font-bold text-zinc-900">Draft New Quotation</h3>
            </div>
            <button onclick={() => (showCreateModal = false)} class="p-1 rounded-md text-zinc-400 hover:text-zinc-600">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="p-5 space-y-4 text-xs">
            <div class="space-y-1">
              <Label class="text-zinc-700 font-medium">Customer Account</Label>
              <select bind:value={customerName} class="w-full h-8 px-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
                <option value="CloudSphere AI">CloudSphere AI</option>
                <option value="BioSynth Labs">BioSynth Labs</option>
                <option value="Apex Global Tech">Apex Global Tech</option>
                <option value="Starlight Media Group">Starlight Media Group</option>
              </select>
            </div>

            <div class="space-y-1">
              <Label class="text-zinc-700 font-medium">Subscription Package</Label>
              <select bind:value={planSelected} class="w-full h-8 px-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
                <option value="Enterprise Suite">Enterprise Suite (₹12,400.00)</option>
                <option value="Growth Cloud">Growth Cloud (₹6,800.00)</option>
                <option value="Starter Cloud">Starter Cloud (₹3,200.00)</option>
              </select>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <Label class="text-zinc-700 font-medium">Sales Discount Percentage</Label>
                <span class="font-bold text-zinc-900">{discountPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                bind:value={discountPct}
                class="w-full accent-[#183f42] cursor-pointer"
              />
              {#if requiresApproval}
                <div class="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5 mt-1.5">
                  <AlertTriangle class="w-3.5 h-3.5 shrink-0" />
                  <span>Discounts above 15% will route to Enterprise Admin for sign-off.</span>
                </div>
              {/if}
            </div>

            <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 space-y-1.5">
              <div class="flex justify-between text-zinc-500">
                <span>Base Package Price:</span>
                <span>₹{basePrice.toLocaleString()}.00</span>
              </div>
              <div class="flex justify-between text-zinc-500">
                <span>Discount Applied:</span>
                <span>-₹{(basePrice * (discountPct / 100)).toLocaleString()}.00</span>
              </div>
              <div class="flex justify-between font-bold text-zinc-900 border-t border-zinc-200 pt-1 text-sm">
                <span>Total Quotation:</span>
                <span class="text-[#183f42]">₹{calculatedTotal.toLocaleString()}.00</span>
              </div>
            </div>
          </div>

          <div class="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onclick={() => (showCreateModal = false)} class="text-xs h-8">
              Cancel
            </Button>
            <Button size="sm" onclick={handleSaveQuote} class="bg-[#183f42] text-white text-xs h-8 shadow-xs">
              Save & Create
            </Button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</AppShell>