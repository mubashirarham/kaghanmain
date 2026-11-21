// Kaghan Properties — 100% Firestore-Driven Interactive Pinned Plot Map Engine
// Zero hardcoded fake coordinates, zero hardcoded phone numbers, zero blurry raster screenshots.
// Reads plot pins from Firestore listings and optional mapConfig / cadOverlay / contact phone from Firestore siteSettings.

(function () {
    const DEFAULT_VIEW = [33.7001, 73.1810];

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
        const lat = p.lat != null && p.lat !== '' ? parseFloat(p.lat) : (Array.isArray(p.coords) ? parseFloat(p.coords[0]) : (p.plotCoords ? parseFloat(p.plotCoords.lat) : NaN));
        const lng = p.lng != null && p.lng !== '' ? parseFloat(p.lng) : (Array.isArray(p.coords) ? parseFloat(p.coords[1]) : (p.plotCoords ? parseFloat(p.plotCoords.lng) : NaN));
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

        const singleCoords = singleProp ? getPlotCoords(singleProp) : null;
        const navCoords = singleCoords || options.center || DEFAULT_VIEW;
        const uid = containerId.replace(/[^a-zA-Z0-9_-]/g, '');

        let activePhoneDigits = '';
        let activeEmapUrl = options.emapUrl || '';
        const plotBadgeText = singleProp && (singleProp.plotNumber || singleProp.plotDimensions)
            ? [singleProp.plotNumber, singleProp.plotDimensions, singleProp.plotStreet, singleProp.plotSector].filter(Boolean).join(' • ')
            : (singleProp ? singleProp.title : '');

        root.innerHTML = `
            <div id="${uid}-shell" class="bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden">
                <div class="bg-slate-900 text-white px-3.5 py-2.5 border-b-2 border-emerald-600/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
                        <button type="button" id="${uid}-btn-pinned" class="px-3 py-1.5 rounded-lg font-bold bg-emerald-600 text-white flex items-center gap-1.5 transition-all">
                            <i class="fa-solid fa-map-pin"></i>
                            <span>Pinned Plot Map</span>
                        </button>
                        <button type="button" id="${uid}-btn-emap" class="${activeEmapUrl ? '' : 'hidden'} px-3 py-1.5 rounded-lg font-bold text-amber-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all">
                            <i class="fa-solid fa-layer-group"></i>
                            <span>Live Emap CAD (HD)</span>
                        </button>
                    </div>

                    <div id="${uid}-pinned-controls" class="flex flex-wrap items-center gap-2">
                        <label id="${uid}-cad-slider-wrap" class="hidden flex items-center gap-2 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-200">
                            <span class="font-semibold text-slate-300">CAD Overlay</span>
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

                    <div id="${uid}-emap-controls" class="hidden flex items-center gap-2">
                        <button type="button" id="${uid}-btn-fs-emap" title="Toggle Fullscreen" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors">
                            <i class="fa-solid fa-expand"></i> Fullscreen
                        </button>
                        <a id="${uid}-emap-ext" href="${escapeHtml(activeEmapUrl)}" target="_blank" rel="noopener" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 border border-slate-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors">
                            <i class="fa-solid fa-up-right-from-square text-amber-400"></i> Open Emap
                        </a>
                    </div>
                </div>

                <div class="kp-map-viewport relative bg-slate-950" style="height: ${height};">
                    <div id="${uid}-leaflet" class="w-full h-full" style="z-index: 10;"></div>

                    <div id="${uid}-emap-wrap" class="hidden absolute inset-0 z-20 bg-slate-950">
                        ${plotBadgeText ? `
                            <div class="absolute top-3 left-14 right-14 z-30 flex items-center justify-center pointer-events-none">
                                <div class="pointer-events-auto inline-flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl border border-emerald-500/50 shadow-xl text-xs font-bold">
                                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                                    <span>${escapeHtml(plotBadgeText)}</span>
                                </div>
                            </div>
                        ` : ''}
                        <iframe id="${uid}-emap-iframe" src="about:blank" class="w-full h-full border-0" loading="lazy" title="Interactive CAD Emap" allow="geolocation"></iframe>
                    </div>
                </div>

                <div id="${uid}-plot-strip" class="${mode === 'single' ? 'hidden' : ''} bg-slate-50 border-t-2 border-slate-200 px-3.5 py-2.5 flex items-center gap-2 overflow-x-auto text-[11px]"></div>
            </div>
        `;

        const mapEl = document.getElementById(`${uid}-leaflet`);
        const map = L.map(mapEl, {
            center: navCoords,
            zoom: mode === 'single' ? 16.5 : 14.5,
            minZoom: 5,
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

        let customCadOverlay = null;
        const markersGroup = L.layerGroup().addTo(map);
        const markerIndex = new Map();
        let lastRenderedList = initialProps;

        function buildPopup(p, coords) {
            const priceText = formatShortPrice(p.price);
            const plotTag = p.plotNumber || 'Pinned Plot';
            const dims = p.plotDimensions || (p.sqYards ? `${p.sqYards} Sq Yds` : (p.size ? `${p.size} ${p.sizeUnit || ''}` : ''));
            const sub = [p.plotStreet, p.plotSector || p.sector, p.area].filter(Boolean).join(' • ');
            const detailUrl = `property.html?slug=${encodeURIComponent(p.slug || p.id)}`;
            const waText = encodeURIComponent(`Hi, I am interested in ${plotTag} — ${p.title} (${priceText}).`);
            const waHref = activePhoneDigits ? `https://wa.me/${activePhoneDigits}?text=${waText}` : 'contact.html';

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
                        <a href="${waHref}" ${activePhoneDigits ? 'target="_blank" rel="noopener"' : ''} style="flex:1; text-align:center; background:#059669; color:#fff; font-size:11px; font-weight:700; padding:6px 8px; border-radius:8px; text-decoration:none;">WhatsApp</a>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}" target="_blank" rel="noopener" title="Google Maps" style="background:#334155; color:#fff; font-size:11px; font-weight:700; padding:6px 9px; border-radius:8px; text-decoration:none;"><i class="fa-solid fa-location-arrow"></i></a>
                    </div>
                </div>
            `;
        }

        function renderMarkers(list) {
            lastRenderedList = list || [];
            markersGroup.clearLayers();
            markerIndex.clear();
            const boundsPoints = [];
            const stripItems = [];

            lastRenderedList.forEach((p, idx) => {
                const coords = getPlotCoords(p);
                if (!coords) return;
                boundsPoints.push(coords);

                const isComm = (p.type || '').toLowerCase().includes('comm') || (p.category || '').toLowerCase().includes('comm');
                const bg = isComm ? '#d97706' : '#059669';
                const label = p.plotNumber || p.title.slice(0, 18);
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

            const strip = document.getElementById(`${uid}-plot-strip`);
            if (strip && mode !== 'single') {
                if (!stripItems.length) {
                    strip.innerHTML = `<span class="text-slate-500 font-medium">No pinned coordinates saved on listings yet. Add coordinates in Admin Panel to drop pins on the map.</span>`;
                } else {
                    strip.innerHTML = `<span class="text-slate-500 font-extrabold uppercase tracking-wider text-[10px] shrink-0 mr-1"><i class="fa-solid fa-map-pin text-emerald-600 mr-1"></i>Pinned Plots:</span>` +
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
                map.fitBounds(L.latLngBounds(boundsPoints), { padding: [55, 55], maxZoom: 16 });
            } else if (boundsPoints.length === 1) {
                map.setView(boundsPoints[0], 16.5);
                const gpsLink = document.getElementById(`${uid}-gps-link`);
                if (gpsLink) gpsLink.href = `https://www.google.com/maps/dir/?api=1&destination=${boundsPoints[0][0]},${boundsPoints[0][1]}`;
            }
        }

        // Hydrate Contact Phone, Emap URL, & Custom High-Res CAD Overlay from Firestore siteSettings
        async function hydrateMapFromFirestore() {
            try {
                if (!window.KaghanDB || !window.KaghanDB.getSiteSettings) return;
                const settings = await window.KaghanDB.getSiteSettings();
                if (!settings) return;

                if (settings.contact && settings.contact.phone) {
                    activePhoneDigits = settings.contact.phone.replace(/[^0-9]/g, '');
                    renderMarkers(lastRenderedList);
                }

                const emapUrl = activeEmapUrl || (settings.mapConfig && settings.mapConfig.emapUrl) || '';
                if (emapUrl) {
                    activeEmapUrl = emapUrl;
                    const emBtn = document.getElementById(`${uid}-btn-emap`);
                    const emExt = document.getElementById(`${uid}-emap-ext`);
                    if (emBtn) emBtn.classList.remove('hidden');
                    if (emExt) emExt.href = emapUrl;
                }

                const cfg = settings.cadOverlay;
                if (cfg) {
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
                        const b = (Array.isArray(cfg.bounds) && cfg.bounds.length === 2)
                            ? cfg.bounds
                            : [[33.68592, 73.16362], [33.71606, 73.19890]];
                        customCadOverlay = L.imageOverlay(cfg.imageUrl.trim(), b, {
                            opacity: 0.8,
                            interactive: false
                        }).addTo(map);
                        if (sliderWrap) sliderWrap.classList.remove('hidden');
                    }
                }
            } catch (err) {}
        }

        renderMarkers(initialProps);
        hydrateMapFromFirestore();

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
            btnEmap.className = `${activeEmapUrl ? '' : 'hidden'} px-3 py-1.5 rounded-lg font-bold text-amber-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all`;
            pinnedControls.classList.remove('hidden');
            emapControls.classList.add('hidden');
            emapWrap.classList.add('hidden');
            setTimeout(() => map.invalidateSize(), 150);
        };

        btnEmap.onclick = () => {
            if (!activeEmapUrl) return;
            btnEmap.className = 'px-3 py-1.5 rounded-lg font-bold bg-emerald-600 text-white flex items-center gap-1.5 transition-all';
            btnPinned.className = 'px-3 py-1.5 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all';
            pinnedControls.classList.add('hidden');
            emapControls.classList.remove('hidden');
            emapWrap.classList.remove('hidden');
            if (!emapIframe.src || emapIframe.src === 'about:blank') {
                emapIframe.src = activeEmapUrl;
            }
        };

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
        create,
        getPlotCoords
    };
})();
