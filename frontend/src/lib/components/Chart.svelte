<script>
  import { onMount, onDestroy } from "svelte";
  import { Chart, registerables } from "chart.js";

  Chart.register(...registerables);

  let {
    type = "bar",
    data = { labels: [], datasets: [] },
    height = 240
  } = $props();

  let canvasEl = $state(null);
  let chart = null;

  function render() {
    if (!canvasEl) return;
    if (chart) chart.destroy();

    const colors = ["#2a9d8f", "#e76f51", "#183f42", "#f4a261"];

    const styledData = {
      ...data,
      datasets: (data.datasets || []).map((ds, idx) => ({
        ...ds,
        backgroundColor: ds.backgroundColor || colors[idx % colors.length],
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.5,
        borderWidth: 0
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
            display: false
          },
          tooltip: {
            backgroundColor: "#183f42",
            titleFont: { size: 11, weight: "bold" },
            bodyFont: { size: 11 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || "";
                const val = context.raw;
                return `${label}: $${val.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "#8c9ba5",
              font: { size: 11 }
            }
          },
          y: {
            grid: {
              color: "rgba(0,0,0,0.04)",
              drawBorder: false
            },
            ticks: {
              color: "#8c9ba5",
              font: { size: 11 },
              callback: (val) => {
                if (val >= 1000) return `$${val / 1000}k`;
                return `$${val}`;
              }
            }
          }
        }
      }
    });
  }

  $effect(() => {
    if (data && canvasEl) {
      render();
    }
  });

  onMount(() => {
    render();
  });

  onDestroy(() => {
    if (chart) chart.destroy();
  });
</script>

<div class="relative w-full" style="height: {height}px;">
  <canvas bind:this={canvasEl}></canvas>
</div>
