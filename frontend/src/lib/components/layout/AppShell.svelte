<script>
  import Sidebar from "./Sidebar.svelte";
  import Header from "./Header.svelte";

  let { title = "Dashboard", children } = $props();
</script>

<!-- Outer Backdrop matching theme.jpeg -->
<div class="min-h-screen bg-[#234b4f] p-3 sm:p-5 lg:p-8 flex items-center justify-center font-sans antialiased text-[#122b2e]">
  <!-- Main Rounded App Frame -->
  <div class="bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl border border-white/10 w-full max-w-[1550px] min-h-[900px] flex flex-col md:flex-row overflow-hidden">
    <!-- Left Sidebar -->
    <Sidebar />

    <!-- Main Right Content Area -->
    <div class="flex-1 flex flex-col min-w-0 bg-white">
      <Header {title} />
      <main class="flex-1 p-5 sm:p-7 overflow-y-auto">
        {@render children?.()}
      </main>
    </div>
  </div>
</div>
