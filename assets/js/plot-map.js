// Kaghan Properties — Unified Interactive Pinned Plot Map & Live Emap CAD Engine
// Zero API keys required. Supports multi-plot showcase (index, projects, project-detail)
// and single-plot focus (property.html), with georeferenced CAD masterplan overlay + opacity slider + live emap toggle.

(function () {
    const MARGALLA_CENTER = [33.7001, 73.1810];
    const MARGALLA_BOUNDS = [[33.68592, 73.16362], [33.71606, 73.19890]];
    const EMAP_URL = 'https://emap.pk/margalla-enclave-islamabad-map';

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

    function getPlotCoords(p) {
        if (!p) return null;
        const lat = p.lat != null ? parseFloat(p.lat) : (Array.isArray(p.coords) ? parseFloat(p.coords[0]) : (p.plotCoords ? parseFloat(p.plotCoords.lat) : NaN));
        const lng = p.lng != null ? parseFloat(p.lng) : (Array.isArray(p.coords) ? parseFloat(p.coords[1]) : (p.plotCoords ? parseFloat(p.plotCoords.lng) : NaN));
        if (isNaN(lat) || isNaN(lng)) return null;
        return [lat, lng];
    }

    function injectStylesOnce() {
        if (document.getElementById('kaghan-plot-map-styles')) return;
        const style = document.createElement('style');
        style.id = 'kaghan-plot-map-styles';
        style.textContent = `
            .kp-plot-pin-icon { background: transparent; border: none; }
            .kp-pin-pill {
                display: inline-flex; align-items: center; gap: 4px;
                padding: 3px 8px; border-radius: 999px;
                font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 800;
                color: #fff; border: 2px solid #fff; white-space: nowrap;
                box-shadow: 0 6px 16px rgba(0,0,0,0.45);
                transition: transform 0.18s ease;
            }
            .kp-pin-pill:hover { transform: scale(1.08); }
            .kp-pin-pointer {
                width: 10px; height: 10px; transform: rotate(45deg);
                margin: -5px auto 0; border-right: 2px solid #fff; border-bottom: 2px solid #fff;
            }
            .kp-pin-pulse {
                animation: kpPinPulse 2s infinite;
            }
            @keyframes kpPinPulse {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.75), 0 6px 16px rgba(0,0,0,0.45); }
                70% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0), 0 6px 16px rgba(0,0,0,0.45); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0), 0 6px 16px rgba(0,0,0,0.45); }
            }
            .kp-map-popup .leaflet-popup-content-wrapper {
                background: #0f172a; color: #f8fafc;
                border: 1px solid rgba(16, 185, 129, 0.45);
                border-radius: 14px; padding: 0; overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.55);
            }
            .kp-map-popup .leaflet-popup-content { margin: 0; padding: 12px 14px; }
            .kp-map-popup .leaflet-popup-tip { background: #0f172a; }
            .kp-cad-overlay-img {
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
            }
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

        // Clean up existing instance on same container
        if (instances.has(containerId)) {
            const old = instances.get(containerId);
            if (old && old.map) old.map.remove();
            instances.delete(containerId);
        }

        const mode = options.mode || (options.property ? 'single' : 'multi');
        const height = options.height || (mode === 'single' ? '440px' : '520px');
        const assetPrefix = options.assetPrefix || '';
        const defaultOpacity = typeof options.defaultOpacity === 'number' ? options.defaultOpacity : 0.75;
        const singleProp = options.property || null;
        const initialProps = mode === 'single' ? (singleProp ? [singleProp] : []) : (options.properties || []);

        const singleCoords = singleProp ? getPlotCoords(singleProp) : null;
        const navCoords = singleCoords || MARGALLA_CENTER;
        const uid = containerId.replace(/[^a-zA-Z0-9_-]/g, '');

        const plotBadgeText = singleProp && (singleProp.plotNumber || singleProp.plotDimensions)
            ? [singleProp.plotNumber, singleProp.plotDimensions, singleProp.plotStreet, singleProp.plotSector].filter(Boolean).join(' • ')
            : 'Margalla Enclave • CDA Zone 4, Islamabad';

        root.innerHTML = `
            <div id="${uid}-shell" class="bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden">
                <!-- Compact Map Toolbar -->
                <div class="bg-slate-900 text-white px-3.5 py-2.5 border-b-2 border-emerald-600/70 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <!-- View Mode Switcher -->
                    <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button type="button" id="${uid}-btn-pinned" class="px-3 py-1.5 rounded-lg font-bold bg-emerald-600 text-white flex items-center gap-1.5 transition-all">
                            <i class="fa-solid fa-map-pin"></i>
                            <span>Pinned Plot Map</span>
                        </button>
                        <button type="button" id="${uid}-btn-emap" class="px-3 py-1.5 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all" title="Switch to razor-sharp Emap CAD with individual plot numbers">
                            <i class="fa-solid fa-layer-group text-amber-400"></i>
                            <span>Live Emap CAD (HD)</span>
                        </button>
                    </div>

                    <!-- CAD Overlay Opacity + Base Map Controls -->
                    <div id="${uid}-pinned-controls" class="flex flex-wrap items-center gap-2">
                        <label class="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-200">
                            <span class="font-semibold text-slate-300">CAD Overlay</span>
                            <input type="range" id="${uid}-opacity" min="0" max="100" value="${Math.round(defaultOpacity * 100)}" class="w-20 sm:w-24 accent-emerald-500 cursor-pointer">
                            <span id="${uid}-opacity-val" class="font-mono text-emerald-400 w-8 text-right">${Math.round(defaultOpacity * 100)}%</span>
                        </label>
                        <div class="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                            <button type="button" id="${uid}-layer-sat" class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 text-emerald-400">Satellite</button>
                            <button type="button" id="${uid}-layer-str" class="px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-400 hover:text-white">Street</button>
                        </div>
                        <button type="button" id="${uid}-btn-fs" title="Toggle Fullscreen" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors">
                            <i class="fa-solid fa-expand"></i>
                        </button>
                        <a id="${uid}-gps-link" href="https://www.google.com/maps/dir/?api=1&destination=${navCoords[0]},${navCoords[1]}" target="_blank" rel="noopener" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors">
                            <i class="fa-solid fa-location-arrow text-emerald-400"></i>
                            <span class="hidden sm:inline">Directions</span>
                        </a>
                    </div>

                    <!-- Emap Fullscreen Controls -->
                    <div id="${uid}-emap-controls" class="hidden flex items-center gap-2">
                        <button type="button" id="${uid}-btn-fs-emap" title="Toggle Fullscreen" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors">
                            <i class="fa-solid fa-expand"></i> Fullscreen
                        </button>
                        <a href="${EMAP_URL}" target="_blank" rel="noopener" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors">
                            <i class="fa-solid fa-up-right-from-square text-amber-400"></i> Open Emap
                        </a>
                    </div>
                </div>

                <!-- Map Viewport -->
                <div class="kp-map-viewport relative bg-slate-950" style="height: ${height};">
                    <!-- Leaflet Pinned Map -->
                    <div id="${uid}-leaflet" class="w-full h-full" style="z-index: 10;"></div>

                    <!-- Live Emap CAD Frame + Floating Pin Locator -->
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
            </div>
        `;

        const mapEl = document.getElementById(`${uid}-leaflet`);
        const map = L.map(mapEl, {
            center: navCoords,
            zoom: mode === 'single' ? 16 : 14.5,
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

        let cadOverlay = L.imageOverlay(
            assetPrefix + 'assets/images/margalla-enclave-cad-clean.png',
            MARGALLA_BOUNDS,
            { opacity: defaultOpacity, interactive: false, className: 'kp-cad-overlay-img' }
        ).addTo(map);

        // Apply custom High-Res CAD Image or XYZ Tile URL if configured in Admin -> Settings
        async function loadCustomCadOverlay() {
            try {
                if (!window.KaghanDB || !window.KaghanDB.getSiteSettings) return;
                const settings = await window.KaghanDB.getSiteSettings();
                const cfg = settings && settings.cadOverlay;
                if (!cfg) return;
                const currentOp = parseInt(document.getElementById(`${uid}-opacity`)?.value || Math.round(defaultOpacity * 100), 10) / 100;
                if (cfg.tileUrl && cfg.tileUrl.trim()) {
                    if (cadOverlay && map.hasLayer(cadOverlay)) map.removeLayer(cadOverlay);
                    cadOverlay = L.tileLayer(cfg.tileUrl.trim(), {
                        opacity: currentOp,
                        maxNativeZoom: 20,
                        maxZoom: 21,
                        tms: !!cfg.tms,
                        className: 'kp-cad-overlay-img'
                    }).addTo(map);
                } else if (cfg.imageUrl && cfg.imageUrl.trim()) {
                    const b = (Array.isArray(cfg.bounds) && cfg.bounds.length === 2) ? cfg.bounds : MARGALLA_BOUNDS;
                    if (cadOverlay && map.hasLayer(cadOverlay)) map.removeLayer(cadOverlay);
                    cadOverlay = L.imageOverlay(cfg.imageUrl.trim(), b, {
                        opacity: currentOp,
                        interactive: false,
                        className: 'kp-cad-overlay-img'
                    }).addTo(map);
                }
            } catch (err) {}
        }
        loadCustomCadOverlay();

        const markersGroup = L.layerGroup().addTo(map);

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
                <div style="min-width:210px; font-family:'Inter',sans-serif;">
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
            const boundsPoints = [];

            (list || []).forEach(p => {
                const coords = getPlotCoords(p);
                if (!coords) return;
                boundsPoints.push(coords);

                const isComm = (p.type || '').toLowerCase().includes('comm') || (p.category || '').toLowerCase().includes('comm');
                const bg = isComm ? '#d97706' : '#059669';
                const label = p.plotNumber || (p.sqYards ? `${p.sqYards} SqYd` : 'Plot');
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
                    iconSize: [110, 34],
                    iconAnchor: [55, 32]
                });

                if (mode === 'single') {
                    L.circle(coords, {
                        radius: 45,
                        color: bg,
                        fillColor: bg,
                        fillOpacity: 0.22,
                        weight: 2
                    }).addTo(markersGroup);
                }

                const marker = L.marker(coords, { icon }).addTo(markersGroup);
                marker.bindPopup(buildPopup(p, coords), { className: 'kp-map-popup', maxWidth: 260 });

                if (mode === 'single') {
                    setTimeout(() => marker.openPopup(), 350);
                }
            });

            if (mode === 'multi' && boundsPoints.length > 1) {
                map.fitBounds(L.latLngBounds(boundsPoints), { padding: [45, 45], maxZoom: 16 });
            } else if (boundsPoints.length === 1) {
                map.setView(boundsPoints[0], 16);
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
            btnEmap.className = 'px-3 py-1.5 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all';
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

        opacityInput.oninput = (e) => {
            const v = parseInt(e.target.value, 10);
            if (cadOverlay && cadOverlay.setOpacity) cadOverlay.setOpacity(v / 100);
            opacityVal.innerText = v + '%';
        };

        btnSat.onclick = () => {
            if (map.hasLayer(streetLayer)) map.removeLayer(streetLayer);
            if (!map.hasLayer(satelliteLayer)) satelliteLayer.addTo(map);
            if (cadOverlay && cadOverlay.bringToFront) cadOverlay.bringToFront();
            btnSat.className = 'px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 text-emerald-400';
            btnStr.className = 'px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-400 hover:text-white';
        };

        btnStr.onclick = () => {
            if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
            if (!map.hasLayer(streetLayer)) streetLayer.addTo(map);
            if (cadOverlay && cadOverlay.bringToFront) cadOverlay.bringToFront();
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
