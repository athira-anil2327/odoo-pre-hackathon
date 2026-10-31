<script>
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { login } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";
  import { Lock, Mail } from "lucide-svelte";

  let email = $state("eleanor.vance@nexushealth.org");
  let password = $state("••••••••");

  function handleSignIn() {
    login({ email });
    goto("/");
  }
</script>

<div class="min-h-screen bg-[#f8fafb] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
  <div class="w-full max-w-sm relative z-10">
    <div class="text-center mb-6">
      <div class="w-12 h-12 rounded-2xl bg-[#183f42] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
        <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-dasharray="2 3" />
          <path d="M7 12h10" />
          <path d="M9 8h6" />
          <path d="M9 16h6" />
        </svg>
      </div>
      <h1 class="text-xl font-bold text-[#122b2e] tracking-tight">Brightloop Software</h1>
      <p class="text-xs text-[#7e9599] mt-0.5">Subscription Management System</p>
    </div>

    <Card.Root class="bg-white border border-[#edf2f3] shadow-lg rounded-2xl overflow-hidden">
      <div class="h-1.5 bg-[#183f42] w-full"></div>
      <Card.Header class="pb-3 pt-5">
        <Card.Title class="text-sm font-bold text-[#122b2e]">Sign In</Card.Title>
        <Card.Description class="text-xs text-[#7e9599]">
          Enter your credentials to access your portal.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form class="space-y-4 text-xs" onsubmit={(e) => { e.preventDefault(); handleSignIn(); }}>
          <div class="space-y-1">
            <Label for="email" class="text-xs font-medium text-[#122b2e]">Email Address</Label>
            <div class="relative">
              <Mail class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                id="email"
                type="email"
                bind:value={email}
                placeholder="name@company.com"
                class="pl-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
              />
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <Label for="password" class="text-xs font-medium text-[#122b2e]">Password</Label>
              <button type="button" class="text-[11px] text-[#586f73] hover:text-[#183f42]">Forgot?</button>
            </div>
            <div class="relative">
              <Lock class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                id="password"
                type="password"
                bind:value={password}
                placeholder="••••••••"
                class="pl-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
              />
            </div>
          </div>

          <Button
            type="submit"
            class="w-full bg-[#183f42] hover:bg-[#123033] text-white h-9 text-xs font-semibold rounded-xl mt-2 transition-all shadow-xs"
          >
            Sign In
          </Button>

          <!-- Quick Persona Selector for Testing -->
          <div class="pt-3 border-t border-[#edf2f3]">
            <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider block text-center mb-2">
              Demo Quick Access By Role
            </span>
            <div class="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onclick={() => {
                  login({ role: "Enterprise Administrator", name: "Dr. Eleanor Vance" });
                  goto("/");
                }}
                class="px-2 py-1.5 rounded-lg border border-[#e5ecee] bg-[#f8fafb] hover:bg-[#e6f4f2] hover:text-[#143e42] hover:border-[#bde4df] font-medium text-[#586f73] transition-all text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onclick={() => {
                  login({ role: "Sales & Support", name: "Marcus Brody" });
                  goto("/staff");
                }}
                class="px-2 py-1.5 rounded-lg border border-[#e5ecee] bg-[#f8fafb] hover:bg-[#e6f4f2] hover:text-[#143e42] hover:border-[#bde4df] font-medium text-[#586f73] transition-all text-center"
              >
                Staff
              </button>
              <button
                type="button"
                onclick={() => {
                  login({ role: "Client Representative", name: "Sarah Jenkins" });
                  goto("/portal");
                }}
                class="px-2 py-1.5 rounded-lg border border-[#e5ecee] bg-[#f8fafb] hover:bg-[#e6f4f2] hover:text-[#143e42] hover:border-[#bde4df] font-medium text-[#586f73] transition-all text-center"
              >
                Customer
              </button>
            </div>
          </div>

          <div class="text-center text-[11px] text-[#7e9599] pt-2">
            Don't have an account?
            <a href="/signup" class="font-semibold text-[#183f42] hover:underline ml-1">Sign Up</a>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
