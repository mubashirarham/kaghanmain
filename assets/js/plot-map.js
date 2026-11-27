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
    const DEFAULT_CAD_BOUNDS = [[33.68077, 73.16434], [33.71609, 73.20630]];

    function normalizeAssetUrl(u) {
        const s = String(u || '').trim();
        if (!s) return '';
        if (/^(https?:|data:|blob:|\/)/i.test(s)) return s;
        return '/' + s.replace(/^\.\//, '');
    }

    function normalizeAlignment(raw, bounds) {
        const b = (Array.isArray(bounds) && bounds.length === 2) ? bounds : DEFAULT_CAD_BOUNDS;
        const defaultAnchorLat = (Number(b[0][0]) + Number(b[1][0])) / 2;
        const defaultAnchorLng = (Number(b[0][1]) + Number(b[1][1])) / 2;
        const a = raw && typeof raw === 'object' ? raw : {};
        const sx = Number(a.scaleX != null ? a.scaleX : (a.scale != null ? a.scale : 1));
        const sy = Number(a.scaleY != null ? a.scaleY : (a.scale != null ? a.scale : 1));
        return {
            anchorLat: typeof a.anchorLat === 'number' && !isNaN(a.anchorLat) ? a.anchorLat : defaultAnchorLat,
            anchorLng: typeof a.anchorLng === 'number' && !isNaN(a.anchorLng) ? a.anchorLng : defaultAnchorLng,
            offsetLat: Number(a.offsetLat) || 0,
            offsetLng: Number(a.offsetLng) || 0,
            scaleX: (isFinite(sx) && sx > 0.2 && sx < 3) ? sx : 1,
            scaleY: (isFinite(sy) && sy > 0.2 && sy < 3) ? sy : 1,
            rotation: Number(a.rotation) || 0,
            opacity: (typeof a.opacity === 'number' && isFinite(a.opacity)) ? Math.max(0, Math.min(1, a.opacity)) : 0.82
        };
    }

    async function loadCadConfig(siteSettings) {
        const fsCad = (siteSettings && siteSettings.cadOverlay) || {};
        let manifest = null;
        try {
            const res = await fetch('/assets/cad-tiles/margalla-enclave/manifest.json?v=2');
            if (res.ok) manifest = await res.json();
        } catch (e) {}

        const bounds = (Array.isArray(fsCad.bounds) && fsCad.bounds.length === 2)
            ? fsCad.bounds
            : ((manifest && Array.isArray(manifest.overlayBounds) && manifest.overlayBounds.length === 2)
                ? manifest.overlayBounds
                : DEFAULT_CAD_BOUNDS);

        return {
            pdfUrl: normalizeAssetUrl(fsCad.pdfUrl || (manifest && manifest.pdfUrl) || ''),
            deepZoomUrl: normalizeAssetUrl(fsCad.deepZoomUrl || (manifest && manifest.deepZoomUrl) || ''),
            sheetWidth: fsCad.sheetWidth || (manifest && manifest.sheetWidth) || 8192,
            sheetHeight: fsCad.sheetHeight || (manifest && manifest.sheetHeight) || 7458,
            tileSize: fsCad.tileSize || (manifest && manifest.tileSize) || 512,
            maxZoom: typeof fsCad.maxZoom === 'number' ? fsCad.maxZoom : ((manifest && typeof manifest.maxZoom === 'number') ? manifest.maxZoom : 4),
            maxDisplayZoom: typeof fsCad.maxDisplayZoom === 'number' ? fsCad.maxDisplayZoom : ((manifest && typeof manifest.maxDisplayZoom === 'number') ? manifest.maxDisplayZoom : 6),
            tileUrl: normalizeAssetUrl(fsCad.tileUrl || (manifest && manifest.tileUrl) || ''),
            geoMinZoom: typeof fsCad.geoMinZoom === 'number' ? fsCad.geoMinZoom : ((manifest && typeof manifest.geoMinZoom === 'number') ? manifest.geoMinZoom : 12),
            geoMaxNativeZoom: typeof fsCad.geoMaxNativeZoom === 'number' ? fsCad.geoMaxNativeZoom : ((manifest && typeof manifest.geoMaxNativeZoom === 'number') ? manifest.geoMaxNativeZoom : 18),
            imageUrl: normalizeAssetUrl(fsCad.imageUrl || (manifest && manifest.overlayImageUrl) || ''),
            bounds,
            tms: !!fsCad.tms,
            alignment: normalizeAlignment(fsCad.alignment, bounds)
        };
    }

    // Precision Affine-Aligned CAD Layer (keeps 16K XYZ tiles razor-sharp at z=21 even when shifted/scaled/rotated!)
    function createAlignedCadLayer(map, cfg) {
        if (!map || typeof L === 'undefined' || !cfg || (!cfg.tileUrl && !cfg.imageUrl)) return null;

        const paneName = 'kp-cad-pane-' + Math.random().toString(36).slice(2, 8);
        const pane = map.createPane(paneName);
        pane.style.zIndex = '450';
        pane.style.pointerEvents = 'none';
        pane.style.willChange = 'transform';

        let currentAlignment = normalizeAlignment(cfg.alignment, cfg.bounds);
        let layer = null;

        if (cfg.tileUrl) {
            const CadAlignedTileLayer = L.TileLayer.extend({
                _getTiledPixelBounds: function (center) {
                    const m = this._map;
                    const a = this.options.alignment || {};
                    const tileZoom = this._tileZoom;
                    let adjCenter = center;
                    if (m && tileZoom != null && (a.offsetLat || a.offsetLng || a.rotation || (a.scaleX && a.scaleX !== 1) || (a.scaleY && a.scaleY !== 1))) {
                        const anchorPx = m.project([a.anchorLat, a.anchorLng], tileZoom);
                        const movedPx = m.project([a.anchorLat + (a.offsetLat || 0), a.anchorLng + (a.offsetLng || 0)], tileZoom);
                        const viewPx = m.project(center, tileZoom);
                        const vx = viewPx.x - movedPx.x;
                        const vy = viewPx.y - movedPx.y;
                        const rad = -((a.rotation || 0) * Math.PI) / 180;
                        const cos = Math.cos(rad);
                        const sin = Math.sin(rad);
                        const rx = vx * cos - vy * sin;
                        const ry = vx * sin + vy * cos;
                        const sx = Math.max(0.25, a.scaleX || 1);
                        const sy = Math.max(0.25, a.scaleY || 1);
                        adjCenter = m.unproject([anchorPx.x + rx / sx, anchorPx.y + ry / sy], tileZoom);
                    }
                    const pxBounds = L.TileLayer.prototype._getTiledPixelBounds.call(this, adjCenter);
                    const minScale = Math.min(Math.max(0.35, a.scaleX || 1), Math.max(0.35, a.scaleY || 1));
                    const rotPad = Math.abs(a.rotation || 0) > 0.1 ? 1.45 : 1.1;
                    const pad = Math.max(rotPad, (1 / minScale) * 1.2);
                    if (pad > 1.02) {
                        const c = pxBounds.getCenter();
                        const hw = (pxBounds.max.x - pxBounds.min.x) * 0.5 * pad;
                        const hh = (pxBounds.max.y - pxBounds.min.y) * 0.5 * pad;
                        return L.bounds([c.x - hw, c.y - hh], [c.x + hw, c.y + hh]);
                    }
                    return pxBounds;
                }
            });

            layer = new CadAlignedTileLayer(cfg.tileUrl, {
                pane: paneName,
                opacity: currentAlignment.opacity,
                minZoom: cfg.geoMinZoom != null ? cfg.geoMinZoom : 12,
                maxNativeZoom: cfg.geoMaxNativeZoom != null ? cfg.geoMaxNativeZoom : 18,
                maxZoom: 21,
                bounds: cfg.bounds,
                tms: !!cfg.tms,
                keepBuffer: 4,
                alignment: currentAlignment,
                errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
            }).addTo(map);
        } else if (cfg.imageUrl) {
            layer = L.imageOverlay(cfg.imageUrl, cfg.bounds, {
                pane: paneName,
                opacity: currentAlignment.opacity,
                interactive: false
            }).addTo(map);
            const ovEl = layer.getElement && layer.getElement();
            if (ovEl) {
                ovEl.fetchPriority = 'high';
                ovEl.decoding = 'async';
            }
        }

        function applyTransform() {
            if (!map || !pane) return;
            const a = currentAlignment;
            const p0 = map.latLngToLayerPoint([a.anchorLat, a.anchorLng]);
            const p1 = map.latLngToLayerPoint([a.anchorLat + (a.offsetLat || 0), a.anchorLng + (a.offsetLng || 0)]);
            const dx = p1.x - p0.x;
            const dy = p1.y - p0.y;
            const rot = a.rotation || 0;
            const sx = a.scaleX || 1;
            const sy = a.scaleY || 1;
            pane.style.transformOrigin = `${p0.x}px ${p0.y}px`;
            pane.style.transform = (dx === 0 && dy === 0 && rot === 0 && sx === 1 && sy === 1)
                ? ''
                : `translate3d(${dx}px, ${dy}px, 0) rotate(${rot}deg) scale(${sx}, ${sy})`;
        }

        map.on('viewreset zoomend zoom moveend', applyTransform);
        applyTransform();

        let tileRefreshTimer = null;
        function scheduleTileRefresh() {
            if (!layer || typeof layer._update !== 'function') return;
            if (tileRefreshTimer) clearTimeout(tileRefreshTimer);
            tileRefreshTimer = setTimeout(() => {
                if (layer && layer._map) {
                    layer.options.alignment = currentAlignment;
                    layer._update();
                }
            }, 110);
        }

        return {
            layer,
            pane,
            getAlignment: () => ({ ...currentAlignment }),
            setAlignment: (partial, immediateRefresh = false) => {
                currentAlignment = normalizeAlignment({ ...currentAlignment, ...partial }, cfg.bounds);
                if (layer) {
                    layer.options.alignment = currentAlignment;
                    if (typeof layer.setOpacity === 'function') layer.setOpacity(currentAlignment.opacity);
                }
                applyTransform();
                if (immediateRefresh) {
                    if (layer && layer._map && typeof layer._update === 'function') layer._update();
                } else {
                    scheduleTileRefresh();
                }
            },
            setOpacity: (val) => {
                currentAlignment.opacity = Math.max(0, Math.min(1, Number(val) || 0));
                if (layer && typeof layer.setOpacity === 'function') layer.setOpacity(currentAlignment.opacity);
            },
            bringToFront: () => {
                pane.style.zIndex = '450';
            },
            remove: () => {
                if (tileRefreshTimer) clearTimeout(tileRefreshTimer);
                map.off('viewreset zoomend zoom moveend', applyTransform);
                if (layer && map.hasLayer(layer)) map.removeLayer(layer);
                if (pane && pane.parentNode) pane.parentNode.removeChild(pane);
            }
        };
    }

    function create(containerId, options = {}) {
        const root = document.getElementById(containerId);
        if (!root || typeof L === 'undefined') return null;

        injectStylesOnce();

        if (instances.has(containerId)) {
            const old = instances.get(containerId);
            if (old && old.map) old.map.remove();
            if (old && old.cadMap) old.cadMap.remove();
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
        let activeCadPdfUrl = '';
        let activeDeepZoomCfg = null;
        let cadMap = null;
        let cadBounds = null;
        const plotBadgeText = singleProp && (singleProp.plotNumber || singleProp.plotDimensions)
            ? [singleProp.plotNumber, singleProp.plotDimensions, singleProp.plotStreet, singleProp.plotSector].filter(Boolean).join(' • ')
            : (singleProp ? singleProp.title : '');

        root.innerHTML = `
            <div id="${uid}-shell" class="bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden">
                <div class="bg-slate-900 text-white px-3.5 py-2.5 border-b-2 border-emerald-600/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div class="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
                        <button type="button" id="${uid}-btn-pinned" class="px-3 py-1.5 rounded-lg font-bold bg-emerald-600 text-white flex items-center gap-1.5 transition-all">
                            <i class="fa-solid fa-map-pin"></i>
                            <span>Pinned Plot Map</span>
                        </button>
                        <button type="button" id="${uid}-btn-cad" class="hidden px-3 py-1.5 rounded-lg font-bold text-emerald-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all">
                            <i class="fa-solid fa-compass-drafting"></i>
                            <span>HD CAD Master Plan (16K)</span>
                        </button>
                        <button type="button" id="${uid}-btn-emap" class="${activeEmapUrl ? '' : 'hidden'} px-3 py-1.5 rounded-lg font-bold text-amber-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all">
                            <i class="fa-solid fa-layer-group"></i>
                            <span>Live Emap CAD</span>
                        </button>
                    </div>

                    <div id="${uid}-pinned-controls" class="flex flex-wrap items-center gap-2">
                        <label id="${uid}-cad-slider-wrap" class="hidden flex items-center gap-2 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-200">
                            <span class="font-semibold text-slate-300">CAD Overlay</span>
                            <input type="range" id="${uid}-opacity" min="0" max="100" value="78" class="w-16 sm:w-20 accent-emerald-500 cursor-pointer">
                            <span id="${uid}-opacity-val" class="font-mono text-emerald-400 w-7 text-right">78%</span>
                        </label>

                        <div class="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-700">
                            <button type="button" id="${uid}-layer-sat" class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 text-emerald-400">Satellite</button>
                            <button type="button" id="${uid}-layer-str" class="px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-400 hover:text-white">Street</button>
                        </div>

                        <a id="${uid}-cad-pdf-pinned" href="#" download class="hidden px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs">
                            <i class="fa-solid fa-file-pdf"></i>
                            <span class="hidden sm:inline">Download CAD PDF</span>
                            <span class="sm:hidden">CAD PDF</span>
                        </a>

                        <button type="button" id="${uid}-btn-fs" title="Fullscreen Map" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors">
                            <i class="fa-solid fa-expand"></i>
                        </button>

                        <a id="${uid}-gps-link" href="https://www.google.com/maps/dir/?api=1&destination=${navCoords[0]},${navCoords[1]}" target="_blank" rel="noopener" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 border border-slate-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors">
                            <i class="fa-solid fa-location-arrow text-emerald-400"></i>
                            <span class="hidden sm:inline">Directions</span>
                        </a>
                    </div>

                    <div id="${uid}-cad-controls" class="hidden flex flex-wrap items-center gap-2">
                        <button type="button" id="${uid}-cad-fit" title="Fit Full CAD Sheet" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors">
                            <i class="fa-solid fa-arrows-to-dot text-emerald-400"></i> Fit Sheet
                        </button>
                        <a id="${uid}-cad-pdf-btn" href="#" download class="hidden px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs">
                            <i class="fa-solid fa-file-arrow-down"></i> Download Vector CAD (PDF)
                        </a>
                        <button type="button" id="${uid}-btn-fs-cad" title="Toggle Fullscreen" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors">
                            <i class="fa-solid fa-expand"></i> Fullscreen
                        </button>
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

                    <div id="${uid}-cad-wrap" class="hidden absolute inset-0 z-20 bg-white">
                        <div id="${uid}-cad-leaflet" class="w-full h-full bg-white"></div>
                        <div class="pointer-events-none absolute bottom-3 left-3 z-[400] bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-700 shadow-lg flex items-center gap-1.5">
                            <i class="fa-solid fa-magnifying-glass-plus text-emerald-400"></i>
                            <span>Scroll or pinch to zoom down to exact plot numbers &amp; street dimensions</span>
                        </div>
                    </div>

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

        // Hydrate Contact Phone, Emap URL, & High-Res 16K Aligned CAD Master Plan from Firestore siteSettings (or installed CAD manifest)
        async function hydrateMapFromFirestore() {
            try {
                const settings = (window.KaghanDB && window.KaghanDB.getSiteSettings)
                    ? await window.KaghanDB.getSiteSettings().catch(() => null)
                    : null;

                if (settings && settings.contact && settings.contact.phone) {
                    activePhoneDigits = settings.contact.phone.replace(/[^0-9]/g, '');
                    renderMarkers(lastRenderedList);
                }

                const emapUrl = activeEmapUrl || (settings && settings.mapConfig && settings.mapConfig.emapUrl) || '';
                if (emapUrl) {
                    activeEmapUrl = emapUrl;
                    const emBtn = document.getElementById(`${uid}-btn-emap`);
                    const emExt = document.getElementById(`${uid}-emap-ext`);
                    if (emBtn) emBtn.classList.remove('hidden');
                    if (emExt) emExt.href = emapUrl;
                }

                const cfg = await loadCadConfig(settings);

                if (cfg.pdfUrl) {
                    activeCadPdfUrl = cfg.pdfUrl;
                    [document.getElementById(`${uid}-cad-pdf-pinned`), document.getElementById(`${uid}-cad-pdf-btn`)].forEach(el => {
                        if (!el) return;
                        el.href = activeCadPdfUrl;
                        el.classList.remove('hidden');
                    });
                }

                if (cfg.deepZoomUrl) {
                    activeDeepZoomCfg = cfg;
                    const cadBtn = document.getElementById(`${uid}-btn-cad`);
                    if (cadBtn) cadBtn.classList.remove('hidden');
                }

                const sliderWrap = document.getElementById(`${uid}-cad-slider-wrap`);
                if (cfg.tileUrl || cfg.imageUrl) {
                    if (customCadOverlay && customCadOverlay.remove) customCadOverlay.remove();
                    customCadOverlay = createAlignedCadLayer(map, cfg);
                    if (sliderWrap) sliderWrap.classList.remove('hidden');
                    const pct = Math.round((cfg.alignment ? cfg.alignment.opacity : 0.82) * 100);
                    if (opacityInput) opacityInput.value = String(pct);
                    if (opacityVal) opacityVal.innerText = pct + '%';
                }
            } catch (err) {}
        }

        function ensureCadMapInitialized() {
            if (cadMap || !activeDeepZoomCfg) return;
            const cadEl = document.getElementById(`${uid}-cad-leaflet`);
            if (!cadEl) return;
            const { deepZoomUrl, sheetWidth, sheetHeight, tileSize, maxZoom, maxDisplayZoom } = activeDeepZoomCfg;
            const topZoom = Math.max(maxZoom + 2, maxDisplayZoom || 6);
            cadMap = L.map(cadEl, {
                crs: L.CRS.Simple,
                minZoom: 0,
                maxZoom: topZoom,
                zoomSnap: 0.25,
                zoomDelta: 0.75,
                wheelPxPerZoomLevel: 70,
                scrollWheelZoom: true,
                touchZoom: true,
                doubleClickZoom: true,
                boxZoom: true,
                dragging: true,
                zoomControl: true,
                maxBoundsViscosity: 0.85,
                attributionControl: false
            });

            const sw = cadMap.unproject([0, sheetHeight], maxZoom);
            const ne = cadMap.unproject([sheetWidth, 0], maxZoom);
            cadBounds = L.latLngBounds(sw, ne);

            L.tileLayer(deepZoomUrl, {
                tileSize,
                minZoom: 0,
                maxNativeZoom: maxZoom,
                maxZoom: topZoom,
                bounds: cadBounds,
                noWrap: true,
                keepBuffer: 4
            }).addTo(cadMap);

            cadMap.setMaxBounds(cadBounds.pad(0.08));
            cadMap.fitBounds(cadBounds);
            if (instances.has(containerId)) {
                instances.get(containerId).cadMap = cadMap;
            }
        }

        renderMarkers(initialProps);
        hydrateMapFromFirestore();

        const btnPinned = document.getElementById(`${uid}-btn-pinned`);
        const btnCad = document.getElementById(`${uid}-btn-cad`);
        const btnEmap = document.getElementById(`${uid}-btn-emap`);
        const pinnedControls = document.getElementById(`${uid}-pinned-controls`);
        const cadControls = document.getElementById(`${uid}-cad-controls`);
        const emapControls = document.getElementById(`${uid}-emap-controls`);
        const cadWrap = document.getElementById(`${uid}-cad-wrap`);
        const emapWrap = document.getElementById(`${uid}-emap-wrap`);
        const emapIframe = document.getElementById(`${uid}-emap-iframe`);
        const opacityInput = document.getElementById(`${uid}-opacity`);
        const opacityVal = document.getElementById(`${uid}-opacity-val`);
        const btnSat = document.getElementById(`${uid}-layer-sat`);
        const btnStr = document.getElementById(`${uid}-layer-str`);
        const shellEl = document.getElementById(`${uid}-shell`);
        const btnFs = document.getElementById(`${uid}-btn-fs`);
        const btnFsCad = document.getElementById(`${uid}-btn-fs-cad`);
        const btnFsEmap = document.getElementById(`${uid}-btn-fs-emap`);
        const btnCadFit = document.getElementById(`${uid}-cad-fit`);

        function toggleMapFullscreen() {
            const isFs = shellEl.classList.toggle('kp-map-fullscreen');
            document.body.style.overflow = isFs ? 'hidden' : '';
            if (btnFs) btnFs.innerHTML = isFs ? '<i class="fa-solid fa-compress"></i>' : '<i class="fa-solid fa-expand"></i>';
            if (btnFsCad) btnFsCad.innerHTML = isFs ? '<i class="fa-solid fa-compress"></i> Exit' : '<i class="fa-solid fa-expand"></i> Fullscreen';
            if (btnFsEmap) btnFsEmap.innerHTML = isFs ? '<i class="fa-solid fa-compress"></i> Exit' : '<i class="fa-solid fa-expand"></i> Fullscreen';
            setTimeout(() => {
                map.invalidateSize();
                if (cadMap) cadMap.invalidateSize();
            }, 150);
        }
        if (btnFs) btnFs.onclick = toggleMapFullscreen;
        if (btnFsCad) btnFsCad.onclick = toggleMapFullscreen;
        if (btnFsEmap) btnFsEmap.onclick = toggleMapFullscreen;
        if (btnCadFit) btnCadFit.onclick = () => { if (cadMap && cadBounds) cadMap.fitBounds(cadBounds); };

        function setActiveTab(tab) {
            const activeCls = 'px-3 py-1.5 rounded-lg font-bold bg-emerald-600 text-white flex items-center gap-1.5 transition-all';
            const idlePinned = 'px-3 py-1.5 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all';
            const idleCad = `${activeDeepZoomCfg ? '' : 'hidden'} px-3 py-1.5 rounded-lg font-bold text-emerald-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all`;
            const idleEmap = `${activeEmapUrl ? '' : 'hidden'} px-3 py-1.5 rounded-lg font-bold text-amber-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all`;

            btnPinned.className = tab === 'pinned' ? activeCls : idlePinned;
            if (btnCad) btnCad.className = tab === 'cad' ? activeCls : idleCad;
            btnEmap.className = tab === 'emap' ? activeCls : idleEmap;

            pinnedControls.classList.toggle('hidden', tab !== 'pinned');
            if (cadControls) cadControls.classList.toggle('hidden', tab !== 'cad');
            emapControls.classList.toggle('hidden', tab !== 'emap');

            if (cadWrap) cadWrap.classList.toggle('hidden', tab !== 'cad');
            emapWrap.classList.toggle('hidden', tab !== 'emap');
        }

        btnPinned.onclick = () => {
            setActiveTab('pinned');
            setTimeout(() => map.invalidateSize(), 150);
        };

        if (btnCad) {
            btnCad.onclick = () => {
                if (!activeDeepZoomCfg) return;
                setActiveTab('cad');
                setTimeout(() => {
                    ensureCadMapInitialized();
                    if (cadMap) cadMap.invalidateSize();
                }, 60);
            };
        }

        btnEmap.onclick = () => {
            if (!activeEmapUrl) return;
            setActiveTab('emap');
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
            cadMap: null,
            updateProperties: (list) => renderMarkers(list),
            invalidateSize: () => { map.invalidateSize(); if (cadMap) cadMap.invalidateSize(); },
            switchToCad: () => { if (btnCad) btnCad.click(); },
            switchToEmap: () => btnEmap.click(),
            switchToPinned: () => btnPinned.click()
        };
        instances.set(containerId, api);
        return api;
    }

    window.KaghanPlotMap = {
        create,
        getPlotCoords,
        loadCadConfig,
        createAlignedCadLayer,
        normalizeAlignment
    };
})();
