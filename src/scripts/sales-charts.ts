import Chart from "chart.js/auto";
import sales from "../data/sales.json";

const greens = ["#0a2e24", "#0f4f3d", "#1e8a63", "#7fb59a"];

const segmentEl = document.getElementById("segment-chart") as HTMLCanvasElement | null;
if (segmentEl) {
  new Chart(segmentEl.getContext("2d")!, {
    type: "bar",
    data: {
      labels: sales.revenueBySegmentMillions.map((s) => s.segment),
      datasets: [
        {
          label: "Revenue ($M)",
          data: sales.revenueBySegmentMillions.map((s) => s.revenue),
          backgroundColor: greens,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `$${Number(c.raw).toLocaleString()}M` } } },
      scales: { y: { beginAtZero: true, grid: { color: "rgba(15,79,61,0.08)" }, ticks: { callback: (v) => `$${v}M` } }, x: { grid: { display: false } } },
    },
  });
}

const mixEl = document.getElementById("mix-chart") as HTMLCanvasElement | null;
if (mixEl) {
  new Chart(mixEl.getContext("2d")!, {
    type: "doughnut",
    data: {
      labels: sales.companyOperatedRetailMix.map((m) => m.category),
      datasets: [
        {
          data: sales.companyOperatedRetailMix.map((m) => m.share),
          backgroundColor: ["#0f4f3d", "#c6a664", "#8a3b3b"],
          borderWidth: 2,
          borderColor: "#faf6ee",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } },
    },
  });
}

const compEl = document.getElementById("comps-chart") as HTMLCanvasElement | null;
if (compEl) {
  new Chart(compEl.getContext("2d")!, {
    type: "line",
    data: {
      labels: sales.comparableStoreSalesTimeline.map((q) => q.quarter.replace(" FY", " '")),
      datasets: [
        { label: "Global", data: sales.comparableStoreSalesTimeline.map((q) => q.global), borderColor: "#0f4f3d", backgroundColor: "#0f4f3d", tension: 0.35 },
        { label: "North America", data: sales.comparableStoreSalesTimeline.map((q) => q.northAmerica), borderColor: "#c6a664", backgroundColor: "#c6a664", tension: 0.35 },
        { label: "China", data: sales.comparableStoreSalesTimeline.map((q) => q.china), borderColor: "#8a3b3b", backgroundColor: "#8a3b3b", tension: 0.35 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } },
      scales: {
        y: { grid: { color: "rgba(15,79,61,0.08)" }, ticks: { callback: (v) => `${v}%` } },
        x: { grid: { display: false } },
      },
    },
  });
}

const marketsEl = document.getElementById("markets-chart") as HTMLCanvasElement | null;
if (marketsEl) {
  new Chart(marketsEl.getContext("2d")!, {
    type: "bar",
    data: {
      labels: sales.topStoreCountMarkets.map((m) => m.country),
      datasets: [{ data: sales.topStoreCountMarkets.map((m) => m.stores), backgroundColor: "#0f4f3d", borderRadius: 6 }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, grid: { color: "rgba(15,79,61,0.08)" } }, y: { grid: { display: false } } },
    },
  });
}
