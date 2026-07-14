import Chart from "chart.js/auto";
import supplyChain from "../data/supplyChain.json";

const el = document.getElementById("workforce-chart") as HTMLCanvasElement | null;
if (el) {
  new Chart(el.getContext("2d")!, {
    type: "doughnut",
    data: {
      labels: supplyChain.workforce.breakdown.map((b) => b.segment),
      datasets: [
        {
          data: supplyChain.workforce.breakdown.map((b) => b.count),
          backgroundColor: ["#0f4f3d", "#1e8a63", "#c6a664", "#e7d5a8"],
          borderWidth: 2,
          borderColor: "#faf6ee",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
      },
    },
  });
}
