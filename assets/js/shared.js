// Kaghan Properties - Shared Header, Footer & Global Navigation UI Component Engine
// Implements §2, §3, §7, §8, §10 specifications: Two-tier header, 5-column footer,
// currency switcher, area-unit switcher, modals, and sticky elements.

window.KaghanSharedUI = {
    // Current Global Market State
    currency: localStorage.getItem('kaghan_currency') || 'PKR',
    areaUnit: localStorage.getItem('kaghan_area_unit') || 'marla',
    language: localStorage.getItem('kaghan_lang') || 'EN',

    init: function() {
        if (window.KaghanMaintenance) window.KaghanMaintenance.init();
        this.renderHeader();
        this.renderFooter();
        this.renderModals();
        this.renderFloatingWhatsApp();
        this.initScrollHandlers();
        this.hydrateSiteSettings();
        this.initLeadPopupTimer();
    },

    getActivePage: function() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('projects.html') || path.includes('/projects')) return 'projects';
        if (path.includes('property.html') || path.includes('/property')) return 'property-detail';
        if (path.includes('societies.html') || path.includes('/societies')) return 'societies';
        if (path.includes('area.html') || path.includes('/area')) return 'area';
        if (path.includes('calculator.html') || path.includes('/calculator')) return 'calculator';
        if (path.includes('compare.html') || path.includes('/compare')) return 'compare';
        if (path.includes('agents.html') || path.includes('/agents')) return 'agents';
        if (path.includes('blog.html') || path.includes('/blog')) return 'blog';
        if (path.includes('faqs.html') || path.includes('/faqs')) return 'faqs';
        if (path.includes('contact.html') || path.includes('/contact')) return 'contact';
        if (path.includes('about.html') || path.includes('/about')) return 'about';
        return 'home';
    },

    // Format price using current selected currency
    formatPrice: function(priceInPKR) {
        if (!priceInPKR || isNaN(priceInPKR)) return 'Call for Price';
        const cur = this.currency.toUpperCase();
        
        // Conversion Rates
        const rates = { PKR: 1, USD: 1 / 278, AED: 1 / 75.8 };
        const converted = priceInPKR * (rates[cur] || 1);

        if (cur === 'PKR') {
            if (converted >= 10000000) {
                const crore = (converted / 10000000).toFixed(2).replace(/\.00$/, '');
                return `PKR ${crore} Crore`;
            } else if (converted >= 100000) {
                const lakh = (converted / 100000).toFixed(2).replace(/\.00$/, '');
                return `PKR ${lakh} Lakh`;
            } else {
                return `PKR ${Math.round(converted).toLocaleString()}`;
            }
        } else if (cur === 'USD') {
            return `$${Math.round(converted).toLocaleString()}`;
        } else if (cur === 'AED') {
            return `AED ${Math.round(converted).toLocaleString()}`;
        }
        return `PKR ${Math.round(converted).toLocaleString()}`;
    },

    // Convert area using current selected unit
    formatArea: function(marlaSize) {
        if (!marlaSize) return '';
        const unit = (this.areaUnit || 'marla').toLowerCase();
        if (unit === 'sqft') {
            return `${Math.round(marlaSize * 225).toLocaleString()} Sq. Ft.`;
        } else if (unit === 'sqyd') {
            return `${Math.round(marlaSize * 25).toLocaleString()} Sq. Yd.`;
        } else if (unit === 'sqm') {
            const sqm = (marlaSize * 20.903).toFixed(1).replace(/\.0$/, '');
            return `${sqm} Sq. M.`;
        } else if (unit === 'kanal') {
            const k = (marlaSize / 20).toFixed(2).replace(/\.00$/, '');
            return `${k} Kanal`;
        }
        return `${marlaSize} Marla`;
    },

    setCurrency: function(cur) {
        this.currency = cur;
        localStorage.setItem('kaghan_currency', cur);
        window.dispatchEvent(new CustomEvent('marketStateChanged', { detail: { currency: cur, areaUnit: this.areaUnit } }));
    },

    setAreaUnit: function(unit) {
        this.areaUnit = unit;
        localStorage.setItem('kaghan_area_unit', unit);
        window.dispatchEvent(new CustomEvent('marketStateChanged', { detail: { currency: this.currency, areaUnit: unit } }));
    },

    toggleLanguage: function() {
        this.language = this.language === 'EN' ? 'UR' : 'EN';
        localStorage.setItem('kaghan_lang', this.language);
        const el = document.getElementById('lang-indicator');
        if (el) el.innerText = this.language;
    },

    renderHeader: function() {
        const active = this.getActivePage();
        const headerContainer = document.getElementById('site-header') || document.querySelector('nav');
        if (!headerContainer) return;

        const isHome = active === 'home';
        const isListing = active === 'projects';

        const navHtml = `
            <!-- Primary Sticky Header Container -->
            <header id="main-site-header" class="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all duration-300 shadow-xs">
                <!-- Tier 1: Utility Bar (Logo, Nav, Tools & Switchers) -->
                <div class="border-b border-slate-100 py-2 sm:py-2.5">
                    <div class="market-container flex justify-between items-center text-xs">
                        
                        <!-- Left: Logo & Primary Navigation Links -->
                        <div class="flex items-center gap-3 sm:gap-6 lg:gap-8">
                            <!-- Logo -->
                            <a href="index.html" class="flex items-center gap-2 sm:gap-2.5 group shrink-0">
                                <img src="assets/images/logo.png" alt="Kaghan Properties Logo" class="h-7 sm:h-8 w-auto object-contain" onerror="this.src='stay/assets/images/logo.png'">
                                <div class="flex flex-col">
                                    <span class="text-sm sm:text-base font-extrabold tracking-tight uppercase outfit text-slate-900 leading-none group-hover:text-emerald-700 transition-colors">Kaghan</span>
                                    <span class="text-[7px] sm:text-[8px] text-amber-600 tracking-[0.24em] uppercase font-bold">Properties</span>
                                </div>
                            </a>

                            <!-- Primary Links (Desktop 1024px+) -->
                            <nav class="hidden lg:flex items-center gap-6 font-bold text-slate-700">
                                <a href="projects.html" class="${active === 'projects' ? 'text-emerald-700 font-extrabold' : 'hover:text-emerald-700 hover:-translate-y-0.5'} transition-all font-bold">Properties</a>
                                <a href="projects.html?type=blocks" class="hover:text-emerald-700 hover:-translate-y-0.5 transition-all inline-flex items-center gap-1 font-bold">
                                    Property Blocks
                                    <span class="badge-premium-new text-[8px] px-1.5 py-0.2 rounded-full font-extrabold">New</span>
                                </a>
                                <a href="area.html" class="${active === 'area' ? 'text-emerald-700 font-extrabold' : 'hover:text-emerald-700 hover:-translate-y-0.5'} transition-all font-bold">Area Guides</a>
                                <a href="blog.html" class="${active === 'blog' ? 'text-emerald-700 font-extrabold' : 'hover:text-emerald-700 hover:-translate-y-0.5'} transition-all font-bold">Blog</a>
                                <a href="societies.html" class="${active === 'societies' ? 'text-emerald-700 font-extrabold' : 'hover:text-emerald-700 hover:-translate-y-0.5'} transition-all font-bold">Maps</a>

                                <!-- Tools Dropdown -->
                                <div class="relative group py-1">
                                    <button class="flex items-center gap-1 hover:text-emerald-700 transition-all focus:outline-none font-bold cursor-pointer">
                                        Tools <i class="fa-solid fa-chevron-down text-[9px] text-slate-400 group-hover:rotate-180 transition-transform"></i>
                                    </button>
                                    <div class="absolute left-0 top-full hidden group-hover:block w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
                                        <a href="projects.html?tool=plot-finder" class="flex items-center gap-2.5 px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors">
                                            <i class="fa-solid fa-map-location-dot text-emerald-600 w-4"></i> Plot Finder
                                        </a>
                                        <a href="calculator.html" class="flex items-center gap-2.5 px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors">
                                            <i class="fa-solid fa-calculator text-emerald-600 w-4"></i> Home Loan Calculator
                                        </a>
                                        <button onclick="window.KaghanSharedUI.openAreaUnitModal()" class="w-full text-left flex items-center gap-2.5 px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors">
                                            <i class="fa-solid fa-ruler-combined text-emerald-600 w-4"></i> Area Unit Converter
                                        </button>
                                        <a href="societies.html#land-records" class="flex items-center gap-2.5 px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors">
                                            <i class="fa-solid fa-file-shield text-emerald-600 w-4"></i> Land Records
                                        </a>
                                        <a href="calculator.html#construction" class="flex items-center gap-2.5 px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors">
                                            <i class="fa-solid fa-trowel-bricks text-emerald-600 w-4"></i> Construction Cost Calculator
                                        </a>
                                    </div>
                                </div>

                                <!-- More Dropdown -->
                                <div class="relative group py-1">
                                    <button class="flex items-center gap-1 hover:text-emerald-700 transition-all focus:outline-none font-bold cursor-pointer">
                                        More <i class="fa-solid fa-chevron-down text-[9px] text-slate-400 group-hover:rotate-180 transition-transform"></i>
                                    </button>
                                    <div class="absolute left-0 top-full hidden group-hover:block w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
                                        <a href="index.html#forums" class="flex items-center gap-2 px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors">
                                            <i class="fa-solid fa-comments text-slate-400"></i> Forum
                                        </a>
                                        <a href="projects.html?tab=index" class="flex items-center gap-2 px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors">
                                            <i class="fa-solid fa-arrow-trend-up text-slate-400"></i> Price Index
                                        </a>
                                        <a href="projects.html?tab=trends" class="flex items-center gap-2 px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors">
                                            <i class="fa-solid fa-chart-line text-slate-400"></i> Trends
                                        </a>
                                    </div>
                                </div>
                            </nav>
                        </div>

                        <!-- Right: Action CTA & Switchers -->
                        <div class="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3.5">
                            <!-- Currency Toggle -->
                            <div class="flex items-center gap-1 bg-slate-100 px-1.5 sm:px-2 py-1 rounded-lg border border-slate-200">
                                <i class="fa-solid fa-coins text-slate-400 text-[9px] sm:text-[10px]"></i>
                                <select id="header-currency-select" onchange="window.KaghanSharedUI.setCurrency(this.value)" class="bg-transparent text-slate-800 font-bold text-[10px] sm:text-[11px] focus:outline-none cursor-pointer">
                                    <option value="PKR" ${this.currency === 'PKR' ? 'selected' : ''}>PKR</option>
                                    <option value="USD" ${this.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                                    <option value="AED" ${this.currency === 'AED' ? 'selected' : ''}>AED</option>
                                </select>
                            </div>

                            <!-- Area-Unit Toggle (Hidden on small mobile, visible in drawer & sm+) -->
                            <div class="hidden sm:flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                <i class="fa-solid fa-vector-square text-slate-400 text-[10px]"></i>
                                <select id="header-unit-select" onchange="window.KaghanSharedUI.setAreaUnit(this.value)" class="bg-transparent text-slate-800 font-medium text-[11px] focus:outline-none cursor-pointer">
                                    <option value="marla" ${this.areaUnit === 'marla' ? 'selected' : ''}>Marla</option>
                                    <option value="sqft" ${this.areaUnit === 'sqft' ? 'selected' : ''}>Square Feet</option>
                                    <option value="sqyd" ${this.areaUnit === 'sqyd' ? 'selected' : ''}>Square Yards</option>
                                    <option value="sqm" ${this.areaUnit === 'sqm' ? 'selected' : ''}>Square Meters</option>
                                    <option value="kanal" ${this.areaUnit === 'kanal' ? 'selected' : ''}>Kanal</option>
                                </select>
                            </div>

                            <!-- Language Toggle (Hidden on extra small mobile) -->
                            <button onclick="window.KaghanSharedUI.toggleLanguage()" title="Switch Language" class="hidden xs:flex p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors items-center gap-1">
                                <i class="fa-solid fa-globe text-xs"></i>
                                <span id="lang-indicator" class="font-bold text-[10px]">${this.language}</span>
                            </button>

                            <!-- Primary CTA Button ("Contact Desk" -> icon on small phone, full button on sm+) -->
                            <a href="contact.html" class="btn-primary text-xs py-1.5 px-2.5 sm:px-3.5 rounded-full font-bold shadow-xs whitespace-nowrap flex items-center gap-1 sm:gap-1.5">
                                <i class="fa-solid fa-headset text-[10px]"></i>
                                <span class="hidden sm:inline">Contact Desk</span>
                            </a>

                            <!-- Mobile Menu Trigger Button -->
                            <button onclick="window.KaghanSharedUI.toggleMobileMenu()" aria-label="Open Navigation Menu" class="lg:hidden p-1.5 text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-lg focus:outline-none transition-colors">
                                <i class="fa-solid fa-bars text-base sm:text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tier 2: Transaction Sub-Nav (Buy/Rent, Homes, Plots, Commercial, Agents, Projects) -->
                <div class="py-2 sm:py-2.5 bg-slate-50/90 border-b border-slate-100 hidden sm:block">
                    <div class="market-container flex justify-between items-center text-xs">
                        
                        <!-- Left: Purpose Toggle & Category Links -->
                        <div class="flex items-center gap-4 lg:gap-6 overflow-x-auto pb-0.5 scrollbar-none">
                            <!-- Purpose Toggle Segmented Control -->
                            <div class="segmented-control shrink-0">
                                <a href="projects.html?purpose=sale" id="tier2-buy" class="${window.location.search.includes('purpose=rent') ? '' : 'active'}">Buy</a>
                                <a href="projects.html?purpose=rent" id="tier2-rent" class="${window.location.search.includes('purpose=rent') ? 'active' : ''}">Rent</a>
                            </div>

                            <!-- Category Links -->
                            <div class="flex items-center gap-4 lg:gap-5 font-bold text-slate-700 shrink-0">
                                <a href="projects.html?type=house" class="hover:text-emerald-700 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 font-bold cursor-pointer">
                                    <i class="fa-solid fa-house-chimney text-slate-400"></i> Homes
                                </a>
                                <a href="projects.html?type=plot" class="hover:text-emerald-700 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 font-bold cursor-pointer">
                                    <i class="fa-solid fa-border-all text-slate-400"></i> Plots
                                </a>
                                <a href="projects.html?type=commercial" class="hover:text-emerald-700 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 font-bold cursor-pointer">
                                    <i class="fa-solid fa-building text-slate-400"></i> Commercial
                                </a>
                            </div>
                        </div>

                        <!-- Right: Agents & New Projects -->
                        <div class="hidden md:flex items-center gap-5 font-bold text-slate-700 shrink-0">
                            <a href="agents.html" class="${active === 'agents' ? 'text-emerald-700 font-extrabold' : 'hover:text-emerald-700 hover:-translate-y-0.5'} transition-all flex items-center gap-1.5 font-bold cursor-pointer">
                                <i class="fa-solid fa-user-tie text-slate-400"></i> Real Estate Agents
                            </a>
                            <a href="projects.html?isNewProject=true" class="hover:text-emerald-700 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 font-extrabold text-emerald-800 cursor-pointer">
                                <i class="fa-solid fa-city text-emerald-600"></i> New Projects
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Mobile Navigation Off-Canvas Drawer -->
            <div id="mobile-menu-drawer" onclick="if(event.target === this) window.KaghanSharedUI.toggleMobileMenu()" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[70] hidden flex flex-col justify-end transition-all">
                <div class="bg-white rounded-t-3xl max-h-[88vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl">
                    <!-- Drawer Header -->
                    <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div class="flex items-center gap-2">
                            <img src="assets/images/logo.png" class="h-8 w-auto">
                            <span class="font-bold outfit text-base text-slate-900">Kaghan Properties</span>
                        </div>
                        <button onclick="window.KaghanSharedUI.toggleMobileMenu()" aria-label="Close menu" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors">
                            <i class="fa-solid fa-xmark text-sm"></i>
                        </button>
                    </div>

                    <!-- Purpose Selector Mobile -->
                    <div class="flex bg-slate-100 p-1 rounded-xl text-center text-xs font-bold">
                        <a href="projects.html?purpose=sale" class="flex-1 py-2 rounded-lg bg-white shadow-xs text-emerald-800 font-extrabold">Buy Property</a>
                        <a href="projects.html?purpose=rent" class="flex-1 py-2 rounded-lg text-slate-600 hover:text-emerald-700">Rent Property</a>
                    </div>

                    <!-- Mobile Unit & Currency Controls -->
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1">
                            <label class="text-[10px] font-bold uppercase text-slate-400 block">Currency</label>
                            <select onchange="window.KaghanSharedUI.setCurrency(this.value); document.getElementById('header-currency-select').value=this.value;" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold text-slate-800 text-xs focus:outline-none">
                                <option value="PKR" ${this.currency === 'PKR' ? 'selected' : ''}>PKR (Pakistani Rupee)</option>
                                <option value="USD" ${this.currency === 'USD' ? 'selected' : ''}>USD ($ US Dollar)</option>
                                <option value="AED" ${this.currency === 'AED' ? 'selected' : ''}>AED (UAE Dirham)</option>
                            </select>
                        </div>
                        <div class="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1">
                            <label class="text-[10px] font-bold uppercase text-slate-400 block">Area Unit</label>
                            <select onchange="window.KaghanSharedUI.setAreaUnit(this.value); const el=document.getElementById('header-unit-select'); if(el) el.value=this.value;" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold text-slate-800 text-xs focus:outline-none">
                                <option value="marla" ${this.areaUnit === 'marla' ? 'selected' : ''}>Marla</option>
                                <option value="sqft" ${this.areaUnit === 'sqft' ? 'selected' : ''}>Square Feet</option>
                                <option value="sqyd" ${this.areaUnit === 'sqyd' ? 'selected' : ''}>Square Yards</option>
                                <option value="sqm" ${this.areaUnit === 'sqm' ? 'selected' : ''}>Square Meters</option>
                                <option value="kanal" ${this.areaUnit === 'kanal' ? 'selected' : ''}>Kanal</option>
                            </select>
                        </div>
                    </div>

                    <!-- Navigation Links Mobile -->
                    <div class="space-y-1 text-sm font-semibold text-slate-700 divide-y divide-slate-100">
                        <a href="index.html" class="flex items-center justify-between py-2.5 hover:text-emerald-700">
                            <span class="flex items-center gap-2.5"><i class="fa-solid fa-house text-slate-400 w-4 text-center"></i> Home</span>
                            <i class="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                        </a>
                        <a href="projects.html" class="flex items-center justify-between py-2.5 hover:text-emerald-700">
                            <span class="flex items-center gap-2.5"><i class="fa-solid fa-building text-slate-400 w-4 text-center"></i> Properties Catalog</span>
                            <i class="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                        </a>
                        <a href="projects.html?isNewProject=true" class="flex items-center justify-between py-2.5 text-emerald-700 font-bold">
                            <span class="flex items-center gap-2.5"><i class="fa-solid fa-city text-emerald-600 w-4 text-center"></i> New Projects & Blocks</span>
                            <span class="badge-premium-new text-[8px] px-2 py-0.5">Hot</span>
                        </a>
                        <a href="area.html" class="flex items-center justify-between py-2.5 hover:text-emerald-700">
                            <span class="flex items-center gap-2.5"><i class="fa-solid fa-map-location-dot text-slate-400 w-4 text-center"></i> Area Guides & Societies</span>
                            <i class="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                        </a>
                        <a href="societies.html" class="flex items-center justify-between py-2.5 hover:text-emerald-700">
                            <span class="flex items-center gap-2.5"><i class="fa-solid fa-map text-slate-400 w-4 text-center"></i> Society Maps</span>
                            <i class="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                        </a>
                        <a href="calculator.html" class="flex items-center justify-between py-2.5 hover:text-emerald-700">
                            <span class="flex items-center gap-2.5"><i class="fa-solid fa-calculator text-slate-400 w-4 text-center"></i> ROI & Mortgage Calculators</span>
                            <i class="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                        </a>
                        <a href="compare.html" class="flex items-center justify-between py-2.5 hover:text-emerald-700">
                            <span class="flex items-center gap-2.5"><i class="fa-solid fa-code-compare text-slate-400 w-4 text-center"></i> Compare Properties</span>
                            <i class="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                        </a>
                        <a href="agents.html" class="flex items-center justify-between py-2.5 hover:text-emerald-700">
                            <span class="flex items-center gap-2.5"><i class="fa-solid fa-user-tie text-slate-400 w-4 text-center"></i> Certified Real Estate Agents</span>
                            <i class="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                        </a>
                        <a href="blog.html" class="flex items-center justify-between py-2.5 hover:text-emerald-700">
                            <span class="flex items-center gap-2.5"><i class="fa-solid fa-newspaper text-slate-400 w-4 text-center"></i> Market Insights & Blog</span>
                            <i class="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                        </a>
                        <a href="about.html" class="flex items-center justify-between py-2.5 hover:text-emerald-700">
                            <span class="flex items-center gap-2.5"><i class="fa-solid fa-circle-info text-slate-400 w-4 text-center"></i> About Kaghan Properties</span>
                            <i class="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                        </a>
                        <a href="services.html" class="flex items-center justify-between py-2.5 hover:text-emerald-700">
                            <span class="flex items-center gap-2.5"><i class="fa-solid fa-handshake-angle text-slate-400 w-4 text-center"></i> Corporate Services</span>
                            <i class="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                        </a>
                        <a href="faqs.html" class="flex items-center justify-between py-2.5 hover:text-emerald-700">
                            <span class="flex items-center gap-2.5"><i class="fa-solid fa-circle-question text-slate-400 w-4 text-center"></i> Help & FAQs</span>
                            <i class="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                        </a>
                    </div>

                    <!-- Mobile CTA Buttons -->
                    <div class="pt-3 border-t border-slate-100 space-y-2.5 pb-2">
                        <a href="contact.html" class="w-full btn-primary py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2">
                            <i class="fa-solid fa-headset"></i> Contact Real Estate Desk
                        </a>
                        <a href="https://wa.me/923340091127" target="_blank" class="w-full btn-whatsapp py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                            <i class="fa-brands fa-whatsapp text-base"></i> WhatsApp Support
                        </a>
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

    toggleMobileMenu: function() {
        const drawer = document.getElementById('mobile-menu-drawer');
        if (drawer) {
            drawer.classList.toggle('hidden');
            if (!drawer.classList.contains('hidden')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }
    },

    // Shared 5-Column Marketplace Footer (§7)
    renderFooter: function() {
        const footerContainer = document.getElementById('site-footer') || document.querySelector('footer');
        if (!footerContainer) return;

        const footerHtml = `
            <footer class="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 relative z-10 pt-16 pb-8">
                <div class="market-container space-y-12">
                    
                    <!-- 5-Column Grid Layout -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
                        
                        <!-- Col 1: Company -->
                        <div class="space-y-3">
                            <h4 class="text-white font-bold outfit uppercase text-sm tracking-wider border-b border-slate-800 pb-2">Company</h4>
                            <ul class="space-y-2 font-medium">
                                <li><a href="about.html" class="hover:text-emerald-400 transition-colors">About Us</a></li>
                                <li><a href="contact.html" class="hover:text-emerald-400 transition-colors">Contact Us</a></li>
                                <li><a href="about.html#careers" class="hover:text-emerald-400 transition-colors">Careers & Jobs</a></li>
                                <li><a href="faqs.html" class="hover:text-emerald-400 transition-colors">Help & Support</a></li>
                                <li><a href="contact.html?type=advertise" class="hover:text-emerald-400 transition-colors">Advertise with Us</a></li>
                                <li><a href="faqs.html#terms" class="hover:text-emerald-400 transition-colors">Terms of Use & Privacy</a></li>
                            </ul>
                        </div>

                        <!-- Col 2: Connect -->
                        <div class="space-y-3">
                            <h4 class="text-white font-bold outfit uppercase text-sm tracking-wider border-b border-slate-800 pb-2">Connect</h4>
                            <ul class="space-y-2 font-medium">
                                <li><a href="blog.html" class="hover:text-emerald-400 transition-colors">Market Blog</a></li>
                                <li><a href="blog.html?cat=news" class="hover:text-emerald-400 transition-colors">Real Estate News</a></li>
                                <li><a href="index.html#forums" class="hover:text-emerald-400 transition-colors">Property Forum</a></li>
                                <li><a href="projects.html?tag=expo" class="hover:text-emerald-400 transition-colors">Property Expo 2026</a></li>
                                <li><a href="agents.html" class="hover:text-emerald-400 transition-colors">Real Estate Agents</a></li>
                                <li><a href="contact.html" class="hover:text-emerald-400 text-left transition-colors">Partner with Us</a></li>
                            </ul>
                        </div>

                        <!-- Col 3: Head Office -->
                        <div class="space-y-3">
                            <h4 class="text-white font-bold outfit uppercase text-sm tracking-wider border-b border-slate-800 pb-2">Head Office</h4>
                            <div class="space-y-2 leading-relaxed text-slate-300">
                                <p class="flex items-start gap-2">
                                    <i class="fa-solid fa-location-dot text-emerald-400 mt-1"></i>
                                    <span class="shared-address-text">Office 203, 2nd Floor, Asian Arcade, opposite Zoo, C Avenue, Sector C, Bahria Enclave, Islamabad, Pakistan</span>
                                </p>
                                <p class="flex items-center gap-2">
                                    <i class="fa-solid fa-phone text-emerald-400"></i>
                                    <a href="tel:+923340091127" class="shared-phone-link hover:text-white font-semibold tabular-nums">+92 334 0091127</a>
                                </p>
                                <p class="flex items-center gap-2 text-[11px] text-slate-400">
                                    <i class="fa-regular fa-clock text-slate-500"></i>
                                    <span>Mon - Sat: 9:00 AM – 8:00 PM</span>
                                </p>
                                <p class="pt-1">
                                    <a href="mailto:info@kaghanproperties.com" class="shared-email-link text-emerald-400 hover:underline flex items-center gap-1.5 font-semibold">
                                        <i class="fa-regular fa-envelope"></i> Email Us
                                    </a>
                                </p>
                            </div>
                        </div>

                        <!-- Col 4: Roshan Digital Account Promo -->
                        <div class="space-y-3">
                            <h4 class="text-white font-bold outfit uppercase text-sm tracking-wider border-b border-slate-800 pb-2">Overseas Services</h4>
                            <div class="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl space-y-2.5">
                                <div class="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
                                    <i class="fa-solid fa-earth-americas text-emerald-400"></i> Roshan Digital
                                </div>
                                <a href="calculator.html?ref=rda" class="font-bold text-white block hover:text-emerald-400 transition-colors">
                                    Roshan Digital Account Property Investments
                                </a>
                                <p class="text-[11px] text-slate-400">Dedicated facilitation desk for non-resident Pakistanis buying plots, turnkey villas, and apartments.</p>
                            </div>
                        </div>

                        <!-- Col 5: Get Connected & Newsletter -->
                        <div class="space-y-3">
                            <h4 class="text-white font-bold outfit uppercase text-sm tracking-wider border-b border-slate-800 pb-2">Get Connected</h4>
                            <div class="flex gap-2 text-slate-300">
                                <a href="https://facebook.com" target="_blank" class="shared-social-fb w-8 h-8 rounded-full bg-slate-800 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors"><i class="fa-brands fa-facebook-f"></i></a>
                                <a href="https://instagram.com" target="_blank" class="shared-social-ig w-8 h-8 rounded-full bg-slate-800 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors"><i class="fa-brands fa-instagram"></i></a>
                                <a href="https://youtube.com" target="_blank" class="shared-social-yt w-8 h-8 rounded-full bg-slate-800 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors"><i class="fa-brands fa-youtube"></i></a>
                                <a href="https://twitter.com" target="_blank" class="shared-social-tw w-8 h-8 rounded-full bg-slate-800 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors"><i class="fa-brands fa-x-twitter"></i></a>
                                <a href="https://linkedin.com" target="_blank" class="shared-social-li w-8 h-8 rounded-full bg-slate-800 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors"><i class="fa-brands fa-linkedin-in"></i></a>
                            </div>

                            <div class="pt-2">
                                <p class="text-[11px] text-slate-400 mb-2">Subscribe to weekly market rate alerts:</p>
                                <form onsubmit="window.KaghanSharedUI.handleNewsletter(event)" class="space-y-1.5">
                                    <input type="email" id="footer-newsletter-input" placeholder="Your email address" required class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500">
                                    <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-lg text-xs transition-colors">
                                        Subscribe
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- Bottom Bar with Copyright -->
                    <div class="pt-8 border-t border-slate-800/80 text-center text-slate-500 text-[11px]">
                        <p>&copy; 2026 Kaghan Properties (Pvt) Ltd. All rights reserved. Transforming real estate discovery across Pakistan.</p>
                    </div>
                </div>
            </footer>

            <!-- Back to Top Button -->
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

    initScrollHandlers: function() {
        window.addEventListener('scroll', () => {
            const btn = document.getElementById('back-to-top');
            if (btn) {
                if (window.scrollY > 350) {
                    btn.classList.add('visible');
                } else {
                    btn.classList.remove('visible');
                }
            }

            // Property detail sticky sub-bar
            const subbar = document.getElementById('property-sticky-subbar');
            if (subbar) {
                const galleryHero = document.getElementById('detail-gallery-hero');
                if (galleryHero) {
                    const rect = galleryHero.getBoundingClientRect();
                    if (rect.bottom < 80) {
                        subbar.classList.add('visible');
                    } else {
                        subbar.classList.remove('visible');
                    }
                }
            }
        });
    },

    renderFloatingWhatsApp: function() {
        if (document.getElementById('global-floating-whatsapp')) return;

        const a = document.createElement('a');
        a.id = 'global-floating-whatsapp';
        a.href = 'https://wa.me/923340091127?text=Hi%20Kaghan%20Properties,%20I%20am%20inquiring%20about%20your%20property%20marketplace%20listings.';
        a.target = '_blank';
        a.title = 'Chat on WhatsApp';
        a.className = 'fixed bottom-6 right-6 z-40 bg-[#25d366] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform border-2 border-white/20';
        a.innerHTML = '<i class="fa-brands fa-whatsapp text-3xl"></i>';
        document.body.appendChild(a);
    },

    // Render Global Modals (Area Unit Converter, Lightbox, DHA Ballot Launch Popup)
    renderModals: function() {
        if (document.getElementById('global-modals-root')) return;

        const div = document.createElement('div');
        div.id = 'global-modals-root';
        div.innerHTML = `
            <!-- Area Unit Converter Modal -->
            <div id="modal-unit-converter" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
                <div class="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-fade-in">
                    <button onclick="window.KaghanSharedUI.closeAreaUnitModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-800">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                    <div class="border-b border-slate-100 pb-2">
                        <h3 class="text-lg font-bold outfit text-slate-900">Area Unit Converter</h3>
                        <p class="text-xs text-slate-500">Convert Pakistani property units instantly.</p>
                    </div>
                    <div class="space-y-3 text-xs">
                        <div>
                            <label class="font-bold text-slate-700 block mb-1">Enter Area Value</label>
                            <input type="number" id="converter-input-val" value="5" oninput="window.KaghanSharedUI.recalcUnits()" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none">
                        </div>
                        <div>
                            <label class="font-bold text-slate-700 block mb-1">From Unit</label>
                            <select id="converter-from-unit" onchange="window.KaghanSharedUI.recalcUnits()" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none">
                                <option value="marla">Marla (1 Marla = 225 Sq Ft)</option>
                                <option value="sqft">Square Feet (Sq. Ft.)</option>
                                <option value="sqyd">Square Yards (Sq. Yd. / Gaz)</option>
                                <option value="sqm">Square Meters (Sq. M.)</option>
                                <option value="kanal">Kanal (1 Kanal = 20 Marla)</option>
                            </select>
                        </div>
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                            <div class="flex justify-between items-center text-xs font-semibold">
                                <span class="text-slate-500">Marla:</span>
                                <span id="res-marla" class="text-emerald-700 font-bold tabular-nums">5.00 Marla</span>
                            </div>
                            <div class="flex justify-between items-center text-xs font-semibold">
                                <span class="text-slate-500">Square Feet:</span>
                                <span id="res-sqft" class="text-emerald-700 font-bold tabular-nums">1,125 Sq. Ft.</span>
                            </div>
                            <div class="flex justify-between items-center text-xs font-semibold">
                                <span class="text-slate-500">Square Yards (Gaz):</span>
                                <span id="res-sqyd" class="text-emerald-700 font-bold tabular-nums">125 Sq. Yd.</span>
                            </div>
                            <div class="flex justify-between items-center text-xs font-semibold">
                                <span class="text-slate-500">Square Meters:</span>
                                <span id="res-sqm" class="text-emerald-700 font-bold tabular-nums">104.5 Sq. M.</span>
                            </div>
                            <div class="flex justify-between items-center text-xs font-semibold">
                                <span class="text-slate-500">Kanal:</span>
                                <span id="res-kanal" class="text-emerald-700 font-bold tabular-nums">0.25 Kanal</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Universal High-Converting DHA Margalla Ballot 1, 2 & 3 Launch Popup -->
            <div id="modal-dha-launch-popup" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 opacity-0 pointer-events-none invisible" onclick="if(event.target === this) window.KaghanSharedUI.closeLeadPopup()">
                <div class="kaghan-popup-card popup-glow-border bg-slate-900 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-amber-500/30 text-white relative">
                    
                    <!-- Header Banner with Gold Accents -->
                    <div class="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 p-5 sm:p-6 border-b border-emerald-800/40 relative">
                        <div class="flex items-center justify-between gap-3">
                            <div class="flex items-center gap-2.5">
                                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-sm shadow">
                                    <i class="fa-solid fa-crown"></i>
                                </div>
                                <div>
                                    <div class="text-[10px] tracking-widest font-extrabold uppercase text-amber-300 flex items-center gap-1.5">
                                        <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Official Allotment Live
                                    </div>
                                    <h3 class="text-base sm:text-lg font-black outfit text-white uppercase tracking-wide">
                                        DHA Margalla Enclave
                                    </h3>
                                </div>
                            </div>

                            <!-- Easy, Prominent Close Button -->
                            <button type="button" onclick="window.KaghanSharedUI.closeLeadPopup()" aria-label="Close popup" class="w-9 h-9 rounded-full bg-white/10 hover:bg-red-600/80 text-white flex items-center justify-center transition-all duration-200 hover:rotate-90 hover:scale-105 shadow-md">
                                <i class="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        <!-- Title & Pitch -->
                        <div class="mt-3">
                            <h2 class="text-lg sm:text-xl font-extrabold outfit text-white leading-snug">
                                Exclusive Ballot 1, Ballot 2 & Ballot 3 Launch
                            </h2>
                            <p class="text-xs text-slate-300 mt-1 leading-relaxed">
                                100% DHA Clear Title • 20% Down Payment within 30 Days • Flexible 1, 2 & 3-Year Quarterly Installments or Lump Sum Discount.
                            </p>
                        </div>
                    </div>

                    <!-- Scrollable Modal Body -->
                    <div class="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
                        
                        <!-- Quick Ballot Chips -->
                        <div>
                            <label class="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">Select Your Target Ballot Category:</label>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2" id="popup-ballot-chips">
                                <button type="button" onclick="window.KaghanSharedUI.selectPopupPlot('res', '125 Sq Yds Residential (5 Marla)')" class="popup-chip-btn active p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-left hover:border-emerald-400">
                                    <div class="font-bold text-white text-xs flex items-center gap-1">
                                        <i class="fa-solid fa-house text-amber-300 text-[11px]"></i> Ballot 1
                                    </div>
                                    <div class="text-[10px] text-slate-300 mt-0.5">Residential (5, 10M, 1K)</div>
                                </button>

                                <button type="button" onclick="window.KaghanSharedUI.selectPopupPlot('comm', '100 Sq Yds Commercial (4 Marla)')" class="popup-chip-btn p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-left hover:border-slate-500">
                                    <div class="font-bold text-white text-xs flex items-center gap-1">
                                        <i class="fa-solid fa-briefcase text-emerald-400 text-[11px]"></i> Ballot 2
                                    </div>
                                    <div class="text-[10px] text-slate-400 mt-0.5">Boulevard Comm. (4-20M)</div>
                                </button>

                                <button type="button" onclick="window.KaghanSharedUI.selectPopupPlot('ballot3', '133.33 Sq Yds Commercial LG+G+5 (Ballot 3)')" class="popup-chip-btn p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-left hover:border-slate-500">
                                    <div class="font-bold text-white text-xs flex items-center gap-1">
                                        <i class="fa-solid fa-building text-purple-400 text-[11px]"></i> Ballot 3
                                    </div>
                                    <div class="text-[10px] text-slate-400 mt-0.5">LG+G+5 High-Rise Comm.</div>
                                </button>
                            </div>
                        </div>

                        <!-- 1-Click WhatsApp Instant Connection -->
                        <div>
                            <a id="popup-wa-cta-btn" href="https://wa.me/923340091127?text=Hi%20Kaghan%20Properties,%20I%20am%20inquiring%20about%20DHA%20Margalla%20Enclave%20Ballot%201,%20Ballot%202%20and%20Ballot%203%20plots." target="_blank" class="w-full bg-[#25d366] hover:bg-[#1ebd5a] text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.01]">
                                <i class="fa-brands fa-whatsapp text-lg"></i>
                                <span>Instant WhatsApp Consultation & Rates</span>
                            </a>
                        </div>

                        <div class="flex items-center gap-3 my-1">
                            <div class="h-px bg-slate-700 flex-1"></div>
                            <span class="text-[10px] uppercase font-bold text-slate-400">or request priority callback</span>
                            <div class="h-px bg-slate-700 flex-1"></div>
                        </div>

                        <!-- Quick Lead Submission Form -->
                        <form onsubmit="window.KaghanSharedUI.submitPopupLead(event)" class="space-y-3">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Your Full Name</label>
                                    <input type="text" id="popup-lead-name" required placeholder="e.g. Tariq Mehmood" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500">
                                </div>
                                <div>
                                    <label class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Phone / WhatsApp</label>
                                    <input type="tel" id="popup-lead-phone" required placeholder="+92 334 0091127" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500">
                                </div>
                            </div>

                            <div>
                                <label class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Preferred Plot / Ballot</label>
                                <select id="popup-lead-plot-select" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500 font-medium">
                                    <optgroup label="Ballot 1 — Residential Plots">
                                        <option value="125 Sq Yds Residential (5 Marla)" selected>125 Sq Yds Residential (5 Marla) - From PKR 2.14 Cr</option>
                                        <option value="250 Sq Yds Residential (10 Marla)">250 Sq Yds Residential (10 Marla) - From PKR 4.20 Cr</option>
                                        <option value="500 Sq Yds Residential (1 Kanal)">500 Sq Yds Residential (1 Kanal) - From PKR 7.28 Cr</option>
                                    </optgroup>
                                    <optgroup label="Ballot 2 — Commercial Plots">
                                        <option value="100 Sq Yds Commercial (4 Marla)">100 Sq Yds Commercial (4 Marla) - From PKR 8.14 Cr</option>
                                        <option value="133.25 Sq Yds Commercial (5.33 Marla)">133.25 Sq Yds Commercial (5.33 Marla) - From PKR 12.00 Cr</option>
                                        <option value="200 Sq Yds Commercial (8 Marla)">200 Sq Yds Commercial (8 Marla) - From PKR 14.57 Cr</option>
                                        <option value="500 Sq Yds Commercial (20 Marla)">500 Sq Yds Commercial (20 Marla / 1 Kanal) - From PKR 34.29 Cr</option>
                                    </optgroup>
                                    <optgroup label="Ballot 3 — LG+G+5 Multi-Storey Commercial">
                                        <option value="133.33 Sq Yds Commercial LG+G+5 (Ballot 3)">133.33 Sq Yds Commercial (LG+G+5) - From PKR 13.58 Cr</option>
                                        <option value="200 Sq Yds Commercial LG+G+5 (Ballot 3)">200 Sq Yds Commercial (LG+G+5) - From PKR 19.65 Cr</option>
                                        <option value="266.66 Sq Yds Commercial LG+G+5 (Ballot 3)">266.66 Sq Yds Commercial (LG+G+5) - From PKR 20.15 Cr</option>
                                    </optgroup>
                                </select>
                            </div>

                            <div id="popup-lead-feedback" class="hidden p-3 rounded-xl text-center text-xs font-bold bg-emerald-900/60 border border-emerald-500 text-emerald-200"></div>

                            <button type="submit" id="popup-submit-btn" class="w-full btn-primary bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all">
                                <i class="fa-solid fa-file-invoice-dollar text-amber-300"></i>
                                <span>Get Official Payment Plan & Details</span>
                            </button>
                        </form>

                        <div class="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
                            <a href="project-detail.html?slug=dha-margalla-enclave-ballot-1-2" class="text-amber-400 hover:underline flex items-center gap-1 font-bold">
                                <span>View Complete Project Page</span> <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                            </a>
                            <button type="button" onclick="window.KaghanSharedUI.closeLeadPopup()" class="text-slate-400 hover:text-white underline">
                                Maybe later
                            </button>
                        </div>

                    </div>

                </div>
            </div>
        `;
        document.body.appendChild(div);

        // Global Escape Key Listener for Modals
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeLeadPopup();
                this.closeAreaUnitModal();
            }
        });
    },

    // Popup Lifecycle & Timer Management (Opens 3-5 seconds after page visit)
    initLeadPopupTimer: function() {
        const isDismissed = sessionStorage.getItem('kaghan_popup_dismissed');
        if (isDismissed) return;

        // Auto-trigger popup after 3.5 seconds
        setTimeout(() => {
            if (!sessionStorage.getItem('kaghan_popup_dismissed')) {
                this.openLeadPopup();
            }
        }, 3500);
    },

    openLeadPopup: function() {
        const popup = document.getElementById('modal-dha-launch-popup');
        if (popup) {
            popup.classList.remove('invisible', 'pointer-events-none');
            popup.classList.add('active');
        }
    },

    closeLeadPopup: function() {
        const popup = document.getElementById('modal-dha-launch-popup');
        if (popup) {
            popup.classList.remove('active');
            setTimeout(() => {
                popup.classList.add('invisible', 'pointer-events-none');
            }, 350);
            sessionStorage.setItem('kaghan_popup_dismissed', 'true');
        }
    },

    selectPopupPlot: function(category, defaultPlotVal) {
        const chips = document.querySelectorAll('#popup-ballot-chips .popup-chip-btn');
        chips.forEach(btn => btn.classList.remove('active'));
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }

        const select = document.getElementById('popup-lead-plot-select');
        if (select && defaultPlotVal) {
            select.value = defaultPlotVal;
        }

        const waBtn = document.getElementById('popup-wa-cta-btn');
        if (waBtn) {
            const encoded = encodeURIComponent(`Hi Kaghan Properties, I am interested in DHA Margalla Enclave (${defaultPlotVal}). Please share the official schedule and booking procedure.`);
            waBtn.href = `https://wa.me/923340091127?text=${encoded}`;
        }
    },

    submitPopupLead: async function(e) {
        e.preventDefault();
        const name = document.getElementById('popup-lead-name')?.value.trim();
        const phone = document.getElementById('popup-lead-phone')?.value.trim();
        const plot = document.getElementById('popup-lead-plot-select')?.value;
        const btn = document.getElementById('popup-submit-btn');
        const feedback = document.getElementById('popup-lead-feedback');

        if (!name || !phone) return;

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
        }

        try {
            const leadPayload = {
                name: name,
                phone: phone,
                email: '',
                unitPreference: plot,
                propertyTitle: `DHA Margalla Enclave (${plot})`,
                propertyId: 'prop-dha-margalla-enclave-ballots',
                message: `Lead from Universal Website Popup for DHA Margalla Enclave (${plot}).`,
                sourcePage: window.location.pathname || '/',
                createdAt: new Date().toISOString()
            };

            if (window.KaghanDB && window.KaghanDB.createLead) {
                await window.KaghanDB.createLead(leadPayload);
            }

            if (feedback) {
                feedback.innerHTML = '<i class="fa-solid fa-circle-check mr-1 text-emerald-400"></i> Request Received! Our DHA Margalla Consultant will call you shortly.';
                feedback.classList.remove('hidden');
            }

            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Request Submitted';
                btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
                btn.classList.add('bg-emerald-800');
            }

            // Close modal after 2.5 seconds
            setTimeout(() => {
                this.closeLeadPopup();
            }, 2500);

        } catch (err) {
            console.error('Error submitting popup lead:', err);
            if (feedback) {
                feedback.innerHTML = '<i class="fa-solid fa-circle-check mr-1 text-emerald-400"></i> Request Received! Connecting you with our DHA desk...';
                feedback.classList.remove('hidden');
            }
            setTimeout(() => {
                this.closeLeadPopup();
            }, 2500);
        }
    },

    openAreaUnitModal: function() {
        const m = document.getElementById('modal-unit-converter');
        if (m) {
            m.classList.remove('hidden');
            this.recalcUnits();
        }
    },

    closeAreaUnitModal: function() {
        const m = document.getElementById('modal-unit-converter');
        if (m) m.classList.add('hidden');
    },

    recalcUnits: function() {
        const val = parseFloat(document.getElementById('converter-input-val')?.value || 0);
        const from = (document.getElementById('converter-from-unit')?.value || 'marla').toLowerCase();
        if (isNaN(val)) return;

        // Convert to base: Square Feet
        let sqft = 0;
        if (from === 'marla') sqft = val * 225;
        else if (from === 'kanal') sqft = val * 20 * 225;
        else if (from === 'sqyd') sqft = val * 9;
        else if (from === 'sqm') sqft = val * 10.76391;
        else sqft = val;

        const marla = sqft / 225;
        const kanal = marla / 20;
        const sqyd = sqft / 9;
        const sqm = sqft / 10.76391;

        const rMarla = document.getElementById('res-marla');
        const rSqft = document.getElementById('res-sqft');
        const rSqyd = document.getElementById('res-sqyd');
        const rSqm = document.getElementById('res-sqm');
        const rKanal = document.getElementById('res-kanal');

        if (rMarla) rMarla.innerText = `${marla.toFixed(2)} Marla`;
        if (rSqft) rSqft.innerText = `${Math.round(sqft).toLocaleString()} Sq. Ft.`;
        if (rSqyd) rSqyd.innerText = `${Math.round(sqyd).toLocaleString()} Sq. Yd.`;
        if (rSqm) rSqm.innerText = `${sqm.toFixed(2)} Sq. M.`;
        if (rKanal) rKanal.innerText = `${kanal.toFixed(2)} Kanal`;
    },

    handleNewsletter: async function(e) {
        e.preventDefault();
        const input = document.getElementById('footer-newsletter-input');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (!input || !input.value) return;
        const email = input.value.trim();

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Subscribing...';
        }

        try {
            if (window.CorporateDB && window.CorporateDB.addSubscriber) {
                await window.CorporateDB.addSubscriber(email);
            } else if (window.KaghanDB && window.KaghanDB.createLead) {
                await window.KaghanDB.createLead({
                    name: 'Newsletter Subscriber',
                    email: email,
                    phone: '',
                    message: 'Subscribed to weekly market rate alerts and newsletter',
                    sourcePage: '/newsletter'
                });
            }
            alert('Thank you for subscribing to Kaghan Properties updates!');
            input.value = '';
        } catch (err) {
            console.error('Error adding subscriber to Firestore:', err);
            alert('Thank you! You have been added to our updates list.');
            input.value = '';
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Subscribe';
            }
        }
    },

    hydrateSiteSettings: async function() {
        try {
            if (!window.KaghanDB || !window.KaghanDB.getSiteSettings) return;
            const settings = await window.KaghanDB.getSiteSettings();
            if (!settings) return;

            // 1. Phone numbers & WhatsApp
            if (settings.contact && settings.contact.phone) {
                const phone = settings.contact.phone;
                const cleanPhone = phone.replace(/[^0-9+]/g, '');
                const waNum = cleanPhone.replace(/[^0-9]/g, '');

                document.querySelectorAll('.shared-phone-link').forEach(el => {
                    el.href = `tel:${cleanPhone}`;
                    el.innerText = phone;
                });

                document.querySelectorAll('.shared-wa-link, #global-floating-whatsapp').forEach(el => {
                    el.href = `https://wa.me/${waNum}?text=${encodeURIComponent('Hi Kaghan Properties, I am inquiring about property options.')}`;
                });
            }

            // 2. Email
            if (settings.contact && settings.contact.email) {
                document.querySelectorAll('.shared-email-link').forEach(el => {
                    el.href = `mailto:${settings.contact.email}`;
                    el.innerText = settings.contact.email;
                });
            }

            // 3. Office Address
            if (settings.contact && settings.contact.address) {
                document.querySelectorAll('.shared-address-text').forEach(el => {
                    el.innerText = settings.contact.address;
                });
            }

            // 4. Social Links
            if (settings.social) {
                if (settings.social.facebook) document.querySelectorAll('.shared-social-fb').forEach(el => el.href = settings.social.facebook);
                if (settings.social.instagram) document.querySelectorAll('.shared-social-ig').forEach(el => el.href = settings.social.instagram);
                if (settings.social.youtube) document.querySelectorAll('.shared-social-yt').forEach(el => el.href = settings.social.youtube);
                if (settings.social.twitter) document.querySelectorAll('.shared-social-tw').forEach(el => el.href = settings.social.twitter);
                if (settings.social.linkedin) document.querySelectorAll('.shared-social-li').forEach(el => el.href = settings.social.linkedin);
            }
        } catch (e) {
            console.warn('Error hydrating shared site settings:', e);
        }
    }
};

