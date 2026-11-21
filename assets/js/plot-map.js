// Kaghan Properties — Unified Interactive Pinned Plot Map & Live Emap CAD Engine
// Crystal-sharp Google Satellite/Street + Infinitely Sharp SVG Vector Masterplan Zones + Pulsing Plot Pins
// + 1-Click Live Emap CAD (HD) for individual plot numbers + Optional Custom 4K/XYZ Tile CAD Overlay from Admin Settings.

(function () {
    const MARGALLA_CENTER = [33.7001, 73.1810];
    const MARGALLA_BOUNDS = [[33.68592, 73.16362], [33.71606, 73.19890]];
    const EMAP_URL = 'https://emap.pk/margalla-enclave-islamabad-map';

    // Crisp vector masterplan polygons & landmarks (100% SVG — zero pixelation at any zoom level)
    const MARGALLA_PERIMETER = [
        [33.6882, 73.1652], [33.6960, 73.1655], [33.7038, 73.1672],
        [33.7052, 73.1715], [33.7155, 73.1938], [33.7120, 73.1960],
        [33.7042, 73.1912], [33.6960, 73.1978], [33.6905, 73.1945],
        [33.6870, 73.1845], [33.6865, 73.1725]
    ];

    const BOTANICAL_GARDEN = [
        [33.7046, 73.1710], [33.7152, 73.1924], [33.7130, 73.1942], [33.7032, 73.1742]
    ];

    const LAKE_DISTRICT = [
        [33.6982, 73.1742], [33.7026, 73.1782], [33.7008, 73.1818], [33.6965, 73.1772]
    ];

    const MAIN_BOULEVARD = [
        [33.6885, 73.1662], [33.6960, 73.1755], [33.7035, 73.1865], [33.7068, 73.1918]
    ];

    const SECTOR_LABELS = [
        { coords: [33.7098, 73.1835], name: 'Botanical Garden', color: '#10b981' },
        { coords: [33.7072, 73.1852], name: 'Sector A • Residential', color: '#f43f5e' },
        { coords: [33.6996, 73.1778], name: 'Lake District', color: '#06b6d4' },
        { coords: [33.7045, 73.1820], name: 'Grand Mosque Zone', color: '#ef4444' },
        { coords: [33.6948, 73.1835], name: 'Sector B • Residential', color: '#f59e0b' },
        { coords: [33.6965, 73.1758], name: 'Commercial Boulevard', color: '#3b82f6' }
    ];

    // Fallback spread inside Margalla Enclave if a listing lacks explicit coordinates
    const FALLBACK_SLOTS = [
        [33.7085, 73.1840],
        [33.7020, 73.1780],
        [33.7050, 73.1825],
        [33.6960, 73.1740],
        [33.7065, 73.1815],
        [33.6988, 73.1855],
        [33.6935, 73.1810],
        [33.7012, 73.1872],
        [33.6952, 73.1782]
    ];

    function formatShortPrice(price) {
        if (window.KaghanSharedUI && window.KaghanSharedUI.formatPrice) {
            return window.KaghanSharedUI.formatPrice(price);
        }
        if (!price || isNaN(price)) return 'Call for Price';
        if (price >= 10000000) return 'PKR ' + (price / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
        if (price >= 100000) return 'PKR ' + (price / 100000).toFixed(1).replace(/\.0$/, '') + ' Lac';
        return 'PKR ' + Number(price).toLocaleString();
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function getPlotCoords(p, fallbackIndex = -1) {
        if (!p) return null;
        const lat = p.lat != null ? parseFloat(p.lat) : (Array.isArray(p.coords) ? parseFloat(p.coords[0]) : (p.plotCoords ? parseFloat(p.plotCoords.lat) : NaN));
        const lng = p.lng != null ? parseFloat(p.lng) : (Array.isArray(p.coords) ? parseFloat(p.coords[1]) : (p.plotCoords ? parseFloat(p.plotCoords.lng) : NaN));
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
        if (fallbackIndex >= 0) {
            return FALLBACK_SLOTS[fallbackIndex % FALLBACK_SLOTS.length];
        }
        return null;
    }

    function injectStylesOnce() {
        if (document.getElementById('kaghan-plot-map-styles')) return;
        const style = document.createElement('style');
        style.id = 'kaghan-plot-map-styles';
        style.textContent = `
            .kp-plot-pin-icon { background: transparent; border: none; }
            .kp-pin-pill {
                display: inline-flex; align-items: center; gap: 4px;
                padding: 4px 10px; border-radius: 999px;
                font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 800;
                color: #fff; border: 2px solid #fff; white-space: nowrap;
                box-shadow: 0 6px 18px rgba(0,0,0,0.55);
                transition: transform 0.18s ease;
            }
            .kp-pin-pill:hover { transform: scale(1.08); }
            .kp-pin-pointer {
                width: 10px; height: 10px; transform: rotate(45deg);
                margin: -5px auto 0; border-right: 2px solid #fff; border-bottom: 2px solid #fff;
            }
            .kp-pin-pulse { animation: kpPinPulse 2s infinite; }
            @keyframes kpPinPulse {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.8), 0 6px 18px rgba(0,0,0,0.55); }
                70% { box-shadow: 0 0 0 14px rgba(16, 185, 129, 0), 0 6px 18px rgba(0,0,0,0.55); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0), 0 6px 18px rgba(0,0,0,0.55); }
            }
            .kp-sector-tag {
                background: rgba(15, 23, 42, 0.82);
                color: #f8fafc;
                border: 1.5px solid rgba(255, 255, 255, 0.35);
                border-radius: 8px;
                padding: 2px 7px;
                font-family: 'Inter', sans-serif;
                font-size: 10px;
                font-weight: 700;
                white-space: nowrap;
                box-shadow: 0 3px 10px rgba(0,0,0,0.35);
                pointer-events: none;
            }
            .kp-map-popup .leaflet-popup-content-wrapper {
                background: #0f172a; color: #f8fafc;
                border: 1.5px solid rgba(16, 185, 129, 0.6);
                border-radius: 14px; padding: 0; overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.6);
            }
            .kp-map-popup .leaflet-popup-content { margin: 0; padding: 12px 14px; }
            .kp-map-popup .leaflet-popup-tip { background: #0f172a; }
            .kp-map-fullscreen {
                position: fixed !important;
                inset: 0 !important;
                z-index: 9999 !important;
                border-radius: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                background: #0f172a !important;
            }
            .kp-map-fullscreen .kp-map-viewport {
                flex: 1 1 auto !important;
                height: auto !important;
            }
        `;
        document.head.appendChild(style);
    }

    const instances = new Map();

    function create(containerId, options = {}) {
        const root = document.getElementById(containerId);
        if (!root || typeof L === 'undefined') return null;

        injectStylesOnce();

        if (instances.has(containerId)) {
            const old = instances.get(containerId);
            if (old && old.map) old.map.remove();
            instances.delete(containerId);
        }

        const mode = options.mode || (options.property ? 'single' : 'multi');
        const height = options.height || (mode === 'single' ? '440px' : '540px');
        const singleProp = options.property || null;
        const initialProps = mode === 'single' ? (singleProp ? [singleProp] : []) : (options.properties || []);

        const singleCoords = singleProp ? getPlotCoords(singleProp, 0) : null;
        const navCoords = singleCoords || MARGALLA_CENTER;
        const uid = containerId.replace(/[^a-zA-Z0-9_-]/g, '');

        const plotBadgeText = singleProp && (singleProp.plotNumber || singleProp.plotDimensions)
            ? [singleProp.plotNumber, singleProp.plotDimensions, singleProp.plotStreet, singleProp.plotSector].filter(Boolean).join(' • ')
            : 'Margalla Enclave • CDA Zone 4, Islamabad';

        root.innerHTML = `
            <div id="${uid}-shell" class="bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden">
                <!-- Clean Crisp Map Toolbar -->
                <div class="bg-slate-900 text-white px-3.5 py-2.5 border-b-2 border-emerald-600/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <!-- Mode Switcher: Pinned Satellite vs Razor-Sharp Live Emap CAD -->
                    <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
                        <button type="button" id="${uid}-btn-pinned" class="px-3 py-1.5 rounded-lg font-bold bg-emerald-600 text-white flex items-center gap-1.5 transition-all">
                            <i class="fa-solid fa-map-pin"></i>
                            <span>Pinned Plot Map</span>
                        </button>
                        <button type="button" id="${uid}-btn-emap" class="px-3 py-1.5 rounded-lg font-bold text-amber-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all" title="Open sharp Emap.pk CAD layout with every plot number">
                            <i class="fa-solid fa-layer-group"></i>
                            <span>Live Emap CAD (HD Plots)</span>
                        </button>
                    </div>

                    <!-- Satellite / Vector Zones / Custom CAD Controls -->
                    <div id="${uid}-pinned-controls" class="flex flex-wrap items-center gap-2">
                        <button type="button" id="${uid}-btn-zones" class="px-2.5 py-1.5 rounded-lg bg-emerald-900/70 border border-emerald-500/60 text-emerald-300 font-bold text-[11px] flex items-center gap-1.5 transition-colors" title="Toggle crisp SVG vector sector boundaries">
                            <i class="fa-solid fa-draw-polygon"></i>
                            <span>Zones</span>
                        </button>

                        <!-- Custom High-Res CAD Opacity (Shown ONLY if Admin uploaded a 4K CAD or XYZ Tiles) -->
                        <label id="${uid}-cad-slider-wrap" class="hidden flex items-center gap-2 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-200">
                            <span class="font-semibold text-slate-300">HD CAD</span>
                            <input type="range" id="${uid}-opacity" min="0" max="100" value="80" class="w-16 sm:w-20 accent-emerald-500 cursor-pointer">
                            <span id="${uid}-opacity-val" class="font-mono text-emerald-400 w-7 text-right">80%</span>
                        </label>

                        <div class="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-700">
                            <button type="button" id="${uid}-layer-sat" class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 text-emerald-400">Satellite</button>
                            <button type="button" id="${uid}-layer-str" class="px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-400 hover:text-white">Street</button>
                        </div>

                        <button type="button" id="${uid}-btn-fs" title="Fullscreen Map" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors">
                            <i class="fa-solid fa-expand"></i>
                        </button>

                        <a id="${uid}-gps-link" href="https://www.google.com/maps/dir/?api=1&destination=${navCoords[0]},${navCoords[1]}" target="_blank" rel="noopener" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 border border-slate-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors">
                            <i class="fa-solid fa-location-arrow text-emerald-400"></i>
                            <span class="hidden sm:inline">Directions</span>
                        </a>
                    </div>

                    <!-- Emap Fullscreen Controls -->
                    <div id="${uid}-emap-controls" class="hidden flex items-center gap-2">
                        <button type="button" id="${uid}-btn-fs-emap" title="Toggle Fullscreen" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors">
                            <i class="fa-solid fa-expand"></i> Fullscreen
                        </button>
                        <a href="${EMAP_URL}" target="_blank" rel="noopener" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 border border-slate-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors">
                            <i class="fa-solid fa-up-right-from-square text-amber-400"></i> Open Emap
                        </a>
                    </div>
                </div>

                <!-- Map Viewport -->
                <div class="kp-map-viewport relative bg-slate-950" style="height: ${height};">
                    <!-- Leaflet Pinned Satellite Map (100% Crisp — Zero Blurry Raster Screenshot) -->
                    <div id="${uid}-leaflet" class="w-full h-full" style="z-index: 10;"></div>

                    <!-- Live Emap CAD Frame (Razor-Sharp Official Emap Plot Numbers) -->
                    <div id="${uid}-emap-wrap" class="hidden absolute inset-0 z-20 bg-slate-950">
                        <div class="absolute top-3 left-14 right-14 z-30 flex items-center justify-center pointer-events-none">
                            <div id="${uid}-emap-pin-bar" class="pointer-events-auto inline-flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl border border-emerald-500/50 shadow-xl text-xs font-bold">
                                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                                <span id="${uid}-emap-pin-text">${escapeHtml(plotBadgeText)}</span>
                            </div>
                        </div>
                        <iframe id="${uid}-emap-iframe" src="about:blank" class="w-full h-full border-0" loading="lazy" title="Margalla Enclave Emap CAD Layout" allow="geolocation"></iframe>
                    </div>
                </div>

                <!-- Bottom Pinned Plots Quick-Jump Strip (Multi-plot mode) -->
                <div id="${uid}-plot-strip" class="${mode === 'single' ? 'hidden' : ''} bg-slate-50 border-t-2 border-slate-200 px-3.5 py-2.5 flex items-center gap-2 overflow-x-auto text-[11px]"></div>
            </div>
        `;

        const mapEl = document.getElementById(`${uid}-leaflet`);
        const map = L.map(mapEl, {
            center: navCoords,
            zoom: mode === 'single' ? 16.5 : 15,
            minZoom: 11,
            maxZoom: 21,
            zoomSnap: 0.5,
            zoomDelta: 1,
            wheelPxPerZoomLevel: 80,
            scrollWheelZoom: true,
            touchZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            dragging: true,
            zoomControl: true
        });

        const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            maxNativeZoom: 20,
            maxZoom: 21,
            attribution: 'Google Satellite'
        }).addTo(map);

        const streetLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxNativeZoom: 20,
            maxZoom: 21,
            attribution: 'Google Maps'
        });

        // Crisp Infinitely-Sharp SVG Vector Masterplan Zones Layer
        const vectorZonesGroup = L.layerGroup().addTo(map);
        L.polygon(MARGALLA_PERIMETER, {
            color: '#10b981',
            weight: 2.5,
            dashArray: '8 5',
            fillColor: '#10b981',
            fillOpacity: 0.06,
            interactive: false
        }).addTo(vectorZonesGroup);

        L.polygon(BOTANICAL_GARDEN, {
            color: '#22c55e',
            weight: 1.5,
            fillColor: '#22c55e',
            fillOpacity: 0.22,
            interactive: false
        }).addTo(vectorZonesGroup);

        L.polygon(LAKE_DISTRICT, {
            color: '#06b6d4',
            weight: 2,
            fillColor: '#06b6d4',
            fillOpacity: 0.30,
            interactive: false
        }).addTo(vectorZonesGroup);

        L.polyline(MAIN_BOULEVARD, {
            color: '#fbbf24',
            weight: 3.5,
            opacity: 0.85,
            dashArray: '10 6',
            interactive: false
        }).addTo(vectorZonesGroup);

        SECTOR_LABELS.forEach(s => {
            L.marker(s.coords, {
                interactive: false,
                icon: L.divIcon({
                    className: 'kp-plot-pin-icon',
                    html: `<span class="kp-sector-tag" style="border-color:${s.color};">${escapeHtml(s.name)}</span>`,
                    iconSize: [120, 22],
                    iconAnchor: [60, 11]
                })
            }).addTo(vectorZonesGroup);
        });

        let customCadOverlay = null;
        let zonesVisible = true;

        // Load Admin Custom 4K CAD Image or XYZ Tile URL ONLY if explicitly configured
        async function loadCustomCadOverlay() {
            try {
                if (!window.KaghanDB || !window.KaghanDB.getSiteSettings) return;
                const settings = await window.KaghanDB.getSiteSettings();
                const cfg = settings && settings.cadOverlay;
                if (!cfg) return;
                const sliderWrap = document.getElementById(`${uid}-cad-slider-wrap`);
                if (cfg.tileUrl && cfg.tileUrl.trim()) {
                    customCadOverlay = L.tileLayer(cfg.tileUrl.trim(), {
                        opacity: 0.8,
                        maxNativeZoom: 20,
                        maxZoom: 21,
                        tms: !!cfg.tms
                    }).addTo(map);
                    if (sliderWrap) sliderWrap.classList.remove('hidden');
                } else if (cfg.imageUrl && cfg.imageUrl.trim()) {
                    const b = (Array.isArray(cfg.bounds) && cfg.bounds.length === 2) ? cfg.bounds : MARGALLA_BOUNDS;
                    customCadOverlay = L.imageOverlay(cfg.imageUrl.trim(), b, {
                        opacity: 0.8,
                        interactive: false
                    }).addTo(map);
                    if (sliderWrap) sliderWrap.classList.remove('hidden');
                }
            } catch (err) {}
        }
        loadCustomCadOverlay();

        const markersGroup = L.layerGroup().addTo(map);
        const markerIndex = new Map();

        function buildPopup(p, coords) {
            const priceText = formatShortPrice(p.price);
            const plotTag = p.plotNumber || 'Pinned Plot';
            const dims = p.plotDimensions || (p.sqYards ? `${p.sqYards} Sq Yds` : (p.size ? `${p.size} ${p.sizeUnit || 'Marla'}` : ''));
            const sub = [p.plotStreet, p.plotSector || p.sector].filter(Boolean).join(' • ');
            const detailUrl = p.isNewProject
                ? `project-detail.html?slug=${encodeURIComponent(p.slug || p.id)}`
                : `property.html?slug=${encodeURIComponent(p.slug || p.id)}`;
            const waText = encodeURIComponent(`Hi Kaghan Properties, I am interested in ${plotTag} — ${p.title} (${priceText}).`);

            return `
                <div style="min-width:215px; font-family:'Inter',sans-serif;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;">
                        <span style="font-size:10px; font-weight:800; text-transform:uppercase; color:#34d399;">${escapeHtml(plotTag)}</span>
                        <span style="font-size:10px; font-weight:700; color:#fbbf24;">${escapeHtml(dims)}</span>
                    </div>
                    <div style="font-size:13px; font-weight:800; color:#fff; line-height:1.3; margin-bottom:3px;">${escapeHtml(p.title)}</div>
                    ${sub ? `<div style="font-size:11px; color:#94a3b8; margin-bottom:6px;">${escapeHtml(sub)}</div>` : ''}
                    <div style="font-size:14px; font-weight:900; color:#fff; margin-bottom:10px;">${escapeHtml(priceText)}</div>
                    <div style="display:flex; gap:6px;">
                        ${mode !== 'single' ? `<a href="${detailUrl}" style="flex:1; text-align:center; background:#1e293b; color:#fff; font-size:11px; font-weight:700; padding:6px 8px; border-radius:8px; text-decoration:none; border:1px solid #334155;">View</a>` : ''}
                        <a href="https://wa.me/923340091127?text=${waText}" target="_blank" rel="noopener" style="flex:1; text-align:center; background:#059669; color:#fff; font-size:11px; font-weight:700; padding:6px 8px; border-radius:8px; text-decoration:none;">WhatsApp</a>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}" target="_blank" rel="noopener" title="Google Maps" style="background:#334155; color:#fff; font-size:11px; font-weight:700; padding:6px 9px; border-radius:8px; text-decoration:none;"><i class="fa-solid fa-location-arrow"></i></a>
                    </div>
                </div>
            `;
        }

        function renderMarkers(list) {
            markersGroup.clearLayers();
            markerIndex.clear();
            const boundsPoints = [];
            const stripItems = [];

            (list || []).forEach((p, idx) => {
                const coords = getPlotCoords(p, idx);
                if (!coords) return;
                boundsPoints.push(coords);

                const isComm = (p.type || '').toLowerCase().includes('comm') || (p.category || '').toLowerCase().includes('comm');
                const bg = isComm ? '#d97706' : '#059669';
                const label = p.plotNumber || (p.sqYards ? `${p.sqYards} SqYd` : `Plot #${idx + 1}`);
                const pulseCls = mode === 'single' ? 'kp-pin-pulse' : '';

                const icon = L.divIcon({
                    className: 'kp-plot-pin-icon',
                    html: `<div style="display:flex; flex-direction:column; align-items:center;">
                        <span class="kp-pin-pill ${pulseCls}" style="background:${bg};">
                            <i class="fa-solid fa-location-dot" style="font-size:10px;"></i>
                            <span>${escapeHtml(label)}</span>
                        </span>
                        <div class="kp-pin-pointer" style="background:${bg};"></div>
                    </div>`,
                    iconSize: [120, 36],
                    iconAnchor: [60, 34]
                });

                if (mode === 'single') {
                    L.circle(coords, {
                        radius: 42,
                        color: bg,
                        fillColor: bg,
                        fillOpacity: 0.24,
                        weight: 2.5
                    }).addTo(markersGroup);
                }

                const marker = L.marker(coords, { icon }).addTo(markersGroup);
                marker.bindPopup(buildPopup(p, coords), { className: 'kp-map-popup', maxWidth: 265 });
                markerIndex.set(p.id || String(idx), { marker, coords });

                stripItems.push({
                    key: p.id || String(idx),
                    label,
                    price: formatShortPrice(p.price),
                    isComm
                });

                if (mode === 'single') {
                    setTimeout(() => marker.openPopup(), 350);
                }
            });

            // Populate quick-jump strip in multi mode
            const strip = document.getElementById(`${uid}-plot-strip`);
            if (strip && mode !== 'single') {
                if (!stripItems.length) {
                    strip.innerHTML = `<span class="text-slate-400 font-medium">No pinned plots yet. Switch to <strong>Live Emap CAD (HD Plots)</strong> to browse all Margalla Enclave plot numbers.</span>`;
                } else {
                    strip.innerHTML = `<span class="text-slate-500 font-extrabold uppercase tracking-wider text-[10px] shrink-0 mr-1"><i class="fa-solid fa-map-pin text-emerald-600 mr-1"></i>Jump to Plot:</span>` +
                        stripItems.map(it => `
                            <button type="button" data-plot-key="${escapeHtml(it.key)}" class="kp-jump-chip shrink-0 px-2.5 py-1 rounded-lg bg-white border-2 border-slate-300 hover:border-emerald-600 text-slate-800 font-bold flex items-center gap-1.5 transition-colors">
                                <span class="w-2 h-2 rounded-full ${it.isComm ? 'bg-amber-500' : 'bg-emerald-600'}"></span>
                                <span>${escapeHtml(it.label)}</span>
                                <span class="text-emerald-700 font-extrabold">${escapeHtml(it.price)}</span>
                            </button>
                        `).join('');

                    strip.querySelectorAll('.kp-jump-chip').forEach(btn => {
                        btn.onclick = () => {
                            const entry = markerIndex.get(btn.getAttribute('data-plot-key'));
                            if (entry) {
                                btnPinned.click();
                                map.flyTo(entry.coords, 17, { duration: 0.7 });
                                setTimeout(() => entry.marker.openPopup(), 720);
                            }
                        };
                    });
                }
            }

            if (mode === 'multi' && boundsPoints.length > 1) {
                map.fitBounds(L.latLngBounds(boundsPoints), { padding: [55, 55], maxZoom: 15.5 });
            } else if (boundsPoints.length === 1) {
                map.setView(boundsPoints[0], 16.5);
            }
        }

        renderMarkers(initialProps);

        // Wire controls
        const btnPinned = document.getElementById(`${uid}-btn-pinned`);
        const btnEmap = document.getElementById(`${uid}-btn-emap`);
        const pinnedControls = document.getElementById(`${uid}-pinned-controls`);
        const emapControls = document.getElementById(`${uid}-emap-controls`);
        const emapWrap = document.getElementById(`${uid}-emap-wrap`);
        const emapIframe = document.getElementById(`${uid}-emap-iframe`);
        const btnZones = document.getElementById(`${uid}-btn-zones`);
        const opacityInput = document.getElementById(`${uid}-opacity`);
        const opacityVal = document.getElementById(`${uid}-opacity-val`);
        const btnSat = document.getElementById(`${uid}-layer-sat`);
        const btnStr = document.getElementById(`${uid}-layer-str`);
        const shellEl = document.getElementById(`${uid}-shell`);
        const btnFs = document.getElementById(`${uid}-btn-fs`);
        const btnFsEmap = document.getElementById(`${uid}-btn-fs-emap`);

        function toggleMapFullscreen() {
            const isFs = shellEl.classList.toggle('kp-map-fullscreen');
            document.body.style.overflow = isFs ? 'hidden' : '';
            if (btnFs) btnFs.innerHTML = isFs ? '<i class="fa-solid fa-compress"></i>' : '<i class="fa-solid fa-expand"></i>';
            if (btnFsEmap) btnFsEmap.innerHTML = isFs ? '<i class="fa-solid fa-compress"></i> Exit' : '<i class="fa-solid fa-expand"></i> Fullscreen';
            setTimeout(() => map.invalidateSize(), 150);
        }
        if (btnFs) btnFs.onclick = toggleMapFullscreen;
        if (btnFsEmap) btnFsEmap.onclick = toggleMapFullscreen;

        btnPinned.onclick = () => {
            btnPinned.className = 'px-3 py-1.5 rounded-lg font-bold bg-emerald-600 text-white flex items-center gap-1.5 transition-all';
            btnEmap.className = 'px-3 py-1.5 rounded-lg font-bold text-amber-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all';
            pinnedControls.classList.remove('hidden');
            emapControls.classList.add('hidden');
            emapWrap.classList.add('hidden');
            setTimeout(() => map.invalidateSize(), 150);
        };

        btnEmap.onclick = () => {
            btnEmap.className = 'px-3 py-1.5 rounded-lg font-bold bg-emerald-600 text-white flex items-center gap-1.5 transition-all';
            btnPinned.className = 'px-3 py-1.5 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all';
            pinnedControls.classList.add('hidden');
            emapControls.classList.remove('hidden');
            emapWrap.classList.remove('hidden');
            if (!emapIframe.src || emapIframe.src === 'about:blank' || !emapIframe.src.includes('emap.pk')) {
                emapIframe.src = EMAP_URL;
            }
        };

        if (btnZones) {
            btnZones.onclick = () => {
                zonesVisible = !zonesVisible;
                if (zonesVisible) {
                    vectorZonesGroup.addTo(map);
                    btnZones.className = 'px-2.5 py-1.5 rounded-lg bg-emerald-900/70 border border-emerald-500/60 text-emerald-300 font-bold text-[11px] flex items-center gap-1.5 transition-colors';
                } else {
                    map.removeLayer(vectorZonesGroup);
                    btnZones.className = 'px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 font-bold text-[11px] flex items-center gap-1.5 transition-colors';
                }
            };
        }

        if (opacityInput) {
            opacityInput.oninput = (e) => {
                const v = parseInt(e.target.value, 10);
                if (customCadOverlay && customCadOverlay.setOpacity) customCadOverlay.setOpacity(v / 100);
                if (opacityVal) opacityVal.innerText = v + '%';
            };
        }

        btnSat.onclick = () => {
            if (map.hasLayer(streetLayer)) map.removeLayer(streetLayer);
            if (!map.hasLayer(satelliteLayer)) satelliteLayer.addTo(map);
            if (customCadOverlay && customCadOverlay.bringToFront) customCadOverlay.bringToFront();
            btnSat.className = 'px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 text-emerald-400';
            btnStr.className = 'px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-400 hover:text-white';
        };

        btnStr.onclick = () => {
            if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
            if (!map.hasLayer(streetLayer)) streetLayer.addTo(map);
            if (customCadOverlay && customCadOverlay.bringToFront) customCadOverlay.bringToFront();
            btnStr.className = 'px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 text-emerald-400';
            btnSat.className = 'px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-400 hover:text-white';
        };

        setTimeout(() => map.invalidateSize(), 250);

        const api = {
            map,
            updateProperties: (list) => renderMarkers(list),
            invalidateSize: () => map.invalidateSize(),
            switchToEmap: () => btnEmap.click(),
            switchToPinned: () => btnPinned.click()
        };
        instances.set(containerId, api);
        return api;
    }

    window.KaghanPlotMap = {
        MARGALLA_CENTER,
        MARGALLA_BOUNDS,
        EMAP_URL,
        create,
        getPlotCoords
    };
})();
