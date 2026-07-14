import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import Chart from "chart.js/auto";
import countries from "../data/countries.json";
import usStatesData from "../data/usStates.json";
import citiesData from "../data/cities.json";

// Augment Leaflet's own MarkerOptions so the custom `storeCount` we attach to
// each country marker (read back inside the cluster icon function) is a real,
// checked property instead of an `any`-cast escape hatch.
declare module "leaflet" {
  interface MarkerOptions {
    storeCount?: number;
  }
}

type Country = (typeof countries)[number];

const flagEmoji = (iso: string) =>
  iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

const fmt = (n: number) => n.toLocaleString("en-US");

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
      <div class="mt-3 h-56"><canvas id="state-chart" role="img" aria-label="Bar chart of the top 8 U.S. states by Starbucks store count"></canvas></div>
      <a href="#us-states-table" class="mt-3 inline-block text-sm font-semibold text-green-800 underline underline-offset-2">See all 51 states ↓</a>
    `;
    const canvas = document.getElementById("state-chart") as HTMLCanvasElement | null;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
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
    }
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
    <h3 class="mt-2 font-display text-2xl font-semibold text-espresso">${r.city}</h3>
    <p class="text-sm text-espresso-soft">${r.country}</p>
    <div class="mt-4 rounded-lg bg-gold-light/40 p-3">
      <p class="text-xs uppercase tracking-wide text-espresso/70">Opened</p>
      <p class="font-display text-2xl font-semibold text-espresso">${r.opened}</p>
    </div>
    <p class="mt-3 text-sm font-medium text-espresso">${r.type}</p>
    ${r.notes ? `<p class="mt-3 text-sm leading-relaxed text-espresso-soft">${r.notes}</p>` : ""}
  `;
}

// ---- pin icon factory (Google-Maps-style teardrop pin, built from SVG so no image assets needed) ----
function pinIcon(color: string, size = 30) {
  const svg = `
    <svg width="${size}" height="${size * 1.33}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" fill="${color}" stroke="white" stroke-width="1.2"/>
      <circle cx="12" cy="12" r="4.5" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "sbx-pin",
    iconSize: [size, size * 1.33],
    iconAnchor: [size / 2, size * 1.33],
    popupAnchor: [0, -size * 1.2],
  });
}

const countryPin = pinIcon("#0f4f3d");
const estimatedPin = pinIcon("#5c9c7c");
const roasteryPin = pinIcon("#c6a664", 26);

function clusterIcon(sumStores: number, marketCount: number) {
  const size = sumStores > 5000 ? 54 : sumStores > 1000 ? 46 : sumStores > 200 ? 40 : 34;
  return L.divIcon({
    html: `<div class="sbx-cluster" title="${marketCount} markets, ${fmt(sumStores)} stores combined" style="width:${size}px;height:${size}px;line-height:${size}px;font-size:${size > 44 ? 13 : 11}px;">${
      sumStores >= 1000 ? (sumStores / 1000).toFixed(1) + "k" : sumStores
    }</div>`,
    className: "",
    iconSize: [size, size],
  });
}

function init() {
  const mapEl = document.getElementById("map-canvas");
  const select = document.getElementById("country-select") as HTMLSelectElement | null;
  const roasteryToggle = document.getElementById("toggle-roasteries") as HTMLInputElement | null;
  const clusterToggle = document.getElementById("toggle-cluster") as HTMLInputElement | null;
  const resetBtn = document.getElementById("reset-view") as HTMLButtonElement | null;
  if (!mapEl) return;

  if (select) {
    const sorted = [...(countries as Country[])].sort((a, b) => a.name.localeCompare(b.name));
    for (const c of sorted) {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${flagEmoji(c.id)}  ${c.name} — ${fmt(c.stores)}`;
      select.appendChild(opt);
    }
  }

  const map = L.map(mapEl, {
    center: [22, 8],
    zoom: 2,
    minZoom: 2,
    maxZoom: 9,
    worldCopyJump: true,
    zoomControl: false,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  }).addTo(map);

  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.control.scale({ position: "bottomleft", imperial: true, metric: true }).addTo(map);

  const countryMarkers = L.markerClusterGroup({
    maxClusterRadius: 45,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    iconCreateFunction: (cluster: L.MarkerCluster) => {
      const markers = cluster.getAllChildMarkers();
      const sum = markers.reduce((a: number, m: L.Marker) => a + (m.options.storeCount || 0), 0);
      return clusterIcon(sum, markers.length);
    },
  });

  const countryMarkerById = new Map<string, L.Marker>();

  for (const c of countries as Country[]) {
    const marker = L.marker([c.lat, c.lng], {
      icon: c.confidence === "reported" ? countryPin : estimatedPin,
      storeCount: c.stores,
      alt: c.name,
      title: c.name,
      keyboard: true,
    });
    marker.bindPopup(
      `<div style="font-family:Inter,sans-serif;min-width:150px">
        <strong style="font-size:13px">${flagEmoji(c.id)} ${c.name}</strong><br/>
        <span style="font-size:12px;color:#555">${fmt(c.stores)} stores · ${c.confidence}</span>
      </div>`
    );
    marker.on("click", () => {
      renderCountryPanel(c);
      if (select) select.value = c.id;
    });
    countryMarkers.addLayer(marker);
    countryMarkerById.set(c.id, marker);
  }
  map.addLayer(countryMarkers);

  const roasteryMarkers = L.layerGroup(
    citiesData.flagshipRoasteries.map((r: any) => {
      const m = L.marker([r.lat, r.lng], { icon: roasteryPin, alt: `${r.city} — ${r.type}` });
      m.bindPopup(
        `<div style="font-family:Inter,sans-serif;min-width:150px">
          <strong style="font-size:13px">☕ ${r.city}</strong><br/>
          <span style="font-size:12px;color:#555">${r.type} · opened ${r.opened}</span>
        </div>`
      );
      m.on("click", () => renderRoasteryPanel(r));
      return m;
    })
  );
  roasteryMarkers.addTo(map);

  select?.addEventListener("change", () => {
    const c = (countries as Country[]).find((c) => c.id === select.value);
    if (!c) return;
    renderCountryPanel(c);
    map.flyTo([c.lat, c.lng], 4, { duration: 0.9 });
    const marker = countryMarkerById.get(c.id);
    if (marker) {
      countryMarkers.zoomToShowLayer(marker, () => marker.openPopup());
    }
  });

  roasteryToggle?.addEventListener("change", () => {
    if (roasteryToggle.checked) map.addLayer(roasteryMarkers);
    else map.removeLayer(roasteryMarkers);
  });

  clusterToggle?.addEventListener("change", () => {
    map.removeLayer(countryMarkers);
    // The upstream @types/leaflet.markercluster declares MarkerClusterGroup's
    // constructor to accept MarkerClusterGroupOptions but doesn't narrow the
    // inherited `.options` field to match, so this one property write needs
    // a targeted cast rather than typing the whole instance as `any`.
    (countryMarkers.options as L.MarkerClusterGroupOptions).disableClusteringAtZoom = clusterToggle.checked
      ? undefined
      : 1;
    map.addLayer(countryMarkers);
  });

  resetBtn?.addEventListener("click", () => {
    map.flyTo([22, 8], 2, { duration: 0.8 });
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
