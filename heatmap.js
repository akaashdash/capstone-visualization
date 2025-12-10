(function() {
    const dataEl = document.getElementById('grid-data');
    const gridData = JSON.parse(dataEl.textContent);

    const cells = gridData.cells;
    const scores = cells.map(c => c.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // viridis color stops (same as CSS bar)
    const VIRIDIS_STOPS = [
        "#440154", "#482777", "#3f4a8a", "#31678e",
        "#26838f", "#1f9d8a", "#6cce5a", "#b6de2b", "#fee825"
    ];

    function hexToRgb(hex) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!m) return [0, 0, 0];
        return [
            parseInt(m[1], 16),
            parseInt(m[2], 16),
            parseInt(m[3], 16)
        ];
    }

    function rgbToHex(r, g, b) {
        const comp = (x) => {
            const v = Math.max(0, Math.min(255, Math.round(x)));
            return v.toString(16).padStart(2, "0");
        };
        return "#" + comp(r) + comp(g) + comp(b);
    }

    function interpolateColor(c1, c2, t) {
        const [r1, g1, b1] = hexToRgb(c1);
        const [r2, g2, b2] = hexToRgb(c2);
        const r = r1 + (r2 - r1) * t;
        const g = g1 + (g2 - g1) * t;
        const b = b1 + (b2 - b1) * t;
        return rgbToHex(r, g, b);
    }

    function viridis(t) {
        if (!isFinite(t)) return "#cccccc";
        t = Math.max(0, Math.min(1, t));
        const pos = t * (VIRIDIS_STOPS.length - 1);
        const i0 = Math.floor(pos);
        const i1 = Math.min(VIRIDIS_STOPS.length - 1, i0 + 1);
        const frac = pos - i0;
        return interpolateColor(VIRIDIS_STOPS[i0], VIRIDIS_STOPS[i1], frac);
    }

    function normalizeScore(s) {
        if (maxScore === minScore) return 0.5;
        return (s - minScore) / (maxScore - minScore);
    }

    // Build axes labels + grid
    const container = document.getElementById("my_dataviz");

    const topTitle = document.createElement("div");
    topTitle.id = "title";
    topTitle.textContent = "SAE Feature Heatmap";
    container.appendChild(topTitle);

    const outer = document.createElement("div");
    outer.style.display = "flex";
    outer.style.flexDirection = "row";
    outer.style.alignItems = "flex-start";
    container.appendChild(outer);

    // Row labels (features)
    const rowLabels = document.createElement("div");
    rowLabels.className = "axis-row-labels";
    for (let f = 0; f < gridData.num_features; f++) {
        const lbl = document.createElement("div");
        lbl.className = "axis-row-label";
        lbl.textContent = "feat " + f;
        rowLabels.appendChild(lbl);
    }
    outer.appendChild(rowLabels);

    // Grid
    const grid = document.createElement("div");
    grid.className = "heatmap";
    outer.appendChild(grid);

    // Create cells
    cells.forEach(cell => {
        const div = document.createElement("div");
        div.className = "cell";

        const norm = normalizeScore(cell.score);
        div.style.backgroundColor = viridis(norm);

        div.dataset.layer = cell.layer;
        div.dataset.feature = cell.feature;
        div.dataset.score = cell.score;
        div.dataset.detailUrl = cell.detail_url;

        grid.appendChild(div);
    });

    // Column labels (layers)
    const colLabels = document.createElement("div");
    colLabels.className = "axis-col-labels";
    colLabels.style.marginLeft = "32px"; // align under grid
    for (let l = 0; l < gridData.num_layers; l++) {
        const lbl = document.createElement("div");
        lbl.className = "axis-col-label";
        lbl.textContent = l;
        colLabels.appendChild(lbl);
    }
    container.appendChild(colLabels);

    // Color bar
    const colorBar = document.createElement("div");
    colorBar.className = "viridis-scale";
    container.appendChild(colorBar);

    const colorBarLabels = document.createElement("div");
    colorBarLabels.style.display = "flex";
    colorBarLabels.style.justifyContent = "space-between";
    colorBarLabels.style.width = "220px";
    colorBarLabels.style.fontSize = "9px";
    colorBarLabels.style.marginTop = "2px";
    const minSpan = document.createElement("span");
    const maxSpan = document.createElement("span");
    minSpan.textContent = minScore.toFixed(2);
    maxSpan.textContent = maxScore.toFixed(2);
    colorBarLabels.appendChild(minSpan);
    colorBarLabels.appendChild(maxSpan);
    container.appendChild(colorBarLabels);

    // Tooltip handling
    const tooltip = document.getElementById("tooltip");

    function showTooltip(evt, cell) {
        const rect = document.body.getBoundingClientRect();
        tooltip.style.display = "block";
        tooltip.style.left = (evt.clientX - rect.left + 8) + "px";
        tooltip.style.top = (evt.clientY - rect.top + 8) + "px";

        const layer = cell.dataset.layer;
        const feat = cell.dataset.feature;
        const score = parseFloat(cell.dataset.score);

        tooltip.innerHTML = `
            <strong>Layer ${layer}, Feature ${feat}</strong><br/>
            Score: ${score.toFixed(4)}
        `;
    }

    function hideTooltip() {
        tooltip.style.display = "none";
    }

    grid.addEventListener("mousemove", function(evt) {
        const target = evt.target;
        if (!target.classList.contains("cell")) {
            hideTooltip();
            return;
        }
        showTooltip(evt, target);
    });

    grid.addEventListener("mouseleave", hideTooltip);

    // Click → go to detail page
    grid.addEventListener("click", function(evt) {
        const target = evt.target;
        if (!target.classList.contains("cell")) return;
        const url = target.dataset.detailUrl;
        if (url) {
            window.location.href = url;
        }
    });
})();
