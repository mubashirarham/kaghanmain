// Kaghan Properties — Shared Header, Footer & Global UI Engine
// 100% Firestore-hydrated brand details, contact numbers, office address, social links, and maintenance mode.

window.KaghanSharedUI = {
    currency: localStorage.getItem('kaghan_currency') || 'PKR',
    areaUnit: localStorage.getItem('kaghan_area_unit') || 'marla',
    siteSettings: null,

    init: function () {
        if (window.KaghanMaintenance) window.KaghanMaintenance.init();
        this.renderHeader();
        this.renderFooter();
        this.renderModals();
        this.renderFloatingWhatsApp();
        this.initScrollHandlers();
        this.hydrateSiteSettings();
    },

    getActivePage: function () {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('project-detail')) return 'project-detail';
        if (path.includes('projects.html') || path.includes('/projects')) return 'projects';
        if (path.includes('property.html') || path.includes('/property')) return 'property-detail';
        if (path.includes('blog.html') || path.includes('/blog')) return 'blog';
        if (path.includes('contact.html') || path.includes('/contact')) return 'contact';
        if (path.includes('about.html') || path.includes('/about')) return 'about';
        if (path.includes('privacy')) return 'privacy';
        return 'home';
    },

    formatPrice: function (priceInPKR) {
        if (!priceInPKR || isNaN(priceInPKR)) return 'Call for Price';
        const cur = this.currency.toUpperCase();
        const rates = { PKR: 1, USD: 1 / 278, AED: 1 / 75.8 };
        const converted = priceInPKR * (rates[cur] || 1);

        if (cur === 'PKR') {
            if (converted >= 10000000) {
                return `PKR ${(converted / 10000000).toFixed(2).replace(/\.00$/, '')} Crore`;
            } else if (converted >= 100000) {
                return `PKR ${(converted / 100000).toFixed(2).replace(/\.00$/, '')} Lakh`;
            }
            return `PKR ${Math.round(converted).toLocaleString()}`;
        } else if (cur === 'USD') {
            return `$${Math.round(converted).toLocaleString()}`;
        } else if (cur === 'AED') {
            return `AED ${Math.round(converted).toLocaleString()}`;
        }
        return `PKR ${Math.round(converted).toLocaleString()}`;
    },

    formatArea: function (marlaSize) {
        if (!marlaSize) return '';
        const unit = (this.areaUnit || 'marla').toLowerCase();
        if (unit === 'sqft') return `${Math.round(marlaSize * 225).toLocaleString()} Sq. Ft.`;
        if (unit === 'sqyd') return `${Math.round(marlaSize * 25).toLocaleString()} Sq. Yd.`;
        if (unit === 'sqm') return `${(marlaSize * 20.903).toFixed(1).replace(/\.0$/, '')} Sq. M.`;
        if (unit === 'kanal') return `${(marlaSize / 20).toFixed(2).replace(/\.00$/, '')} Kanal`;
        return `${marlaSize} Marla`;
    },

    setCurrency: function (cur) {
        this.currency = cur;
        localStorage.setItem('kaghan_currency', cur);
        window.dispatchEvent(new CustomEvent('marketStateChanged', { detail: { currency: cur, areaUnit: this.areaUnit } }));
    },

    setAreaUnit: function (unit) {
        this.areaUnit = unit;
        localStorage.setItem('kaghan_area_unit', unit);
        window.dispatchEvent(new CustomEvent('marketStateChanged', { detail: { currency: this.currency, areaUnit: unit } }));
    },

    getWhatsAppHref: function (message = '') {
        const phone = (this.siteSettings && this.siteSettings.contact && this.siteSettings.contact.phone) || '';
        const digits = phone.replace(/[^0-9]/g, '');
        if (!digits) return 'contact.html';
        return message
            ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
            : `https://wa.me/${digits}`;
    },

    getPhoneHref: function () {
        const phone = (this.siteSettings && this.siteSettings.contact && this.siteSettings.contact.phone) || '';
        const clean = phone.replace(/[^0-9+]/g, '');
        return clean ? `tel:${clean}` : 'contact.html';
    },

    renderHeader: function () {
        const active = this.getActivePage();
        const headerContainer = document.getElementById('site-header') || document.querySelector('nav');
        if (!headerContainer) return;

        const navLinkCls = (isActive) => isActive
            ? 'px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-extrabold transition-all'
            : 'px-3 py-1.5 rounded-lg border border-transparent text-slate-700 hover:text-emerald-800 hover:bg-slate-50 hover:border-slate-300 font-bold transition-all';

        const navHtml = `
            <header id="main-site-header" class="sticky top-0 z-50 w-full bg-white/98 backdrop-blur-md border-b-2 border-slate-300 shadow-sm transition-all duration-300">
                <!-- Tier 1: Authority Utility Bar (Hydrated from Firestore siteSettings) -->
                <div class="bg-slate-900 text-slate-300 border-b-2 border-emerald-600/80 text-[11px] hidden sm:block">
                    <div class="market-container py-1.5 flex items-center justify-between gap-4">
                        <div class="flex items-center gap-4 min-w-0">
                            <span class="shared-tagline-badge inline-flex items-center gap-1.5 text-emerald-400 font-bold shrink-0">
                                <i class="fa-solid fa-shield-halved"></i>
                                <span class="shared-header-badge">Verified Real Estate Advisory</span>
                            </span>
                            <span class="text-slate-700">|</span>
                            <span class="text-slate-300 flex items-center gap-1.5 truncate">
                                <i class="fa-solid fa-location-dot text-amber-400 text-[10px] shrink-0"></i>
                                <span class="shared-address-text truncate"></span>
                            </span>
                        </div>

                        <div class="flex items-center gap-3 shrink-0">
                            <button type="button" onclick="window.KaghanSharedUI.openAreaUnitModal()" class="text-slate-300 hover:text-emerald-400 font-semibold flex items-center gap-1 transition-colors">
                                <i class="fa-solid fa-ruler-combined text-[10px] text-amber-400"></i>
                                <span>Area Converter</span>
                            </button>
                            <span class="text-slate-700">|</span>
                            <a href="contact.html" class="shared-phone-link text-white hover:text-emerald-400 font-bold tabular-nums flex items-center gap-1.5 transition-colors">
                                <i class="fa-solid fa-phone text-emerald-400 text-[10px]"></i>
                                <span class="shared-phone-text">Contact Us</span>
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Tier 2: Main Navigation Bar -->
                <div class="py-3">
                    <div class="market-container flex justify-between items-center text-xs gap-4">
                        <a href="index.html" class="flex items-center gap-3 group shrink-0">
                            <div class="p-1.5 rounded-xl bg-slate-50 border-2 border-slate-300 group-hover:border-emerald-600 transition-colors shadow-xs">
                                <img src="assets/images/logo.png" alt="Logo" class="shared-logo-img h-8 w-auto object-contain">
                            </div>
                            <div class="flex flex-col">
                                <span class="shared-site-name text-lg font-extrabold tracking-tight uppercase outfit text-slate-900 leading-none group-hover:text-emerald-700 transition-colors">Kaghan Properties</span>
                                <span class="shared-site-subtitle text-[9px] text-amber-600 tracking-[0.22em] uppercase font-extrabold mt-0.5">Real Estate</span>
                            </div>
                        </a>

                        <nav class="hidden lg:flex items-center gap-1.5 text-[13px]">
                            <a href="index.html" class="${navLinkCls(active === 'home')}">Home</a>
                            <a id="shared-nav-projects-link" href="index.html#home-projects-section" class="${navLinkCls(active === 'project-detail')}">Projects</a>
                            <a href="projects.html" class="${navLinkCls(active === 'projects')}">Listings</a>
                            <a href="index.html#plot-map" class="${navLinkCls(false)} inline-flex items-center gap-1.5">
                                <i class="fa-solid fa-map-pin text-emerald-600 text-xs"></i> Plot Map
                            </a>
                            <a href="about.html" class="${navLinkCls(active === 'about')}">About</a>
                            <a href="contact.html" class="${navLinkCls(active === 'contact')}">Contact</a>
                        </nav>

                        <div class="flex items-center gap-2">
                            <div class="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border-2 border-slate-300 hover:border-emerald-600 transition-colors">
                                <i class="fa-solid fa-coins text-amber-600 text-[10px]"></i>
                                <select id="header-currency-select" onchange="window.KaghanSharedUI.setCurrency(this.value)" aria-label="Currency" class="bg-transparent text-slate-900 font-extrabold text-[11px] focus:outline-none cursor-pointer">
                                    <option value="PKR" ${this.currency === 'PKR' ? 'selected' : ''}>PKR</option>
                                    <option value="USD" ${this.currency === 'USD' ? 'selected' : ''}>USD</option>
                                    <option value="AED" ${this.currency === 'AED' ? 'selected' : ''}>AED</option>
                                </select>
                            </div>

                            <a href="contact.html" class="shared-phone-link hidden md:inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 text-xs font-bold py-2 px-3.5 rounded-xl transition-colors">
                                <i class="fa-solid fa-phone text-emerald-400 text-[11px]"></i>
                                <span>Call</span>
                            </a>

                            <a href="contact.html" target="_blank" rel="noopener" class="shared-wa-link hidden sm:inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white border-2 border-emerald-800 text-xs font-bold py-2 px-4 rounded-xl shadow-xs transition-colors">
                                <i class="fa-brands fa-whatsapp text-sm"></i>
                                <span>WhatsApp</span>
                            </a>

                            <button onclick="window.KaghanSharedUI.toggleMobileMenu()" aria-label="Menu" class="lg:hidden p-2 text-slate-800 hover:text-emerald-700 bg-slate-50 border-2 border-slate-300 rounded-xl">
                                <i class="fa-solid fa-bars text-base"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div id="mobile-menu-drawer" onclick="if(event.target === this) window.KaghanSharedUI.toggleMobileMenu()" class="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[70] hidden flex flex-col justify-end">
                <div class="bg-white rounded-t-3xl border-t-4 border-emerald-600 p-5 space-y-4 shadow-2xl">
                    <div class="flex justify-between items-center border-b-2 border-slate-200 pb-3">
                        <div class="flex items-center gap-2.5">
                            <img src="assets/images/logo.png" alt="Logo" class="shared-logo-img h-7 w-auto">
                            <span class="shared-site-name font-extrabold outfit text-base text-slate-900 uppercase">Kaghan Properties</span>
                        </div>
                        <button onclick="window.KaghanSharedUI.toggleMobileMenu()" aria-label="Close menu" class="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="space-y-1 text-sm font-bold text-slate-800 divide-y divide-slate-200">
                        <a href="index.html" class="block py-2.5 hover:text-emerald-700">Home</a>
                        <a id="shared-mob-projects-link" href="index.html#home-projects-section" onclick="window.KaghanSharedUI.toggleMobileMenu()" class="block py-2.5 hover:text-emerald-700">Projects</a>
                        <a href="projects.html" class="block py-2.5 hover:text-emerald-700">Listings</a>
                        <a href="index.html#plot-map" onclick="window.KaghanSharedUI.toggleMobileMenu()" class="block py-2.5 text-emerald-700">Interactive Plot Map</a>
                        <a href="about.html" class="block py-2.5 hover:text-emerald-700">About Us</a>
                        <a href="contact.html" class="block py-2.5 hover:text-emerald-700">Contact</a>
                    </div>
                    <button type="button" onclick="window.KaghanSharedUI.toggleMobileMenu(); window.KaghanSharedUI.openAreaUnitModal();" class="w-full py-2.5 rounded-xl bg-slate-100 border-2 border-slate-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-2">
                        <i class="fa-solid fa-ruler-combined text-emerald-700"></i> Area Unit Converter
                    </button>
                    <div class="grid grid-cols-2 gap-2.5 pt-1">
                        <a href="contact.html" class="shared-phone-link btn-primary py-2.5 rounded-xl text-xs font-bold text-center"><i class="fa-solid fa-phone mr-1"></i> Call Now</a>
                        <a href="contact.html" target="_blank" rel="noopener" class="shared-wa-link btn-whatsapp py-2.5 rounded-xl text-xs font-bold text-center"><i class="fa-brands fa-whatsapp mr-1"></i> WhatsApp</a>
                    </div>
                </div>
            </div>
        `;

        if (headerContainer.tagName === 'NAV' || headerContainer.tagName === 'HEADER') {
            headerContainer.outerHTML = navHtml;
        } else {
            headerContainer.innerHTML = navHtml;
        }
    },

    toggleMobileMenu: function () {
        const drawer = document.getElementById('mobile-menu-drawer');
        if (drawer) {
            drawer.classList.toggle('hidden');
            document.body.style.overflow = drawer.classList.contains('hidden') ? '' : 'hidden';
        }
    },

    renderFooter: function () {
        const footerContainer = document.getElementById('site-footer') || document.querySelector('footer');
        if (!footerContainer) return;

        const footerHtml = `
            <footer class="bg-slate-950 text-slate-300 text-xs border-t-4 border-emerald-600 relative z-10">
                <div class="market-container py-12 sm:py-14">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-slate-800">
                        <!-- Column 1: Brand (Hydrated from Firestore siteSettings) -->
                        <div class="lg:col-span-4 space-y-4 lg:pr-6 lg:border-r lg:border-slate-800">
                            <a href="index.html" class="inline-flex items-center gap-3">
                                <div class="p-1.5 rounded-xl bg-white border-2 border-emerald-500/70">
                                    <img src="assets/images/logo.png" alt="Logo" class="shared-logo-img h-8 w-auto object-contain">
                                </div>
                                <div>
                                    <div class="shared-site-name font-extrabold outfit text-white text-lg uppercase tracking-wide leading-none">Kaghan Properties</div>
                                    <div class="shared-site-subtitle text-[9px] text-amber-400 uppercase tracking-[0.22em] font-bold mt-1">Real Estate Advisory</div>
                                </div>
                            </a>
                            <p class="shared-footer-bio text-slate-400 leading-relaxed text-xs"></p>
                            <div class="flex items-center gap-2 pt-1">
                                <a href="contact.html" target="_blank" rel="noopener" aria-label="WhatsApp" class="shared-wa-link w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                                    <i class="fa-brands fa-whatsapp text-sm"></i>
                                </a>
                                <a href="contact.html" aria-label="Phone" class="shared-phone-link w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                                    <i class="fa-solid fa-phone text-xs"></i>
                                </a>
                                <a href="contact.html" aria-label="Email" class="shared-email-link w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                                    <i class="fa-solid fa-envelope text-xs"></i>
                                </a>
                            </div>
                        </div>

                        <!-- Column 2: Explore -->
                        <div class="lg:col-span-2 space-y-3">
                            <h3 class="text-white font-extrabold outfit text-sm uppercase tracking-wider pb-2 border-b border-slate-800">Explore</h3>
                            <ul class="space-y-2.5 text-slate-400 font-medium">
                                <li><a href="index.html" class="hover:text-emerald-400 transition-colors flex items-center gap-2"><i class="fa-solid fa-chevron-right text-[8px] text-emerald-500"></i> Home</a></li>
                                <li><a href="projects.html" class="hover:text-emerald-400 transition-colors flex items-center gap-2"><i class="fa-solid fa-chevron-right text-[8px] text-emerald-500"></i> Listings</a></li>
                                <li><a href="index.html#plot-map" class="hover:text-emerald-400 transition-colors flex items-center gap-2"><i class="fa-solid fa-chevron-right text-[8px] text-emerald-500"></i> Plot Map</a></li>
                                <li><a href="about.html" class="hover:text-emerald-400 transition-colors flex items-center gap-2"><i class="fa-solid fa-chevron-right text-[8px] text-emerald-500"></i> About</a></li>
                                <li><a href="contact.html" class="hover:text-emerald-400 transition-colors flex items-center gap-2"><i class="fa-solid fa-chevron-right text-[8px] text-emerald-500"></i> Contact</a></li>
                            </ul>
                        </div>

                        <!-- Column 3: Dynamic Live Projects List (Hydrated from Firestore) -->
                        <div class="lg:col-span-3 space-y-3">
                            <h3 class="text-white font-extrabold outfit text-sm uppercase tracking-wider pb-2 border-b border-slate-800">Projects &amp; Tools</h3>
                            <ul id="shared-footer-projects" class="space-y-2.5 text-slate-400 font-medium">
                                <li><a href="projects.html?type=residential_plot" class="hover:text-emerald-400 transition-colors flex items-center gap-2"><i class="fa-solid fa-map-pin text-[10px] text-emerald-500"></i> Residential Plots</a></li>
                                <li><a href="projects.html?type=commercial_plot" class="hover:text-emerald-400 transition-colors flex items-center gap-2"><i class="fa-solid fa-map-pin text-[10px] text-amber-400"></i> Commercial Plots</a></li>
                                <li><button type="button" onclick="window.KaghanSharedUI.openAreaUnitModal()" class="hover:text-emerald-400 transition-colors flex items-center gap-2"><i class="fa-solid fa-calculator text-[10px] text-amber-400"></i> Area Unit Converter</button></li>
                            </ul>
                        </div>

                        <!-- Column 4: Head Office (Hydrated from Firestore siteSettings) -->
                        <div class="lg:col-span-3 space-y-3">
                            <h3 class="text-white font-extrabold outfit text-sm uppercase tracking-wider pb-2 border-b border-slate-800">Head Office</h3>
                            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                                <div class="flex items-start gap-2.5">
                                    <i class="fa-solid fa-location-dot text-emerald-400 mt-0.5"></i>
                                    <span class="shared-address-text text-slate-300 leading-snug"></span>
                                </div>
                                <div class="flex items-center gap-2.5">
                                    <i class="fa-solid fa-phone text-emerald-400"></i>
                                    <a href="contact.html" class="shared-phone-link text-white hover:text-emerald-400 font-bold tabular-nums"><span class="shared-phone-text"></span></a>
                                </div>
                                <div class="flex items-center gap-2.5">
                                    <i class="fa-solid fa-envelope text-amber-400"></i>
                                    <a href="contact.html" class="shared-email-link text-slate-300 hover:text-emerald-400 truncate"><span class="shared-email-text"></span></a>
                                </div>
                                <a href="contact.html" target="_blank" rel="noopener" class="shared-wa-link mt-1 w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 transition-colors">
                                    <i class="fa-brands fa-whatsapp text-sm"></i> Message Advisor
                                </a>
                            </div>
                        </div>
                    </div>

                    <div class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
                        <div>&copy; ${new Date().getFullYear()} <span class="shared-site-name text-slate-300 font-bold">Kaghan Properties</span>. All rights reserved.</div>
                        <div class="flex items-center gap-4">
                            <a href="privacy-policy.html" class="hover:text-emerald-400 transition-colors">Privacy Policy</a>
                            <span class="text-slate-800">&bull;</span>
                            <a href="contact.html" class="hover:text-emerald-400 transition-colors">Contact</a>
                            <span class="text-slate-800">&bull;</span>
                            <a href="admin/index.html" class="hover:text-emerald-400 transition-colors">Admin</a>
                        </div>
                    </div>
                </div>
            </footer>

            <button id="back-to-top" onclick="window.scrollTo({top: 0, behavior: 'smooth'})" class="back-to-top-btn" title="Back to Top">
                <i class="fa-solid fa-arrow-up text-sm"></i>
            </button>
        `;

        if (footerContainer.tagName === 'FOOTER') {
            footerContainer.outerHTML = footerHtml;
        } else {
            footerContainer.innerHTML = footerHtml;
        }
    },

    initScrollHandlers: function () {
        window.addEventListener('scroll', () => {
            const btn = document.getElementById('back-to-top');
            if (btn) btn.classList.toggle('visible', window.scrollY > 350);
        });
    },

    renderFloatingWhatsApp: function () {
        if (document.getElementById('global-floating-whatsapp')) return;
        const a = document.createElement('a');
        a.id = 'global-floating-whatsapp';
        a.href = 'contact.html';
        a.target = '_blank';
        a.rel = 'noopener';
        a.title = 'Chat on WhatsApp';
        a.className = 'shared-wa-link fixed bottom-6 right-6 z-40 bg-[#25d366] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform border-2 border-white/20';
        a.innerHTML = '<i class="fa-brands fa-whatsapp text-3xl"></i>';
        document.body.appendChild(a);
    },

    renderModals: function () {
        if (document.getElementById('global-modals-root')) return;
        const div = document.createElement('div');
        div.id = 'global-modals-root';
        div.innerHTML = `
            <div id="modal-unit-converter" onclick="if(event.target === this) window.KaghanSharedUI.closeAreaUnitModal()" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
                <div class="bg-white rounded-2xl border-2 border-slate-300 max-w-md w-full p-6 space-y-4 shadow-2xl relative">
                    <button onclick="window.KaghanSharedUI.closeAreaUnitModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-800">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                    <div class="border-b-2 border-slate-200 pb-2">
                        <h3 class="text-lg font-extrabold outfit text-slate-900">Area Unit Converter</h3>
                        <p class="text-xs text-slate-500">Convert Pakistani property units instantly.</p>
                    </div>
                    <div class="space-y-3 text-xs">
                        <div>
                            <label class="font-bold text-slate-700 block mb-1">Enter Area Value</label>
                            <input type="number" id="converter-input-val" value="5" oninput="window.KaghanSharedUI.recalcUnits()" class="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-emerald-600">
                        </div>
                        <div>
                            <label class="font-bold text-slate-700 block mb-1">From Unit</label>
                            <select id="converter-from-unit" onchange="window.KaghanSharedUI.recalcUnits()" class="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-emerald-600">
                                <option value="marla">Marla (1 Marla = 225 Sq Ft)</option>
                                <option value="sqft">Square Feet (Sq. Ft.)</option>
                                <option value="sqyd">Square Yards (Sq. Yd. / Gaz)</option>
                                <option value="sqm">Square Meters (Sq. M.)</option>
                                <option value="kanal">Kanal (1 Kanal = 20 Marla)</option>
                            </select>
                        </div>
                        <div class="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 space-y-2">
                            <div class="flex justify-between items-center text-xs font-semibold"><span class="text-slate-500">Marla:</span><span id="res-marla" class="text-emerald-700 font-bold tabular-nums">5.00 Marla</span></div>
                            <div class="flex justify-between items-center text-xs font-semibold"><span class="text-slate-500">Square Feet:</span><span id="res-sqft" class="text-emerald-700 font-bold tabular-nums">1,125 Sq. Ft.</span></div>
                            <div class="flex justify-between items-center text-xs font-semibold"><span class="text-slate-500">Square Yards:</span><span id="res-sqyd" class="text-emerald-700 font-bold tabular-nums">125 Sq. Yd.</span></div>
                            <div class="flex justify-between items-center text-xs font-semibold"><span class="text-slate-500">Square Meters:</span><span id="res-sqm" class="text-emerald-700 font-bold tabular-nums">104.5 Sq. M.</span></div>
                            <div class="flex justify-between items-center text-xs font-semibold"><span class="text-slate-500">Kanal:</span><span id="res-kanal" class="text-emerald-700 font-bold tabular-nums">0.25 Kanal</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    },

    openAreaUnitModal: function () {
        const m = document.getElementById('modal-unit-converter');
        if (m) {
            m.classList.remove('hidden');
            this.recalcUnits();
        }
    },

    closeAreaUnitModal: function () {
        const m = document.getElementById('modal-unit-converter');
        if (m) m.classList.add('hidden');
    },

    recalcUnits: function () {
        const val = parseFloat(document.getElementById('converter-input-val')?.value) || 0;
        const unit = document.getElementById('converter-from-unit')?.value || 'marla';
        const factors = { marla: 225, sqft: 1, sqyd: 9, sqm: 10.76391, kanal: 4500 };
        const sqft = val * (factors[unit] || 225);
        const set = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
        set('res-marla', `${(sqft / 225).toFixed(2)} Marla`);
        set('res-sqft', `${Math.round(sqft).toLocaleString()} Sq. Ft.`);
        set('res-sqyd', `${Math.round(sqft / 9).toLocaleString()} Sq. Yd.`);
        set('res-sqm', `${(sqft / 10.76391).toFixed(2)} Sq. M.`);
        set('res-kanal', `${(sqft / 4500).toFixed(2)} Kanal`);
    },

    hydrateSiteSettings: async function () {
        try {
            if (!window.KaghanDB || !window.KaghanDB.getSiteSettings) return;
            const [settings, projects] = await Promise.all([
                window.KaghanDB.getSiteSettings(),
                window.KaghanDB.getProjects ? window.KaghanDB.getProjects(true) : Promise.resolve([])
            ]);
            this.siteSettings = settings || {};

            if (settings.siteName) {
                document.querySelectorAll('.shared-site-name').forEach(el => { el.innerText = settings.siteName; });
            }
            if (settings.tagline) {
                document.querySelectorAll('.shared-site-subtitle').forEach(el => { el.innerText = settings.tagline; });
            }
            if (settings.headerBadge) {
                document.querySelectorAll('.shared-header-badge').forEach(el => { el.innerText = settings.headerBadge; });
            }
            if (settings.footerBio) {
                document.querySelectorAll('.shared-footer-bio').forEach(el => { el.innerText = settings.footerBio; });
            } else if (settings.seoDefaults && settings.seoDefaults.defaultMetaDescription) {
                document.querySelectorAll('.shared-footer-bio').forEach(el => { el.innerText = settings.seoDefaults.defaultMetaDescription; });
            }
            if (settings.logoUrl) {
                document.querySelectorAll('.shared-logo-img').forEach(el => { el.src = settings.logoUrl; });
            }

            if (settings.contact && settings.contact.phone) {
                const phone = settings.contact.phone;
                const cleanPhone = phone.replace(/[^0-9+]/g, '');
                const waNum = cleanPhone.replace(/[^0-9]/g, '');
                const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(`Hi ${settings.siteName || ''}, I am inquiring about your listings.`)}`;

                document.querySelectorAll('.shared-phone-link').forEach(el => { el.href = `tel:${cleanPhone}`; });
                document.querySelectorAll('.shared-phone-text').forEach(el => { el.innerText = phone; });
                document.querySelectorAll('.shared-wa-link, #global-floating-whatsapp').forEach(el => { el.href = waUrl; });
            }

            if (settings.contact && settings.contact.email) {
                document.querySelectorAll('.shared-email-link').forEach(el => { el.href = `mailto:${settings.contact.email}`; });
                document.querySelectorAll('.shared-email-text').forEach(el => { el.innerText = settings.contact.email; });
            }

            if (settings.contact && settings.contact.address) {
                document.querySelectorAll('.shared-address-text').forEach(el => { el.innerText = settings.contact.address; });
            }

            // Populate Footer live Projects links from Firestore
            const footerProjList = document.getElementById('shared-footer-projects');
            if (footerProjList && Array.isArray(projects) && projects.length > 0) {
                const projItems = projects.slice(0, 4).map(pr =>
                    `<li><a href="project-detail.html?slug=${encodeURIComponent(pr.slug || pr.id)}" class="hover:text-emerald-400 transition-colors flex items-center gap-2"><i class="fa-solid fa-city text-[10px] text-emerald-500"></i> ${pr.name}</a></li>`
                ).join('');
                footerProjList.innerHTML = projItems +
                    `<li><button type="button" onclick="window.KaghanSharedUI.openAreaUnitModal()" class="hover:text-emerald-400 transition-colors flex items-center gap-2"><i class="fa-solid fa-calculator text-[10px] text-amber-400"></i> Area Unit Converter</button></li>`;
            }

            window.dispatchEvent(new CustomEvent('kaghanSettingsHydrated', { detail: this.siteSettings }));
        } catch (e) {
            console.warn('Error hydrating shared site settings from Firestore:', e);
        }
    }
};

