import Chart from "chart.js/auto";
import coffeeOrigins from "../data/coffeeOrigins.json";

const el = document.getElementById("region-chart") as HTMLCanvasElement | null;
if (el) {
  new Chart(el.getContext("2d")!, {
    type: "bar",
    data: {
      labels: coffeeOrigins.regions.map((r) => r.region),
      datasets: [
        {
          label: "Sourcing countries",
          data: coffeeOrigins.regions.map((r) => r.countryCount),
          backgroundColor: ["#0f4f3d", "#c6a664", "#8a3b3b"],
          borderRadius: 6,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { stepSize: 2 }, grid: { color: "rgba(15,79,61,0.08)" } },
        y: { grid: { display: false } },
      },
    },
  });
}
