import Globe from "globe.gl";
import Chart from "chart.js/auto";
import countries from "../data/countries.json";
import usStatesData from "../data/usStates.json";
import citiesData from "../data/cities.json";

type Country = (typeof countries)[number];

const flagEmoji = (iso: string) =>
  iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

const fmt = (n: number) => n.toLocaleString("en-US");

// ---- merge countries + flagship roasteries into one points layer ----
type GlobePoint = {
  kind: "country" | "roastery";
  id: string;
  name: string;
  lat: number;
  lng: number;
  stores?: number;
  confidence?: string;
  raw?: any;
};

const countryPoints: GlobePoint[] = (countries as Country[]).map((c) => ({
  kind: "country",
  id: c.id,
  name: c.name,
  lat: c.lat,
  lng: c.lng,
  stores: c.stores,
  confidence: c.confidence,
  raw: c,
}));

const roasteryPoints: GlobePoint[] = citiesData.flagshipRoasteries.map((r: any) => ({
  kind: "roastery",
  id: `roastery-${r.city}`,
  name: `${r.city} Reserve Roastery`,
  lat: r.lat,
  lng: r.lng,
  raw: r,
}));

let showRoasteries = true;

function pointsInUse(): GlobePoint[] {
  return showRoasteries ? [...countryPoints, ...roasteryPoints] : countryPoints;
}

const maxStores = Math.max(...countryPoints.map((p) => p.stores ?? 0));

function radiusFor(p: GlobePoint) {
  if (p.kind === "roastery") return 0.55;
  const s = p.stores ?? 0;
  const norm = Math.log(s + 1) / Math.log(maxStores + 1);
  return 0.28 + norm * 1.5;
}

function altitudeFor(p: GlobePoint) {
  if (p.kind === "roastery") return 0.02;
  const s = p.stores ?? 0;
  const norm = Math.log(s + 1) / Math.log(maxStores + 1);
  return 0.01 + norm * 0.18;
}

function colorFor(p: GlobePoint) {
  if (p.kind === "roastery") return "#c6a664";
  return p.confidence === "reported" ? "#14684f" : "#7fb59a";
}

// ---------------------------------------------------------------------

let chartInstance: Chart | null = null;

function renderCountryPanel(country: Country) {
  const panel = document.getElementById("country-panel");
  if (!panel) return;

  const changeStr =
    country.yoyChange === null || country.yoyChange === undefined
      ? ""
      : `<span class="${country.yoyChange >= 0 ? "text-green-700" : "text-berry"} font-semibold">${
          country.yoyChange >= 0 ? "+" : ""
        }${country.yoyChange}</span> stores YoY`;

  panel.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-4xl leading-none">${flagEmoji(country.id)}</p>
        <h3 class="mt-2 font-display text-2xl font-semibold text-espresso">${country.name}</h3>
        <p class="text-sm text-espresso-soft">${country.region}</p>
      </div>
      <span class="badge ${country.confidence === "reported" ? "badge-reported" : "badge-estimated"}">${country.confidence}</span>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-3">
      <div class="rounded-lg bg-green-100/70 p-3">
        <p class="text-xs uppercase tracking-wide text-green-800/70">Stores</p>
        <p class="font-display text-2xl font-semibold text-green-800">${fmt(country.stores)}</p>
        <p class="text-xs text-espresso-soft mt-0.5">${changeStr}</p>
      </div>
      <div class="rounded-lg bg-green-100/70 p-3">
        <p class="text-xs uppercase tracking-wide text-green-800/70">Entered</p>
        <p class="font-display text-2xl font-semibold text-green-800">${country.entryYear}</p>
        <p class="text-xs text-espresso-soft mt-0.5">${country.asOf}</p>
      </div>
    </div>

    <dl class="mt-4 space-y-2 text-sm">
      <div class="flex justify-between gap-4"><dt class="text-espresso-soft">Ownership model</dt><dd class="text-right font-medium text-espresso">${country.model}</dd></div>
      <div class="flex justify-between gap-4"><dt class="text-espresso-soft">Operator</dt><dd class="text-right font-medium text-espresso">${country.operator}</dd></div>
    </dl>

    ${country.notes ? `<p class="mt-4 text-sm leading-relaxed text-espresso-soft border-t border-green-900/10 pt-4">${country.notes}</p>` : ""}

    <div id="drilldown-slot" class="mt-5 border-t border-green-900/10 pt-4"></div>
  `;

  renderDrilldown(country);
}

function renderDrilldown(country: Country) {
  const slot = document.getElementById("drilldown-slot");
  if (!slot) return;

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  if (country.hasStateData && country.id === "US") {
    const top = [...usStatesData.states].sort((a, b) => b.stores - a.stores).slice(0, 8);
    slot.innerHTML = `
      <p class="text-xs font-semibold uppercase tracking-wide text-green-700">Drill down → top U.S. states</p>
      <div class="mt-3 h-56"><canvas id="state-chart"></canvas></div>
      <a href="#us-states-table" class="mt-3 inline-block text-sm font-semibold text-green-800 underline underline-offset-2">See all 50 states ↓</a>
    `;
    const ctx = (document.getElementById("state-chart") as HTMLCanvasElement).getContext("2d")!;
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: top.map((s) => s.abbr),
        datasets: [
          {
            data: top.map((s) => s.stores),
            backgroundColor: top.map((s) => (s.confidence === "reported" ? "#0f4f3d" : "#9fc7b0")),
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { title: (items) => top[items[0].dataIndex].name } } },
        scales: { y: { beginAtZero: true, grid: { color: "rgba(15,79,61,0.08)" } }, x: { grid: { display: false } } },
      },
    });
    return;
  }

  const cityMatches = citiesData.mostSaturatedCities.filter((c: any) => c.country === country.name);
  const roasteryMatches = citiesData.flagshipRoasteries.filter((r: any) => r.country === country.name);

  if (cityMatches.length || roasteryMatches.length) {
    slot.innerHTML = `
      <p class="text-xs font-semibold uppercase tracking-wide text-green-700">Drill down → notable cities</p>
      <ul class="mt-3 space-y-2">
        ${cityMatches
          .map(
            (c: any) => `<li class="flex justify-between text-sm"><span>${c.city}</span><span class="font-semibold text-green-800">${fmt(c.stores)} est.</span></li>`
          )
          .join("")}
        ${roasteryMatches
          .map(
            (r: any) => `<li class="flex justify-between text-sm"><span>${r.city} — Reserve Roastery</span><span class="font-semibold text-gold">${r.opened}</span></li>`
          )
          .join("")}
      </ul>
    `;
    return;
  }

  slot.innerHTML = `<p class="text-sm text-espresso-soft">City-level detail isn't separately available for this market — Starbucks reports it only at the country level.</p>`;
}

