<script>
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { login } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";
  import { Lock, Mail, User, Building2 } from "lucide-svelte";

  let name = $state("Dr. Eleanor Vance");
  let company = $state("Nexus Health Systems");
  let email = $state("eleanor.vance@nexushealth.org");
  let password = $state("••••••••");

  function handleSignUp() {
    login({ name, company, email });
    goto("/");
  }
</script>

<div class="min-h-screen bg-[#234b4f] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
  <div class="w-full max-w-sm relative z-10">
    <div class="text-center mb-6">
      <div class="w-12 h-12 rounded-2xl bg-[#183f42] text-white flex items-center justify-center mx-auto mb-3 shadow-md ring-2 ring-white/10">
        <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-dasharray="2 3" />
          <path d="M7 12h10" />
          <path d="M9 8h6" />
          <path d="M9 16h6" />
        </svg>
      </div>
      <h1 class="text-xl font-bold text-white tracking-tight">Brightloop Software</h1>
      <p class="text-xs text-teal-100/70 mt-0.5">Register an Enterprise Account</p>
    </div>

    <Card.Root class="bg-white border-0 shadow-2xl rounded-2xl overflow-hidden">
      <div class="h-1.5 bg-[#183f42] w-full"></div>
      <Card.Header class="pb-3 pt-5">
        <Card.Title class="text-sm font-bold text-[#122b2e]">Sign Up</Card.Title>
        <Card.Description class="text-xs text-[#7e9599]">
          Create an enterprise workspace for subscription management.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form class="space-y-3.5 text-xs" onsubmit={(e) => { e.preventDefault(); handleSignUp(); }}>
          <div class="space-y-1">
            <Label for="fullname" class="text-xs font-medium text-[#122b2e]">Full Name</Label>
            <div class="relative">
              <User class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                id="fullname"
                type="text"
                bind:value={name}
                placeholder="Dr. Eleanor Vance"
                class="pl-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
              />
            </div>
          </div>

          <div class="space-y-1">
            <Label for="company" class="text-xs font-medium text-[#122b2e]">Company Name</Label>
            <div class="relative">
              <Building2 class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                id="company"
                type="text"
                bind:value={company}
                placeholder="Nexus Health Systems"
                class="pl-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
              />
            </div>
          </div>

          <div class="space-y-1">
            <Label for="email" class="text-xs font-medium text-[#122b2e]">Work Email</Label>
            <div class="relative">
              <Mail class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                id="email"
                type="email"
                bind:value={email}
                placeholder="eleanor.vance@nexushealth.org"
                class="pl-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
              />
            </div>
          </div>

          <div class="space-y-1">
            <Label for="password" class="text-xs font-medium text-[#122b2e]">Password</Label>
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
            Create Account
          </Button>

          <div class="text-center text-[11px] text-[#7e9599] pt-2">
            Already have an account?
            <a href="/signin" class="font-semibold text-[#183f42] hover:underline ml-1">Sign In</a>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