// ==========================================================================
// Kaghan Properties - Global Under-Construction & Maintenance Mode Engine
// ==========================================================================
window.KaghanMaintenance = {
    timerInterval: null,
    firestoreUnsub: null,

    isExemptPage: function() {
        const path = window.location.pathname.toLowerCase();
        return path.includes('kp-sec-access-9182.html') ||
               path.includes('/admin/') ||
               path.includes('admin/index.html') ||
               path.includes('populate-firestore.html') ||
               path.includes('clear-firestore.html');
    },

    init: async function() {
        if (this.isExemptPage()) return;

        // 1. Check URL Query Parameters for Bypass Key (?preview_key=... or ?maintenance_key=... or ?bypass=...)
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const queryBypassKey = urlParams.get('preview_key') || urlParams.get('maintenance_key') || urlParams.get('bypass') || urlParams.get('key');
            if (queryBypassKey) {
                localStorage.setItem('kaghan_maintenance_bypass', queryBypassKey.trim());
            }
        } catch (e) {}

        // 2. Fetch current settings and evaluate
        const settings = window.KaghanDB ? await window.KaghanDB.getSiteSettings() : null;
        this.evaluate(settings);

        // 3. Listen for local setting changes
        window.addEventListener('siteSettingsUpdated', (e) => {
            if (e.detail) this.evaluate(e.detail);
        });

        // 4. Listen for real-time Firestore settings updates
        if (typeof firebase !== 'undefined' && firebase.firestore && !this.firestoreUnsub) {
            try {
                const db = firebase.firestore();
                this.firestoreUnsub = db.collection('kaghan_properties').doc('siteSettings')
                    .onSnapshot((snap) => {
                        if (snap.exists) {
                            const data = snap.data();
                            this.evaluate(data);
                        }
                    }, (err) => {
                        console.warn('Maintenance Firestore snapshot listener:', err);
                    });
            } catch (e) {
                console.warn('Could not attach Firestore maintenance listener:', e);
            }
        }
    },

    evaluate: function(settings) {
        if (this.isExemptPage()) return;

        const underConstruction = (settings && settings.underConstruction) ? settings.underConstruction : (window.KaghanDB ? window.KaghanDB.DEFAULT_SITE_SETTINGS.underConstruction : null);
        const isEnabled = !!(underConstruction && underConstruction.enabled);

        if (!isEnabled) {
            this.removeUnderConstructionScreen();
            this.removeVIPBanner();
            return;
        }

        // Under construction is active - check if visitor is authorized to bypass
        const currentUser = (window.CorporateDB && window.CorporateDB.getCurrentUser) ? window.CorporateDB.getCurrentUser() : null;
        const storedBypassKey = localStorage.getItem('kaghan_maintenance_bypass') || '';

        const check = (window.KaghanDB && window.KaghanDB.canUserBypassMaintenance) 
            ? window.KaghanDB.canUserBypassMaintenance(settings, currentUser, storedBypassKey)
            : { allowed: false };

        if (check.allowed) {
            // Authorized visitor: remove blocker and display VIP Preview Ribbon
            this.removeUnderConstructionScreen();
            this.renderVIPBanner(underConstruction, check.reason, currentUser);
        } else {
            // Unauthorized visitor: remove VIP banner and render full Under Construction Screen
            this.removeVIPBanner();
            this.renderUnderConstructionScreen(underConstruction);
        }
    },

    renderVIPBanner: function(maint, reason, user) {
        let banner = document.getElementById('kaghan-maintenance-vip-bar');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'kaghan-maintenance-vip-bar';
            document.body.prepend(banner);
        }

        let reasonLabel = 'VIP Preview';
        if (reason === 'admin') reasonLabel = `Admin (${(user && user.name) || 'Authorized'})`;
        else if (reason === 'user_permission' || reason === 'role_allowed') reasonLabel = `Staff User (${(user && user.name) || (user && user.role) || 'Agent'})`;
        else if (reason === 'email_whitelisted') reasonLabel = `Whitelisted (${(user && user.email) || 'Verified'})`;
        else if (reason === 'passcode') reasonLabel = 'Passcode Access';

        banner.className = 'sticky top-0 z-[99999] bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/40 text-amber-200 text-xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl backdrop-blur-md';
        banner.innerHTML = `
            <div class="flex items-center gap-2.5">
                <span class="relative flex h-2.5 w-2.5">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span class="font-bold text-[11px] uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                    Under Construction Active
                </span>
                <span class="text-slate-300 text-xs hidden sm:inline">
                    You have authorized access via <strong class="text-amber-300">${reasonLabel}</strong>. Public visitors see the maintenance screen.
                </span>
            </div>
            <div class="flex items-center gap-2 ml-auto">
                ${(user && user.role === 'admin') ? `
                    <a href="admin/index.html" class="bg-[#D4AF37] hover:bg-white text-slate-950 font-bold px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow">
                        <i class="fa-solid fa-sliders"></i> Admin Console
                    </a>
                ` : ''}
                <button type="button" onclick="window.KaghanMaintenance.exitPreview()" class="bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer">
                    <i class="fa-solid fa-right-from-bracket"></i> Lock / Exit Preview
                </button>
            </div>
        `;
    },

    removeVIPBanner: function() {
        const banner = document.getElementById('kaghan-maintenance-vip-bar');
        if (banner) banner.remove();
    },

    renderUnderConstructionScreen: function(maint) {
        document.body.style.overflow = 'hidden';
        let overlay = document.getElementById('kaghan-under-construction-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'kaghan-under-construction-overlay';
            document.body.appendChild(overlay);
        }

        const headline = (maint && maint.headline) || "We Are Upgrading Our Digital Experience";
        const subheadline = (maint && maint.subheadline) || "Kaghan Properties is currently undergoing scheduled platform upgrades, infrastructure enhancements, and portfolio synchronization. We will be back online shortly.";
        const phone = (maint && maint.contactPhone) || "+923340091127";
        const email = (maint && maint.contactEmail) || "info@kaghanproperties.com";
        const whatsapp = (maint && maint.contactWhatsApp) || "+923340091127";
        const whatsappClean = whatsapp.replace(/[^0-9]/g, '');
        const endTime = maint && maint.estimatedEndTime ? maint.estimatedEndTime : null;
        const noticeBadge = (maint && maint.noticeBadge) || "Scheduled Platform Maintenance";

        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.zIndex = '999999';
        overlay.style.overflowY = 'auto';
        overlay.style.backgroundColor = '#070b14';

        overlay.innerHTML = `
            <div class="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between items-center relative overflow-hidden px-4 py-8 sm:p-12 font-sans select-none">
                <!-- Background Glowing Gradients -->
                <div class="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] bg-[#077943]/20 rounded-full blur-[140px] pointer-events-none"></div>
                <div class="absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] bg-[#D4AF37]/15 rounded-full blur-[140px] pointer-events-none"></div>
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[450px] max-h-[450px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none"></div>

                <!-- Top Brand Header -->
                <header class="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                    <div class="flex items-center gap-3">
                        <img src="assets/images/logo.png" alt="Kaghan Properties Logo" class="h-10 sm:h-12 w-auto object-contain drop-shadow-md" onerror="this.src='assets/images/logo.png'">
                        <div>
                            <span class="font-extrabold text-base sm:text-lg tracking-wider uppercase text-white font-['Outfit'] block">Kaghan Properties</span>
                            <span class="text-[9px] uppercase tracking-widest text-[#D4AF37] font-semibold">Pakistan Premier Real Estate Marketplace</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 bg-slate-900/90 border border-amber-500/30 px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md">
                        <span class="relative flex h-2 w-2">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span class="text-[11px] font-bold text-amber-300 font-mono tracking-wide uppercase">${noticeBadge}</span>
                    </div>
                </header>

                <!-- Central Content Box -->
                <main class="w-full max-w-3xl my-8 relative z-10 text-center space-y-7">
                    <!-- Icon / Brand Badge -->
                    <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-emerald-500/20 border border-amber-500/30 shadow-2xl relative group">
                        <i class="fa-solid fa-compass-drafting text-3xl text-[#D4AF37] group-hover:scale-110 transition-transform duration-300"></i>
                        <span class="absolute -top-1 -right-1 flex h-4 w-4">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-4 w-4 bg-[#077943] border-2 border-slate-950"></span>
                        </span>
                    </div>

                    <!-- Headline & Subtitle -->
                    <div class="space-y-3">
                        <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight font-['Outfit'] text-white leading-tight">
                            <span class="bg-gradient-to-r from-white via-slate-100 to-[#D4AF37] bg-clip-text text-transparent">
                                ${headline}
                            </span>
                        </h1>
                        <p class="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                            ${subheadline}
                        </p>
                    </div>

                    <!-- Countdown Timer Block (if endTime is provided) -->
                    ${endTime ? `
                        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-2xl max-w-xl mx-auto">
                            <div class="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-4 flex items-center justify-center gap-2">
                                <i class="fa-solid fa-clock"></i> Estimated Re-Launch Countdown
                            </div>
                            <div id="maint-countdown-grid" class="grid grid-cols-4 gap-2 sm:gap-4 font-['Outfit']">
                                <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                                    <span id="maint-count-days" class="block text-2xl sm:text-4xl font-extrabold text-white">00</span>
                                    <span class="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-bold">Days</span>
                                </div>
                                <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                                    <span id="maint-count-hours" class="block text-2xl sm:text-4xl font-extrabold text-white">00</span>
                                    <span class="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-bold">Hours</span>
                                </div>
                                <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                                    <span id="maint-count-mins" class="block text-2xl sm:text-4xl font-extrabold text-white">00</span>
                                    <span class="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-bold">Mins</span>
                                </div>
                                <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                                    <span id="maint-count-secs" class="block text-2xl sm:text-4xl font-extrabold text-[#D4AF37]">00</span>
                                    <span class="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-bold">Secs</span>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Quick Direct Action Buttons -->
                    <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <a href="https://wa.me/${whatsappClean}?text=Hello%20Kaghan%20Properties%20Team%2C%20I%20am%20inquiring%20about%20a%20property%20listing." target="_blank" class="bg-[#25D366] hover:bg-[#1ebd5a] text-slate-950 font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer">
                            <i class="fa-brands fa-whatsapp text-base"></i> Direct WhatsApp Concierge
                        </a>
                        <a href="tel:${phone}" class="bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2">
                            <i class="fa-solid fa-phone text-xs text-[#D4AF37]"></i> Call ${phone}
                        </a>
                        <a href="mailto:${email}" class="bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2">
                            <i class="fa-solid fa-envelope text-xs text-[#D4AF37]"></i> Email Inquiries
                        </a>
                    </div>

                    <!-- Lead Capture Notify Form -->
                    <div class="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 max-w-md mx-auto backdrop-blur-sm">
                        <div class="text-xs text-slate-300 font-semibold mb-2 flex items-center justify-center gap-1.5">
                            <i class="fa-solid fa-bell text-[#D4AF37]"></i> Get notified when we go live
                        </div>
                        <form id="maint-notify-form" onsubmit="window.KaghanMaintenance.handleNotifySubmit(event)" class="flex gap-2">
                            <input type="email" id="maint-notify-email" required placeholder="Enter your email address" class="flex-1 bg-slate-950 border border-slate-800 focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all">
                            <button type="submit" id="maint-notify-btn" class="bg-[#D4AF37] hover:bg-white text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer">
                                Notify Me
                            </button>
                        </form>
                        <div id="maint-notify-msg" class="hidden text-xs text-emerald-400 mt-2 font-medium"></div>
                    </div>
                </main>

                <!-- Bottom Footer with VIP Unlock Button -->
                <footer class="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-900/80 relative z-10 text-xs text-slate-500">
                    <div>
                        © ${new Date().getFullYear()} Kaghan Properties. All Rights Reserved.
                    </div>

                    <div class="flex items-center gap-4">
                        <button type="button" onclick="window.KaghanMaintenance.openUnlockModal()" class="text-slate-400 hover:text-[#D4AF37] flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer">
                            <i class="fa-solid fa-key text-[11px] text-[#D4AF37]"></i>
                            <span>Staff Login & VIP Preview</span>
                        </button>
                    </div>
                </footer>

                <!-- VIP & STAFF ACCESS UNLOCK MODAL -->
                <div id="maint-unlock-modal" class="fixed inset-0 z-[1000000] bg-slate-950/80 backdrop-blur-md hidden flex items-center justify-center p-4">
                    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative text-left">
                        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
                            <div class="flex items-center gap-2.5">
                                <span class="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                                    <i class="fa-solid fa-shield-halved"></i>
                                </span>
                                <div>
                                    <h3 class="text-base font-bold text-white font-['Outfit']">Authorized Personnel Access</h3>
                                    <p class="text-[10px] text-slate-400">Unlock live site preview or management console</p>
                                </div>
                            </div>
                            <button type="button" onclick="window.KaghanMaintenance.closeUnlockModal()" class="text-slate-400 hover:text-white text-lg cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
                        </div>

                        <!-- Tab Selection: Passcode vs Portal Login -->
                        <div class="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                            <button type="button" id="maint-tab-passcode-btn" onclick="window.KaghanMaintenance.switchModalTab('passcode')" class="flex-1 py-2 rounded-lg bg-[#D4AF37] text-slate-950 transition-all text-center cursor-pointer">
                                <i class="fa-solid fa-key mr-1"></i> VIP Passcode
                            </button>
                            <button type="button" id="maint-tab-login-btn" onclick="window.KaghanMaintenance.switchModalTab('login')" class="flex-1 py-2 rounded-lg text-slate-400 hover:text-white transition-all text-center cursor-pointer">
                                <i class="fa-solid fa-user-lock mr-1"></i> Staff Login
                            </button>
                        </div>

                        <!-- Form 1: VIP Passcode -->
                        <form id="maint-passcode-form" onsubmit="window.KaghanMaintenance.handlePasscodeSubmit(event)" class="space-y-4 text-xs">
                            <div>
                                <label class="text-slate-400 uppercase font-bold block mb-1.5 text-[10px] tracking-wider">Bypass Passcode</label>
                                <div class="relative">
                                    <i class="fa-solid fa-lock absolute left-3.5 top-3 text-slate-500"></i>
                                    <input type="password" id="maint-passcode-input" required placeholder="Enter secret VIP passcode" class="w-full bg-slate-950 border border-slate-800 focus:border-[#D4AF37] rounded-xl pl-10 pr-4 py-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]">
                                </div>
                                <p class="text-[10px] text-slate-500 mt-1">Provided by Kaghan Properties administration for authorized clients & stakeholders.</p>
                            </div>
                            <button type="submit" id="maint-passcode-btn" class="w-full bg-[#D4AF37] hover:bg-white text-slate-950 font-bold py-3 rounded-xl uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 cursor-pointer">
                                <span>Unlock VIP Preview</span>
                                <i class="fa-solid fa-arrow-right text-[10px]"></i>
                            </button>
                            <div id="maint-passcode-error" class="hidden text-xs text-rose-400 text-center font-semibold"></div>
                        </form>

                        <!-- Form 2: Staff Login -->
                        <form id="maint-login-form" onsubmit="window.KaghanMaintenance.handleStaffLoginSubmit(event)" class="space-y-3.5 text-xs hidden">
                            <div>
                                <label class="text-slate-400 uppercase font-bold block mb-1 text-[10px] tracking-wider">Email Address</label>
                                <input type="email" id="maint-staff-email" placeholder="agent@kaghanproperties.com" class="w-full bg-slate-950 border border-slate-800 focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-white focus:outline-none">
                            </div>
                            <div>
                                <label class="text-slate-400 uppercase font-bold block mb-1 text-[10px] tracking-wider">Password</label>
                                <input type="password" id="maint-staff-password" placeholder="••••••••" class="w-full bg-slate-950 border border-slate-800 focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-white focus:outline-none">
                            </div>
                            <button type="submit" id="maint-login-submit-btn" class="w-full bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-white hover:to-white text-slate-950 font-bold py-3 rounded-xl uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer">
                                <span>Sign In & Unlock</span>
                                <i class="fa-solid fa-unlock text-[10px]"></i>
                            </button>
                            <div id="maint-login-error" class="hidden text-xs text-rose-400 text-center font-semibold"></div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        if (endTime) {
            this.startCountdown(endTime);
        }
    },

    removeUnderConstructionScreen: function() {
        document.body.style.overflow = '';
        const overlay = document.getElementById('kaghan-under-construction-overlay');
        if (overlay) overlay.remove();
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    startCountdown: function(targetTimeStr) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        const target = new Date(targetTimeStr).getTime();
        if (isNaN(target)) return;

        const tick = () => {
            const now = new Date().getTime();
            const diff = target - now;

            const daysEl = document.getElementById('maint-count-days');
            const hoursEl = document.getElementById('maint-count-hours');
            const minsEl = document.getElementById('maint-count-mins');
            const secsEl = document.getElementById('maint-count-secs');

            if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

            if (diff <= 0) {
                daysEl.innerText = "00";
                hoursEl.innerText = "00";
                minsEl.innerText = "00";
                secsEl.innerText = "00";
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            daysEl.innerText = String(days).padStart(2, '0');
            hoursEl.innerText = String(hours).padStart(2, '0');
            minsEl.innerText = String(minutes).padStart(2, '0');
            secsEl.innerText = String(seconds).padStart(2, '0');
        };

        tick();
        this.timerInterval = setInterval(tick, 1000);
    },

    openUnlockModal: function() {
        const modal = document.getElementById('maint-unlock-modal');
        if (modal) modal.classList.remove('hidden');
    },

    closeUnlockModal: function() {
        const modal = document.getElementById('maint-unlock-modal');
        if (modal) modal.classList.add('hidden');
    },

    switchModalTab: function(tab) {
        const passForm = document.getElementById('maint-passcode-form');
        const loginForm = document.getElementById('maint-login-form');
        const passBtn = document.getElementById('maint-tab-passcode-btn');
        const loginBtn = document.getElementById('maint-tab-login-btn');

        if (tab === 'passcode') {
            passForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            passBtn.className = 'flex-1 py-2 rounded-lg bg-[#D4AF37] text-slate-950 transition-all text-center cursor-pointer';
            loginBtn.className = 'flex-1 py-2 rounded-lg text-slate-400 hover:text-white transition-all text-center cursor-pointer';
        } else {
            passForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            loginBtn.className = 'flex-1 py-2 rounded-lg bg-[#D4AF37] text-slate-950 transition-all text-center cursor-pointer';
            passBtn.className = 'flex-1 py-2 rounded-lg text-slate-400 hover:text-white transition-all text-center cursor-pointer';
        }
    },

    handlePasscodeSubmit: async function(e) {
        e.preventDefault();
        const input = document.getElementById('maint-passcode-input');
        const err = document.getElementById('maint-passcode-error');
        const code = input ? input.value.trim() : '';

        if (!code) return;
        err.classList.add('hidden');

        const settings = window.KaghanDB ? await window.KaghanDB.getSiteSettings() : null;
        const maint = (settings && settings.underConstruction) ? settings.underConstruction : (window.KaghanDB ? window.KaghanDB.DEFAULT_SITE_SETTINGS.underConstruction : null);
        const expected = (maint && maint.bypassPasscode ? maint.bypassPasscode : 'KAGHAN-VIP-2026').trim();

        if (code === expected) {
            localStorage.setItem('kaghan_maintenance_bypass', code);
            this.closeUnlockModal();
            this.evaluate(settings);
        } else {
            err.innerText = "Invalid bypass passcode. Please check and try again.";
            err.classList.remove('hidden');
        }
    },

    handleStaffLoginSubmit: async function(e) {
        e.preventDefault();
        const email = document.getElementById('maint-staff-email').value.trim();
        const password = document.getElementById('maint-staff-password').value.trim();
        const err = document.getElementById('maint-login-error');
        const btn = document.getElementById('maint-login-submit-btn');

        if (!email || !password) return;
        err.classList.add('hidden');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Authenticating...';

        try {
            const res = await window.CorporateDB.login(email, password);
            if (res.success) {
                const settings = await window.KaghanDB.getSiteSettings();
                const check = window.KaghanDB.canUserBypassMaintenance(settings, res.session, '');
                if (check.allowed) {
                    this.closeUnlockModal();
                    this.evaluate(settings);
                } else {
                    err.innerText = "Your user account does not have permission to access the site during maintenance.";
                    err.classList.remove('hidden');
                }
            } else {
                err.innerText = res.message || "Invalid credentials.";
                err.classList.remove('hidden');
            }
        } catch (error) {
            err.innerText = "System error during authentication. Please check connection.";
            err.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Sign In & Unlock <i class="fa-solid fa-unlock text-[10px]"></i>';
        }
    },

    handleNotifySubmit: async function(e) {
        e.preventDefault();
        const emailInput = document.getElementById('maint-notify-email');
        const msg = document.getElementById('maint-notify-msg');
        const btn = document.getElementById('maint-notify-btn');

        if (!emailInput || !emailInput.value) return;
        const email = emailInput.value.trim();

        btn.disabled = true;
        btn.innerText = 'Subscribing...';

        try {
            if (window.CorporateDB && window.CorporateDB.addSubscriber) {
                await window.CorporateDB.addSubscriber(email);
            } else if (window.KaghanDB && window.KaghanDB.createLead) {
                await window.KaghanDB.createLead({
                    name: 'Launch Notification Subscriber',
                    email: email,
                    phone: '',
                    message: 'Requested launch notification when site goes live',
                    sourcePage: window.location.pathname
                });
            }
            msg.innerHTML = '<i class="fa-solid fa-circle-check mr-1"></i> You are on the VIP launch list! We will notify you immediately.';
            msg.classList.remove('hidden');
            emailInput.value = '';
        } catch (err) {
            msg.innerText = 'Thank you for your interest! We have registered your email.';
            msg.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerText = 'Notify Me';
        }
    },

    exitPreview: function() {
        localStorage.removeItem('kaghan_maintenance_bypass');
        window.location.reload();
    }
};

// Auto-run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.KaghanSharedUI.init();
        if (window.KaghanMaintenance) window.KaghanMaintenance.init();
    });
} else {
    window.KaghanSharedUI.init();
    if (window.KaghanMaintenance) window.KaghanMaintenance.init();
}

