<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import {
    Users,
    FileText,
    Receipt,
    Clock,
    Plus,
    ArrowUpRight,
    CheckCircle2,
    AlertCircle,
    PhoneCall,
    Mail,
    Send
  } from "lucide-svelte";

  const staffMetrics = [
    {
      title: "My Assigned Accounts",
      value: "24",
      sub: "3 added this month",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Open Quotations",
      value: "$38,200.00",
      sub: "6 proposals in review",
      icon: FileText,
      color: "text-[#183f42]",
      bg: "bg-[#e6f4f2]"
    },
    {
      title: "Receivables Follow-up",
      value: "$4,250.00",
      sub: "4 overdue accounts",
      icon: Receipt,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "Renewals This Week",
      value: "3 Accounts",
      sub: "$18,400.00 value",
      icon: Clock,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    }
  ];

  let tasks = $state([
    {
      id: 1,
      title: "Follow up with CloudSphere on Growth Plan renewal",
      company: "CloudSphere AI",
      due: "Today, 3:00 PM",
      priority: "High",
      done: false
    },
    {
      id: 2,
      title: "Send updated quotation QT-2026-088 with 10% volume discount",
      company: "BioSynth Labs",
      due: "Today, 5:00 PM",
      priority: "Medium",
      done: false
    },
    {
      id: 3,
      title: "Confirm payment receipt of $1,850.00 for INV-2026-003",
      company: "Starlight Media",
      due: "Tomorrow, 11:00 AM",
      priority: "Low",
      done: true
    }
  ]);

  const recentQuotations = [
    {
      id: "QT-2026-088",
      customer: "CloudSphere AI",
      plan: "Enterprise Suite",
      amount: "$12,400.00",
      status: "Sent",
      statusColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
    },
    {
      id: "QT-2026-089",
      customer: "BioSynth Labs",
      plan: "Growth Cloud",
      amount: "$6,800.00",
      status: "In Review",
      statusColor: "bg-amber-50 text-amber-700 border-amber-200"
    },
    {
      id: "QT-2026-090",
      customer: "Apex Global Tech",
      plan: "Seat Expansion (x10)",
      amount: "$4,500.00",
      status: "Draft",
      statusColor: "bg-zinc-100 text-zinc-700 border-zinc-200"
    },
    {
      id: "QT-2026-091",
      customer: "Acme Logistics",
      plan: "Standard Cloud",
      amount: "$14,500.00",
      status: "Accepted",
      statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    }
  ];

  function toggleTask(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  }
</script>

<AppShell title="Staff Dashboard">
  <div class="space-y-6">
    <!-- Page Header & Quick CTAs -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-xl font-bold text-zinc-900 tracking-tight">Staff Briefing</h2>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 uppercase">
            Sales & Support
          </span>
        </div>
        <p class="text-xs text-zinc-500 mt-1">
          Monitor your assigned portfolio, track quotation approvals, and follow up on customer receivables.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <a href="/staff/quotations">
          <Button variant="outline" size="sm" class="text-xs h-8 border-zinc-200 text-zinc-700 hover:bg-zinc-50">
            <FileText class="w-3.5 h-3.5 mr-1 text-zinc-400" /> All Quotes
          </Button>
        </a>
        <a href="/staff/quotations">
          <Button size="sm" class="bg-[#183f42] text-white shadow-xs text-xs h-8">
            <Plus class="w-3.5 h-3.5 mr-1" /> New Quotation
          </Button>
        </a>
      </div>
    </div>

    <!-- Staff Metric Cards matching theme.jpeg -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each staffMetrics as metric}
        {@const Icon = metric.icon}
        <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-start mb-3">
            <Icon class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">{metric.value}</div>
            <div class="text-xs font-medium text-teal-100/90 mt-1">{metric.title}</div>
            <div class="text-[11px] text-teal-200/80 mt-1">{metric.sub}</div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Operational Split Grid: Tasks & Assigned Quotes -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- Daily Priority Tasks -->
      <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
        <div class="p-4 border-b border-zinc-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-[#183f42]" />
            <span class="text-xs font-bold text-zinc-900">Today's Priority Action Items</span>
          </div>
          <span class="text-[10px] font-semibold text-zinc-400">{tasks.filter(t => !t.done).length} Pending</span>
        </div>
        <div class="p-3 divide-y divide-zinc-100">
          {#each tasks as task}
            <div class="py-3 px-2 flex items-start gap-3 hover:bg-zinc-50/60 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={task.done}
                onchange={() => toggleTask(task.id)}
                class="mt-0.5 rounded text-[#183f42] focus:ring-[#183f42]/20 h-4 w-4 border-zinc-300"
              />
              <div class="flex-1 min-w-0">
                <p class={`text-xs font-medium leading-snug ${task.done ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>
                  {task.title}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] font-medium text-zinc-400">{task.company}</span>
                  <span class="text-[10px] text-zinc-300">•</span>
                  <span class="text-[10px] text-zinc-500">{task.due}</span>
                  <span class={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                    task.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </Card.Root>

      <!-- Recent Assigned Quotations & Proposals -->
      <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden lg:col-span-2">
        <div class="p-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 class="text-xs font-bold text-zinc-900">Assigned Quotations & Proposals</h3>
            <p class="text-[11px] text-zinc-400">Proposals currently under review by clients</p>
          </div>
          <a href="/staff/quotations" class="text-xs font-semibold text-[#183f42] hover:text-[#143e42] flex items-center gap-1">
            View All <ArrowUpRight class="w-3.5 h-3.5" />
          </a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-zinc-50/80 text-zinc-500 font-semibold border-b border-zinc-200/80">
              <tr>
                <th class="py-2.5 px-4">Quote ID</th>
                <th class="py-2.5 px-4">Customer</th>
                <th class="py-2.5 px-4">Package</th>
                <th class="py-2.5 px-4 text-right">Value</th>
                <th class="py-2.5 px-4">Status</th>
                <th class="py-2.5 px-4 text-right">Quick Contact</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              {#each recentQuotations as quote}
                <tr class="hover:bg-zinc-50/70 transition-colors">
                  <td class="py-3 px-4 font-mono font-medium text-zinc-900">{quote.id}</td>
                  <td class="py-3 px-4 font-semibold text-zinc-800">{quote.customer}</td>
                  <td class="py-3 px-4 text-zinc-500">{quote.plan}</td>
                  <td class="py-3 px-4 text-right font-medium text-zinc-900">{quote.amount}</td>
                  <td class="py-3 px-4">
                    <span class={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${quote.statusColor}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button class="p-1 rounded text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Send Email">
                        <Mail class="w-3.5 h-3.5" />
                      </button>
                      <button class="p-1 rounded text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Log Call">
                        <PhoneCall class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </Card.Root>
    </div>

    <!-- Receivables Collection Notice Banner -->
    <div class="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/70 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <AlertCircle class="w-4 h-4" />
        </div>
        <div>
          <h4 class="text-xs font-bold text-zinc-900">4 Invoices Awaiting Collection Follow-up</h4>
          <p class="text-[11px] text-zinc-500 mt-0.5">
            CloudSphere AI and BioSynth Labs have overdue receivables over 15 days. Send payment reminders or log offline receipts.
          </p>
        </div>
      </div>
      <a href="/staff/invoices">
        <Button size="sm" variant="outline" class="text-xs border-amber-300 text-amber-800 bg-white hover:bg-amber-50">
          Review Invoices
        </Button>
      </a>
    </div>
  </div>
</AppShell>