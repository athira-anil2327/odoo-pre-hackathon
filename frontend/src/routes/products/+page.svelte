<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Plus, Package, Layers, Edit2, Sparkles } from "lucide-svelte";

  const products = [
    {
      id: "PROD-001",
      name: "Brightloop Platform Core",
      type: "SaaS Application",
      price: "$499.00 / mo",
      desc: "Core cloud-native engine for enterprise event streaming and tenant automation.",
      plan: "Growth Cloud Monthly",
      status: "Active"
    },
    {
      id: "PROD-002",
      name: "Enterprise Compliance & Audit Suite",
      type: "Security Add-on",
      price: "$299.00 / mo",
      desc: "SOC-2 Type II, HIPAA, and GDPR audit logging with immutable proofs.",
      plan: "Compliance Quarterly",
      status: "Active"
    },
    {
      id: "PROD-003",
      name: "Brightloop Real-Time Telemetry & Insights",
      type: "Analytics Add-on",
      price: "$199.00 / mo",
      desc: "Sub-second event stream analytics and customizable dashboards.",
      plan: "Telemetry Tier 1",
      status: "Active"
    },
    {
      id: "PROD-004",
      name: "Mission-Critical 24/7 SLA Support",
      type: "Professional Services",
      price: "$650.00 / mo",
      desc: "Guaranteed 15-minute emergency response with dedicated technical accounts.",
      plan: "Enterprise SLA Support",
      status: "Active"
    }
  ];
</script>

<AppShell title="Products & Subscription Plans">
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-4 border-b border-zinc-200/70">
      <div>
        <h2 class="text-base font-bold text-zinc-900 tracking-tight">Product Catalog</h2>
        <p class="text-xs text-zinc-500 mt-0.5">Software modules, pricing tiers, and linked subscription plans.</p>
      </div>
      <div class="flex items-center gap-2.5">
        <Button variant="outline" size="xs" class="text-xs border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg gap-1.5 shadow-2xs">
          <Layers class="w-3.5 h-3.5 text-zinc-500" /> New Plan
        </Button>
        <Button variant="default" size="xs" class="text-xs gradient-magenta hover:opacity-95 text-white glow-magenta-xs font-semibold rounded-lg gap-1.5 shadow-xs">
          <Plus class="w-3.5 h-3.5" /> Add Product
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each products as p}
        <Card.Root class="bg-white border-zinc-200/80 shadow-xs hover:border-fuchsia-200 transition-all rounded-xl relative overflow-hidden group">
          <div class="absolute top-0 left-0 right-0 h-1 gradient-magenta opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Card.Header class="pb-2.5">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{p.type}</span>
              <span class="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/60">
                {p.status}
              </span>
            </div>
            <Card.Title class="text-sm font-bold text-zinc-900 mt-1">{p.name}</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-3.5">
            <p class="text-xs text-zinc-500 leading-relaxed">{p.desc}</p>
            <div class="p-3 bg-gradient-to-r from-zinc-50 to-fuchsia-50/20 border border-zinc-200/70 rounded-xl flex items-center justify-between text-xs">
              <span class="text-zinc-600 font-medium flex items-center gap-1.5">
                <Layers class="w-3.5 h-3.5 text-fuchsia-600" /> Linked: {p.plan}
              </span>
              <span class="font-bold text-zinc-900">{p.price}</span>
            </div>
            <div class="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" size="xs" class="text-xs border-zinc-200 text-zinc-700 hover:text-fuchsia-700 hover:bg-fuchsia-50/50 rounded-lg gap-1">
                <Edit2 class="w-3 h-3" /> Edit Product
              </Button>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  </div>
</AppShell>
