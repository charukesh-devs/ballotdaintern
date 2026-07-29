let DATA = [];

let currentMetric = "population";
let map, markers = [], barChart, pieChart, stateChart;
let sortCol = "population", sortDir = -1;

const METRIC_COLORS = {
    population: { fill: "#3b82f6", range: [200000, 40000000] },
    gdp: { fill: "#22c55e", range: [30, 3400] },
    housing: { fill: "#f59e0b", range: [120, 500] }
};

const METRIC_LABELS = {
    population: "Population",
    gdp: "GDP (Billions $)",
    housing: "Housing Price Index"
};

function formatNum(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
    return n.toLocaleString();
}

function getColor(value, metric) {
    const { range } = METRIC_COLORS[metric];
    const ratio = Math.min(1, Math.max(0, (value - range[0]) / (range[1] - range[0])));
    const colors = ["#1e3a5f", "#2563eb", "#60a5fa", "#f59e0b", "#ef4444"];
    const idx = Math.min(Math.floor(ratio * (colors.length - 1)), colors.length - 2);
    const t = (ratio * (colors.length - 1)) - idx;
    return lerpColor(colors[idx], colors[idx + 1], t);
}

function lerpColor(a, b, t) {
    const ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
    const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
    const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1)}`;
}

function initMap() {
    map = L.map("map", {
        center: [39.5, -98.5],
        zoom: 4,
        zoomControl: false,
        attributionControl: false
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19
    }).addTo(map);

    addMarkers();
}

function addMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    DATA.forEach(d => {
        const abbr = STATE_ABBREV_TO_NAME[d.state];
        const info = STATE_DATA[abbr];
        if (!info) return;

        const val = d[currentMetric];
        const color = getColor(val, currentMetric);

        const circle = L.circleMarker(info.center, {
            radius: getRadius(val),
            fillColor: color,
            color: "#fff",
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.7
        }).addTo(map);

        circle.bindTooltip(`<b>${d.state}</b><br>${METRIC_LABELS[currentMetric]}: ${formatNum(val)}`, {
            className: "state-tooltip"
        });

        circle.on("click", () => showStateDetail(d));
        markers.push(circle);
    });
}

function getRadius(val) {
    const { range } = METRIC_COLORS[currentMetric];
    const ratio = (val - range[0]) / (range[1] - range[0]);
    return 6 + ratio * 18;
}

function showStateDetail(d) {
    document.getElementById("panelContent").classList.remove("hidden");
    document.querySelector(".panel-placeholder").classList.add("hidden");

    document.getElementById("stateName").textContent = d.state;
    document.getElementById("statePop").textContent = d.population.toLocaleString();
    document.getElementById("stateGdp").textContent = "$" + d.gdp + "B";
    document.getElementById("stateHousing").textContent = d.housing.toFixed(1);
    document.getElementById("stateStatus").textContent = d.status;

    renderStateChart(d);
}

function renderStateChart(d) {
    const ctx = document.getElementById("stateChart").getContext("2d");
    if (stateChart) stateChart.destroy();

    stateChart = new Chart(ctx, {
        type: "radar",
        data: {
            labels: ["Population", "GDP", "Housing Index"],
            datasets: [{
                label: d.state,
                data: [
                    d.population / 400000,
                    d.gdp / 35,
                    d.housing / 5
                ],
                backgroundColor: "rgba(59,130,246,0.2)",
                borderColor: "#3b82f6",
                borderWidth: 2,
                pointBackgroundColor: "#3b82f6"
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                r: {
                    grid: { color: "#2d3f50" },
                    angleLines: { color: "#2d3f50" },
                    pointLabels: { color: "#94a3b8", font: { size: 11 } },
                    ticks: { display: false }
                }
            }
        }
    });
}

function initCharts() {
    renderBarChart();
    renderPieChart();
}

function renderBarChart() {
    const sorted = [...DATA].sort((a, b) => b[currentMetric] - a[currentMetric]).slice(0, 10);
    const ctx = document.getElementById("barChart").getContext("2d");
    if (barChart) barChart.destroy();

    barChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: sorted.map(d => d.state),
            datasets: [{
                data: sorted.map(d => d[currentMetric]),
                backgroundColor: sorted.map(d => getColor(d[currentMetric], currentMetric)),
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            indexAxis: "y",
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: "#2d3f50" }, ticks: { color: "#94a3b8" } },
                y: { grid: { display: false }, ticks: { color: "#e2e8f0", font: { size: 11 } } }
            }
        }
    });

    document.getElementById("chartTitle1").textContent = METRIC_LABELS[currentMetric];
}

function renderPieChart() {
    const regions = {
        "Northeast": ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "New Jersey", "New York", "Pennsylvania", "Rhode Island", "Vermont"],
        "Midwest": ["Illinois", "Indiana", "Iowa", "Kansas", "Michigan", "Minnesota", "Missouri", "Nebraska", "North Dakota", "Ohio", "South Dakota", "Wisconsin"],
        "South": ["Alabama", "Arkansas", "Delaware", "Florida", "Georgia", "Kentucky", "Louisiana", "Maryland", "Mississippi", "North Carolina", "Oklahoma", "South Carolina", "Tennessee", "Texas", "Virginia", "West Virginia"],
        "West": ["Alaska", "Arizona", "California", "Colorado", "Hawaii", "Idaho", "Montana", "Nevada", "New Mexico", "Oregon", "Utah", "Washington", "Wyoming"]
    };

    const totals = {};
    Object.keys(regions).forEach(r => {
        totals[r] = regions[r].reduce((sum, s) => {
            const d = DATA.find(x => x.state === s);
            return sum + (d ? d[currentMetric] : 0);
        }, 0);
    });

    const ctx = document.getElementById("pieChart").getContext("2d");
    if (pieChart) pieChart.destroy();

    pieChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: Object.keys(totals),
            datasets: [{
                data: Object.values(totals),
                backgroundColor: ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: "60%",
            plugins: {
                legend: { position: "bottom", labels: { color: "#94a3b8", padding: 16 } }
            }
        }
    });
}

function renderTable(data) {
    const tbody = document.getElementById("tableBody");
    const sorted = [...data].sort((a, b) => {
        const va = a[sortCol], vb = b[sortCol];
        if (typeof va === "string") return sortDir * va.localeCompare(vb);
        return sortDir * (va - vb);
    });

    tbody.innerHTML = sorted.map((d, i) => {
        const statusClass = d.status === "Complete" ? "status-complete" : d.status === "In Progress" ? "status-partial" : "status-pending";
        return `<tr data-state="${d.state}">
            <td>${i + 1}</td>
            <td><strong>${d.state}</strong></td>
            <td>${d.population.toLocaleString()}</td>
            <td>$${d.gdp}B</td>
            <td>${d.housing.toFixed(1)}</td>
            <td><span class="status-badge ${statusClass}">${d.status}</span></td>
        </tr>`;
    }).join("");

    tbody.querySelectorAll("tr").forEach(tr => {
        tr.addEventListener("click", () => {
            const d = DATA.find(x => x.state === tr.dataset.state);
            if (d) showStateDetail(d);
        });
    });
}

function setMetric(metric) {
    currentMetric = metric;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("active", b.dataset.metric === metric));
    addMarkers();
    renderBarChart();
    renderPieChart();
}

const FALLBACK_DATA = [
    { state: "Alabama", population: 5024279, gdp: 215, housing: 145.2, status: "Complete" },
    { state: "Alaska", population: 733391, gdp: 55, housing: 205.8, status: "Complete" },
    { state: "Arizona", population: 7151502, gdp: 390, housing: 265.4, status: "Complete" },
    { state: "Arkansas", population: 3011524, gdp: 135, housing: 138.7, status: "Complete" },
    { state: "California", population: 39538223, gdp: 3372, housing: 420.5, status: "Complete" },
    { state: "Colorado", population: 5773714, gdp: 415, housing: 315.2, status: "Complete" },
    { state: "Connecticut", population: 3605944, gdp: 285, housing: 178.9, status: "Complete" },
    { state: "Delaware", population: 989948, gdp: 80, housing: 195.3, status: "Complete" },
    { state: "Florida", population: 21538187, gdp: 1112, housing: 289.7, status: "Complete" },
    { state: "Georgia", population: 10711908, gdp: 656, housing: 198.4, status: "Complete" },
    { state: "Hawaii", population: 1455271, gdp: 90, housing: 485.2, status: "Complete" },
    { state: "Idaho", population: 1839106, gdp: 85, housing: 285.6, status: "Complete" },
    { state: "Illinois", population: 12812508, gdp: 905, housing: 178.2, status: "Complete" },
    { state: "Indiana", population: 6785528, gdp: 380, housing: 165.8, status: "Complete" },
    { state: "Iowa", population: 3190369, gdp: 200, housing: 172.4, status: "Complete" },
    { state: "Kansas", population: 2937880, gdp: 175, housing: 158.9, status: "Complete" },
    { state: "Kentucky", population: 4505836, gdp: 215, housing: 162.3, status: "Complete" },
    { state: "Louisiana", population: 4657757, gdp: 265, housing: 168.5, status: "Complete" },
    { state: "Maine", population: 1362359, gdp: 70, housing: 215.7, status: "Complete" },
    { state: "Maryland", population: 6177224, gdp: 425, housing: 245.8, status: "Complete" },
    { state: "Massachusetts", population: 7029917, gdp: 590, housing: 275.4, status: "Complete" },
    { state: "Michigan", population: 10077331, gdp: 582, housing: 167.8, status: "Complete" },
    { state: "Minnesota", population: 5706494, gdp: 400, housing: 195.6, status: "Complete" },
    { state: "Mississippi", population: 2961279, gdp: 115, housing: 142.8, status: "Complete" },
    { state: "Missouri", population: 6154913, gdp: 340, housing: 168.9, status: "Complete" },
    { state: "Montana", population: 1084225, gdp: 55, housing: 295.3, status: "Complete" },
    { state: "Nebraska", population: 1961504, gdp: 130, housing: 178.5, status: "Complete" },
    { state: "Nevada", population: 3104614, gdp: 170, housing: 312.7, status: "Complete" },
    { state: "New Hampshire", population: 1377529, gdp: 90, housing: 228.4, status: "Complete" },
    { state: "New Jersey", population: 9288994, gdp: 620, housing: 245.6, status: "Complete" },
    { state: "New Mexico", population: 2117522, gdp: 105, housing: 198.7, status: "Complete" },
    { state: "New York", population: 20201249, gdp: 1774, housing: 312.4, status: "Complete" },
    { state: "North Carolina", population: 10439388, gdp: 624, housing: 189.3, status: "Complete" },
    { state: "North Dakota", population: 779094, gdp: 55, housing: 198.5, status: "Complete" },
    { state: "Ohio", population: 11799448, gdp: 712, housing: 156.9, status: "Complete" },
    { state: "Oklahoma", population: 3959353, gdp: 205, housing: 152.4, status: "Complete" },
    { state: "Oregon", population: 4237256, gdp: 265, housing: 285.3, status: "Complete" },
    { state: "Pennsylvania", population: 13002700, gdp: 809, housing: 234.8, status: "Complete" },
    { state: "Rhode Island", population: 1097379, gdp: 60, housing: 218.9, status: "Complete" },
    { state: "South Carolina", population: 5118425, gdp: 255, housing: 198.2, status: "Complete" },
    { state: "South Dakota", population: 886667, gdp: 60, housing: 185.4, status: "Complete" },
    { state: "Tennessee", population: 6910840, gdp: 400, housing: 198.7, status: "Complete" },
    { state: "Texas", population: 29145505, gdp: 1888, housing: 245.3, status: "Complete" },
    { state: "Utah", population: 3271616, gdp: 220, housing: 312.8, status: "Complete" },
    { state: "Vermont", population: 643077, gdp: 35, housing: 225.6, status: "Complete" },
    { state: "Virginia", population: 8631393, gdp: 575, housing: 248.9, status: "Complete" },
    { state: "Washington", population: 7614893, gdp: 635, housing: 345.2, status: "Complete" },
    { state: "West Virginia", population: 1793716, gdp: 80, housing: 128.5, status: "Complete" },
    { state: "Wisconsin", population: 5893718, gdp: 350, housing: 178.4, status: "Complete" },
    { state: "Wyoming", population: 576851, gdp: 40, housing: 225.8, status: "Complete" }
];

async function refreshData() {
    const btn = document.querySelector(".refresh-btn i");
    btn.className = "fas fa-spinner fa-spin";
    try {
        const res = await fetch("/api/refresh");
        const result = await res.json();
        if (result.error) throw new Error(result.error);
        await fetchData();
        addMarkers();
        renderBarChart();
        renderPieChart();
        renderTable(DATA);
    } catch (e) {
        alert("Failed to refresh data: " + e.message);
    }
    btn.className = "fas fa-sync-alt";
}

async function fetchData() {
    try {
        const res = await fetch("/api/data");
        if (!res.ok) throw new Error("API not available");
        DATA = await res.json();
    } catch {
        DATA = FALLBACK_DATA;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await fetchData();
    initMap();
    initCharts();
    renderTable(DATA);

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => setMetric(btn.dataset.metric));
    });

    document.getElementById("closePanel").addEventListener("click", () => {
        document.getElementById("panelContent").classList.add("hidden");
        document.querySelector(".panel-placeholder").classList.remove("hidden");
    });

    document.getElementById("searchInput").addEventListener("input", e => {
        const q = e.target.value.toLowerCase();
        renderTable(DATA.filter(d => d.state.toLowerCase().includes(q)));
    });

    document.querySelectorAll("thead th[data-sort]").forEach(th => {
        th.addEventListener("click", () => {
            const col = th.dataset.sort;
            if (sortCol === col) sortDir *= -1;
            else { sortCol = col; sortDir = -1; }
            renderTable(DATA.filter(d => d.state.toLowerCase().includes(document.getElementById("searchInput").value.toLowerCase())));
        });
    });
});
