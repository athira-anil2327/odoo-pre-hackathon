<script>
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { login } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";
  import { Lock, Mail, Sparkles } from "lucide-svelte";

  let email = $state("eleanor.vance@nexushealth.org");
  let password = $state("••••••••");

  function handleSignIn() {
    login({ email });
    goto("/");
  }
</script>

<div class="min-h-screen bg-[#fafafc] flex flex-col justify-center items-center p-4 relative overflow-hidden">
  <!-- Subtle decorative ambient gradient blur -->
  <div class="absolute -top-40 -right-40 w-96 h-96 bg-fuchsia-200/40 rounded-full blur-3xl pointer-events-none"></div>
  <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none"></div>

  <div class="w-full max-w-sm relative z-10">
    <div class="text-center mb-6">
      <div class="w-11 h-11 rounded-2xl gradient-magenta flex items-center justify-center text-white font-bold text-base mx-auto mb-3 glow-magenta-sm shadow-md">
        <Sparkles class="w-5 h-5" />
      </div>
      <h1 class="text-xl font-bold text-zinc-900 tracking-tight">Brightloop Software</h1>
      <p class="text-xs text-zinc-500 mt-0.5">Enterprise Subscription Management</p>
    </div>

    <Card.Root class="bg-white/95 backdrop-blur-md border-zinc-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <div class="h-1.5 gradient-magenta w-full"></div>
      <Card.Header class="pb-3 pt-5">
        <Card.Title class="text-sm font-bold text-zinc-900">Sign In</Card.Title>
        <Card.Description class="text-xs text-zinc-500">
          Enter your credentials to access your management portal.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form class="space-y-4 text-xs" onsubmit={(e) => { e.preventDefault(); handleSignIn(); }}>
          <div class="space-y-1">
            <Label for="email" class="text-xs font-medium text-zinc-700">Email Address</Label>
            <div class="relative">
              <Mail class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                id="email"
                type="email"
                bind:value={email}
                placeholder="name@company.com"
                class="pl-9 text-xs h-9 bg-zinc-50/70 border-zinc-200 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100 rounded-xl"
              />
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <Label for="password" class="text-xs font-medium text-zinc-700">Password</Label>
              <button type="button" class="text-[11px] text-zinc-500 hover:text-fuchsia-600">Forgot?</button>
            </div>
            <div class="relative">
              <Lock class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                id="password"
                type="password"
                bind:value={password}
                placeholder="••••••••"
                class="pl-9 text-xs h-9 bg-zinc-50/70 border-zinc-200 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100 rounded-xl"
              />
            </div>
          </div>

          <Button
            type="submit"
            class="w-full gradient-magenta hover:opacity-95 text-white glow-magenta-xs h-9 text-xs font-semibold rounded-xl mt-2 transition-all shadow-xs"
          >
            Sign In
          </Button>

          <div class="text-center text-[11px] text-zinc-500 pt-2">
            Don't have an account?
            <a href="/signup" class="font-semibold text-fuchsia-600 hover:text-fuchsia-700 hover:underline ml-1">Sign Up</a>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