// Under-Construction / Maintenance Mode (Driven strictly by Firestore siteSettings.underConstruction)
window.KaghanMaintenance = {
    isExemptPage: function () {
        const path = window.location.pathname.toLowerCase();
        return path.includes('/admin/') || path.includes('admin/index.html') || path.includes('populate-firestore.html');
    },
    init: async function () {
        if (this.isExemptPage() || !window.KaghanDB || !window.KaghanDB.getSiteSettings) return;
        const settings = await window.KaghanDB.getSiteSettings();
        this.evaluate(settings);
        window.addEventListener('siteSettingsUpdated', (e) => { if (e.detail) this.evaluate(e.detail); });
    },
    evaluate: function (settings) {
        if (this.isExemptPage()) return;
        const maint = settings && settings.underConstruction;
        const existing = document.getElementById('kaghan-under-construction-overlay');
        if (!maint || !maint.enabled) {
            if (existing) existing.remove();
            document.body.style.overflow = '';
            return;
        }
        const user = window.KaghanDB && window.KaghanDB.getCurrentUser ? window.KaghanDB.getCurrentUser() : null;
        const key = localStorage.getItem('kaghan_maintenance_bypass') || '';
        const check = window.KaghanDB.canUserBypassMaintenance(settings, user, key);
        if (check.allowed) {
            if (existing) existing.remove();
            document.body.style.overflow = '';
            return;
        }
        document.body.style.overflow = 'hidden';
        let overlay = existing;
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'kaghan-under-construction-overlay';
            overlay.className = 'fixed inset-0 z-[999999] bg-slate-950 text-white flex items-center justify-center p-6 text-center';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = `
            <div class="max-w-lg space-y-4">
                <span class="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase">${maint.noticeBadge || 'Maintenance'}</span>
                <h1 class="text-3xl font-extrabold outfit text-white">${maint.headline || 'Site Under Maintenance'}</h1>
                <p class="text-sm text-slate-300">${maint.subheadline || ''}</p>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.KaghanSharedUI.init();
    if ('serviceWorker' in navigator && !window.location.pathname.toLowerCase().includes('/admin')) {
        navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    }
});
