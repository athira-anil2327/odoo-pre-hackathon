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
    <div class="flex items-center justify-between pb-4 border-b border-[#edf2f3]">
      <div>
        <h2 class="text-base font-bold text-[#122b2e] tracking-tight">Product Catalog</h2>
        <p class="text-xs text-[#7e9599] mt-0.5">Software modules, pricing tiers, and linked subscription plans.</p>
      </div>
      <div class="flex items-center gap-2.5">
        <Button variant="outline" size="xs" class="text-xs border-[#e2eaeb] bg-white hover:bg-[#f8fafb] text-[#586f73] rounded-xl gap-1.5 shadow-2xs">
          <Layers class="w-3.5 h-3.5 text-[#7e9599]" /> New Plan
        </Button>
        <Button size="xs" class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs">
          <Plus class="w-3.5 h-3.5" /> Add Product
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each products as p}
        <Card.Root class="bg-white border-[#edf2f3] shadow-xs hover:border-[#183f42]/30 transition-all rounded-2xl relative overflow-hidden group">
          <div class="absolute top-0 left-0 right-0 h-1 bg-[#183f42] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Card.Header class="pb-2.5">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-semibold text-[#8c9ba5] uppercase tracking-wider">{p.type}</span>
              <span class="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]">
                {p.status}
              </span>
            </div>
            <Card.Title class="text-sm font-bold text-[#122b2e] mt-1">{p.name}</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-3.5">
            <p class="text-xs text-[#586f73] leading-relaxed">{p.desc}</p>
            <div class="p-3 bg-[#f8fafb] border border-[#e8eff0] rounded-xl flex items-center justify-between text-xs">
              <span class="text-[#586f73] font-medium flex items-center gap-1.5">
                <Layers class="w-3.5 h-3.5 text-[#183f42]" /> Linked: {p.plan}
              </span>
              <span class="font-bold text-[#122b2e]">{p.price}</span>
            </div>
            <div class="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" size="xs" class="text-xs border-[#e2eaeb] text-[#586f73] hover:text-[#183f42] hover:bg-[#e6f4f2]/50 rounded-xl gap-1">
                <Edit2 class="w-3 h-3" /> Edit Product
              </Button>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  </div>
</AppShell>