function renderRoasteryPanel(r: any) {
  const panel = document.getElementById("country-panel");
  if (!panel) return;
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  panel.innerHTML = `
    <p class="text-4xl leading-none">☕</p>
    <h3 class="mt-2 font-display text-2xl font-semibold text-espresso">${r.city} Reserve Roastery</h3>
    <p class="text-sm text-espresso-soft">${r.country}</p>
    <div class="mt-4 rounded-lg bg-gold-light/40 p-3">
      <p class="text-xs uppercase tracking-wide text-espresso/70">Opened</p>
      <p class="font-display text-2xl font-semibold text-espresso">${r.opened}</p>
    </div>
    <p class="mt-3 text-sm font-medium text-espresso">${r.type}</p>
    ${r.notes ? `<p class="mt-3 text-sm leading-relaxed text-espresso-soft">${r.notes}</p>` : ""}
  `;
}

function init() {
  const container = document.getElementById("globe-canvas");
  const select = document.getElementById("country-select") as HTMLSelectElement | null;
  const roasteryToggle = document.getElementById("toggle-roasteries") as HTMLInputElement | null;
  const rotateToggle = document.getElementById("toggle-rotate") as HTMLInputElement | null;
  if (!container) return;

  // populate select
  if (select) {
    const sorted = [...(countries as Country[])].sort((a, b) => a.name.localeCompare(b.name));
    for (const c of sorted) {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${flagEmoji(c.id)}  ${c.name} — ${fmt(c.stores)}`;
      select.appendChild(opt);
    }
  }

  const world = new (Globe as any)(container)
    .backgroundColor("rgba(0,0,0,0)")
    .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg")
    .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
    .atmosphereColor("#1e8a63")
    .atmosphereAltitude(0.18)
    .pointsData(pointsInUse())
    .pointLat("lat")
    .pointLng("lng")
    .pointColor(colorFor as any)
    .pointRadius(radiusFor as any)
    .pointAltitude(altitudeFor as any)
    .pointResolution(12)
    .pointLabel(
      (d: any) =>
        d.kind === "country"
          ? `<div style="background:white;color:#1b1410;padding:6px 10px;border-radius:8px;font-family:Inter,sans-serif;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.25)"><b>${d.name}</b><br/>${fmt(d.stores)} stores (${d.confidence})</div>`
          : `<div style="background:#c6a664;color:#1b1410;padding:6px 10px;border-radius:8px;font-family:Inter,sans-serif;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.25)"><b>${d.name}</b><br/>Reserve Roastery, opened ${d.raw.opened}</div>`
    )
    .onPointClick((p: any) => {
      if (p.kind === "country") {
        renderCountryPanel(p.raw);
        if (select) select.value = p.id;
      } else {
        renderRoasteryPanel(p.raw);
      }
      world.pointOfView({ lat: p.lat, lng: p.lng, altitude: 1.6 }, 900);
    });

  function resize() {
    const rect = container!.getBoundingClientRect();
    world.width(rect.width).height(rect.height);
  }
  window.addEventListener("resize", resize);
  resize();

  world.controls().autoRotate = true;
  world.controls().autoRotateSpeed = 0.55;
  world.pointOfView({ lat: 20, lng: 10, altitude: 2.2 }, 0);

  select?.addEventListener("change", () => {
    const c = (countries as Country[]).find((c) => c.id === select.value);
    if (c) {
      renderCountryPanel(c);
      world.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.6 }, 900);
    }
  });

  roasteryToggle?.addEventListener("change", () => {
    showRoasteries = roasteryToggle.checked;
    world.pointsData(pointsInUse());
  });

  rotateToggle?.addEventListener("change", () => {
    world.controls().autoRotate = rotateToggle.checked;
  });

  // default: show the US to start
  const us = (countries as Country[]).find((c) => c.id === "US");
  if (us) renderCountryPanel(us);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
