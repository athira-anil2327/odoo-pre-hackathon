<script>
  import { onMount, onDestroy } from "svelte";
  import { Chart, registerables } from "chart.js";

  Chart.register(...registerables);

  let {
    type = "line",
    data = { labels: [], datasets: [] },
    height = 240
  } = $props();

  let canvasEl = $state(null);
  let chart = null;

  function render() {
    if (!canvasEl) return;
    if (chart) chart.destroy();

    const ctx = canvasEl.getContext("2d");
    let gradientFill = "rgba(192, 38, 211, 0.06)";
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(192, 38, 211, 0.22)");
      gradient.addColorStop(1, "rgba(192, 38, 211, 0.01)");
      gradientFill = gradient;
    }

    const styledData = {
      ...data,
      datasets: (data.datasets || []).map(ds => ({
        ...ds,
        borderColor: ds.borderColor || "#c026d3",
        backgroundColor: gradientFill,
        pointBackgroundColor: "#c026d3",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.35,
        borderWidth: 2.5
      }))
    };

    chart = new Chart(canvasEl, {
      type,
      data: styledData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              color: "#71717a",
              font: { size: 11, family: "inherit", weight: "500" }
            }
          },
          tooltip: {
            backgroundColor: "#18181b",
            titleFont: { size: 11, weight: "bold" },
            bodyFont: { size: 11 },
            padding: 10,
            cornerRadius: 8,
            borderColor: "rgba(217, 70, 239, 0.3)",
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#a1a1aa", font: { size: 10 } }
          },
          y: {
            grid: { color: "rgba(244, 244, 245, 0.8)" },
            border: { dash: [4, 4] },
            ticks: { color: "#a1a1aa", font: { size: 10 } }
          }
        }
      }
    });
  }

  $effect(() => {
    if (data && canvasEl) render();
  });

  onMount(() => {
    render();
  });

  onDestroy(() => {
    if (chart) chart.destroy();
  });
</script>

<div class="relative w-full" style={`height: ${height}px;`}>
  <canvas bind:this={canvasEl}></canvas>
</div>
