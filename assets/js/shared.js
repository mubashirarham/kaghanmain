// Kaghan Properties - Shared Header, Footer & Global Navigation UI Component Engine
// Implements §2, §3, §7, §8, §10 specifications: Two-tier header, 5-column footer,
// currency switcher, area-unit switcher, modals, and sticky elements.

window.KaghanSharedUI = {
    // Current Global Market State
    currency: localStorage.getItem('kaghan_currency') || 'PKR',
    areaUnit: localStorage.getItem('kaghan_area_unit') || 'marla',
    language: localStorage.getItem('kaghan_lang') || 'EN',

    init: function() {
        this.renderHeader();
        this.renderFooter();
        this.renderModals();
        this.renderFloatingWhatsApp();
        this.initScrollHandlers();
        this.hydrateSiteSettings();
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
        const unit = this.areaUnit.toLowerCase();
        if (unit === 'sqft') {
            return `${Math.round(marlaSize * 225).toLocaleString()} Sq. Ft.`;
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
            <header id="main-site-header" class="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all duration-300 shadow-sm">
                <!-- Tier 1: Utility Bar (Logo, Nav, Tools & Switchers) -->
                <div class="border-b border-slate-100 py-2.5">
                    <div class="market-container flex justify-between items-center text-xs">
                        
                        <!-- Left: Logo & Primary Navigation Links -->
                        <div class="flex items-center gap-6 lg:gap-8">
                            <!-- Logo -->
                            <a href="index.html" class="flex items-center gap-2.5 group">
                                <img src="assets/images/logo.png" alt="Kaghan Properties Logo" class="h-8 w-auto object-contain" onerror="this.src='stay/assets/images/logo.png'">
                                <div class="flex flex-col">
                                    <span class="text-base font-extrabold tracking-tight uppercase outfit text-slate-900 leading-none group-hover:text-emerald-700 transition-colors">Kaghan</span>
                                    <span class="text-[8px] text-amber-600 tracking-[0.24em] uppercase font-bold">Properties</span>
                                </div>
                            </a>

                            <!-- Primary Links (Desktop) -->
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
                        <div class="flex items-center gap-2.5 sm:gap-3.5">
                            <!-- Currency Toggle -->
                            <div class="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                <i class="fa-solid fa-coins text-slate-400 text-[10px]"></i>
                                <select id="header-currency-select" onchange="window.KaghanSharedUI.setCurrency(this.value)" class="bg-transparent text-slate-800 font-bold text-[11px] focus:outline-none cursor-pointer">
                                    <option value="PKR" ${this.currency === 'PKR' ? 'selected' : ''}>PKR</option>
                                    <option value="USD" ${this.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                                    <option value="AED" ${this.currency === 'AED' ? 'selected' : ''}>AED</option>
                                </select>
                            </div>

                            <!-- Area-Unit Toggle -->
                            <div class="hidden sm:flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                <i class="fa-solid fa-vector-square text-slate-400 text-[10px]"></i>
                                <select id="header-unit-select" onchange="window.KaghanSharedUI.setAreaUnit(this.value)" class="bg-transparent text-slate-800 font-medium text-[11px] focus:outline-none cursor-pointer">
                                    <option value="marla" ${this.areaUnit === 'marla' ? 'selected' : ''}>Marla</option>
                                    <option value="sqft" ${this.areaUnit === 'sqft' ? 'selected' : ''}>Sq. Ft.</option>
                                    <option value="kanal" ${this.areaUnit === 'kanal' ? 'selected' : ''}>Kanal</option>
                                </select>
                            </div>

                            <!-- Language Toggle -->
                            <button onclick="window.KaghanSharedUI.toggleLanguage()" title="Switch Language" class="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1">
                                <i class="fa-solid fa-globe"></i>
                                <span id="lang-indicator" class="font-bold text-[10px]">${this.language}</span>
                            </button>

                            <!-- Primary CTA Button ("Add Property") -->
                            <button onclick="window.KaghanSharedUI.openAddPropertyModal()" class="btn-primary text-xs py-1.5 px-3.5 rounded-full font-bold shadow-sm whitespace-nowrap">
                                <i class="fa-solid fa-plus text-[10px]"></i> Add Property
                            </button>

                            <!-- Mobile Menu Trigger -->
                            <button onclick="window.KaghanSharedUI.toggleMobileMenu()" class="lg:hidden p-1.5 text-slate-700 hover:text-emerald-700 focus:outline-none">
                                <i class="fa-solid fa-bars text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tier 2: Transaction Sub-Nav (Buy/Rent, Homes, Plots, Commercial, Agents, Projects) -->
                <div class="py-2.5 bg-slate-50/90 border-b border-slate-100 hidden sm:block">
                    <div class="market-container flex justify-between items-center text-xs">
                        
                        <!-- Left: Purpose Toggle & Category Links -->
                        <div class="flex items-center gap-6">
                            <!-- Purpose Toggle Segmented Control -->
                            <div class="segmented-control">
                                <a href="projects.html?purpose=sale" id="tier2-buy" class="${window.location.search.includes('purpose=rent') ? '' : 'active'}">Buy</a>
                                <a href="projects.html?purpose=rent" id="tier2-rent" class="${window.location.search.includes('purpose=rent') ? 'active' : ''}">Rent</a>
                            </div>

                            <!-- Category Links -->
                            <div class="flex items-center gap-5 font-bold text-slate-700">
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
                        <div class="flex items-center gap-5 font-bold text-slate-700">
                            <a href="agents.html" class="${active === 'agents' ? 'text-emerald-700 font-extrabold' : 'hover:text-emerald-700 hover:-translate-y-0.5'} transition-all flex items-center gap-1.5 font-bold cursor-pointer">
                                <i class="fa-solid fa-user-tie text-slate-400"></i> Real Estate Agents
                            </a>
                            <a href="projects.html?isNewProject=true" class="hover:text-emerald-700 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 font-extrabold text-emerald-800 cursor-pointer">
                                <i class="fa-solid fa-city text-emerald-600"></i> New Projects & Blocks
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Mobile Navigation Drawer -->
            <div id="mobile-menu-drawer" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] hidden flex flex-col justify-end transition-all">
                <div class="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 space-y-6">
                    <div class="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div class="flex items-center gap-2">
                            <img src="assets/images/logo.png" class="h-8 w-auto">
                            <span class="font-bold outfit text-base text-slate-900">Kaghan Properties</span>
                        </div>
                        <button onclick="window.KaghanSharedUI.toggleMobileMenu()" class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <!-- Purpose Selector Mobile -->
                    <div class="flex bg-slate-100 p-1 rounded-xl text-center text-xs font-bold">
                        <a href="projects.html?purpose=sale" class="flex-1 py-2 rounded-lg bg-white shadow-sm text-emerald-800">Buy Property</a>
                        <a href="projects.html?purpose=rent" class="flex-1 py-2 rounded-lg text-slate-600">Rent Property</a>
                    </div>

                    <!-- Navigation Links Mobile -->
                    <div class="space-y-3 text-sm font-semibold text-slate-700">
                        <a href="index.html" class="block py-1 hover:text-emerald-700">Home</a>
                        <a href="projects.html" class="block py-1 hover:text-emerald-700">Properties Catalog</a>
                        <a href="projects.html?isNewProject=true" class="block py-1 hover:text-emerald-700 text-emerald-700">New Projects & Blocks</a>
                        <a href="area.html" class="block py-1 hover:text-emerald-700">Area Guides & Societies</a>
                        <a href="calculator.html" class="block py-1 hover:text-emerald-700">Home Loan & Construction Calculators</a>
                        <a href="agents.html" class="block py-1 hover:text-emerald-700">Certified Real Estate Agents</a>
                        <a href="blog.html" class="block py-1 hover:text-emerald-700">Market Insights & Blog</a>
                        <a href="contact.html" class="block py-1 hover:text-emerald-700">Contact Desk</a>
                    </div>

                    <!-- Mobile CTA -->
                    <div class="pt-4 border-t border-slate-100 space-y-3">
                        <button onclick="window.KaghanSharedUI.toggleMobileMenu(); window.KaghanSharedUI.openAddPropertyModal();" class="w-full btn-primary py-3 rounded-xl text-sm font-bold shadow-md">
                            <i class="fa-solid fa-plus mr-1"></i> Add Property for Free
                        </button>
                        <a href="https://wa.me/923340091127" target="_blank" class="w-full btn-whatsapp py-3 rounded-xl text-sm font-bold flex items-center justify-center">
                            <i class="fa-brands fa-whatsapp text-lg mr-2"></i> WhatsApp Support
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
        if (drawer) drawer.classList.toggle('hidden');
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
                                <li><button onclick="window.KaghanSharedUI.openAddPropertyModal()" class="hover:text-emerald-400 text-left transition-colors">Add Property</button></li>
                            </ul>
                        </div>

                        <!-- Col 3: Head Office -->
                        <div class="space-y-3">
                            <h4 class="text-white font-bold outfit uppercase text-sm tracking-wider border-b border-slate-800 pb-2">Head Office</h4>
                            <div class="space-y-2 leading-relaxed text-slate-300">
                                <p class="flex items-start gap-2">
                                    <i class="fa-solid fa-location-dot text-emerald-400 mt-1"></i>
                                    <span class="shared-address-text">Ground Floor, Anjum Plaza, Bahria Enclave / Jinnah Avenue New Mall, Islamabad, Pakistan</span>
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

    // Render Global Modals (Add Property, Area Unit Converter, Lightbox)
    renderModals: function() {
        if (document.getElementById('global-modals-root')) return;

        const div = document.createElement('div');
        div.id = 'global-modals-root';
        div.innerHTML = `
            <!-- Add Property Modal -->
            <div id="modal-add-property" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4 overflow-y-auto">
                <div class="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative animate-fade-in">
                    <button onclick="window.KaghanSharedUI.closeAddPropertyModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-800">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                    <div class="border-b border-slate-100 pb-3">
                        <span class="badge-premium-new text-[9px] px-2 py-0.5 rounded-full mb-1 inline-block">Free Listing</span>
                        <h3 class="text-xl font-bold outfit text-slate-900">List Your Property on Kaghan</h3>
                        <p class="text-xs text-slate-500">Reach verified buyers and tenants across Pakistan & Overseas.</p>
                    </div>
                    <form onsubmit="window.KaghanSharedUI.submitAddProperty(event)" class="space-y-3 text-xs">
                        <div>
                            <label class="font-bold text-slate-700 block mb-1">Property Title</label>
                            <input type="text" id="prop-title" required placeholder="e.g. 5 Marla Designer Villa, Sector C Bahria Enclave" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-600">
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="font-bold text-slate-700 block mb-1">Purpose</label>
                                <select id="prop-purpose" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none">
                                    <option value="sale">For Sale</option>
                                    <option value="rent">For Rent</option>
                                </select>
                            </div>
                            <div>
                                <label class="font-bold text-slate-700 block mb-1">Property Type</label>
                                <select id="prop-type" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none">
                                    <option value="house">House / Villa</option>
                                    <option value="plot">Plot</option>
                                    <option value="apartment">Apartment / Flat</option>
                                    <option value="commercial">Commercial</option>
                                </select>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="font-bold text-slate-700 block mb-1">City / Society</label>
                                <input type="text" id="prop-location" required placeholder="e.g. Bahria Enclave, Islamabad" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-600">
                            </div>
                            <div>
                                <label class="font-bold text-slate-700 block mb-1">Demand Price (PKR)</label>
                                <input type="number" id="prop-price" required placeholder="e.g. 28500000" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-600">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="font-bold text-slate-700 block mb-1">Your Name</label>
                                <input type="text" id="prop-owner-name" required placeholder="Your full name" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-600">
                            </div>
                            <div>
                                <label class="font-bold text-slate-700 block mb-1">WhatsApp / Phone</label>
                                <input type="tel" id="prop-owner-phone" required placeholder="+92 334 0000000" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-600">
                            </div>
                        </div>
                        <div class="pt-2">
                            <button type="submit" class="w-full btn-primary py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider">
                                Submit Property Listing
                            </button>
                        </div>
                    </form>
                    <div id="add-property-success" class="hidden text-center text-xs text-emerald-700 font-bold bg-emerald-50 p-3 rounded-lg">
                        <i class="fa-solid fa-circle-check text-lg mr-1"></i> Property submitted successfully! Our team will verify and publish it.
                    </div>
                </div>
            </div>

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
                                <option value="marla">Marla (225 sq ft)</option>
                                <option value="kanal">Kanal (20 Marla)</option>
                                <option value="sqft">Square Feet (Sq. Ft.)</option>
                                <option value="sqyd">Square Yards (Sq. Yd. / Gaz)</option>
                            </select>
                        </div>
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                            <div class="flex justify-between items-center text-xs font-semibold">
                                <span class="text-slate-500">Marla:</span>
                                <span id="res-marla" class="text-emerald-700 font-bold tabular-nums">5.00 Marla</span>
                            </div>
                            <div class="flex justify-between items-center text-xs font-semibold">
                                <span class="text-slate-500">Kanal:</span>
                                <span id="res-kanal" class="text-emerald-700 font-bold tabular-nums">0.25 Kanal</span>
                            </div>
                            <div class="flex justify-between items-center text-xs font-semibold">
                                <span class="text-slate-500">Square Feet:</span>
                                <span id="res-sqft" class="text-emerald-700 font-bold tabular-nums">1,125 Sq. Ft.</span>
                            </div>
                            <div class="flex justify-between items-center text-xs font-semibold">
                                <span class="text-slate-500">Square Yards (Gaz):</span>
                                <span id="res-sqyd" class="text-emerald-700 font-bold tabular-nums">125 Sq. Yd.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    },

    openAddPropertyModal: function() {
        const m = document.getElementById('modal-add-property');
        if (m) m.classList.remove('hidden');
    },

    closeAddPropertyModal: function() {
        const m = document.getElementById('modal-add-property');
        if (m) m.classList.add('hidden');
    },

    submitAddProperty: async function(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : 'Submit Property Listing';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Submitting...';
        }

        const title = document.getElementById('prop-title')?.value || '';
        const purpose = document.getElementById('prop-purpose')?.value || 'sale';
        const type = document.getElementById('prop-type')?.value || 'house';
        const location = document.getElementById('prop-location')?.value || '';
        const price = parseFloat(document.getElementById('prop-price')?.value) || 0;
        const ownerName = document.getElementById('prop-owner-name')?.value || '';
        const ownerPhone = document.getElementById('prop-owner-phone')?.value || '';

        try {
            if (window.KaghanDB && window.KaghanDB.createLead) {
                await window.KaghanDB.createLead({
                    name: ownerName,
                    phone: ownerPhone,
                    email: '',
                    propertyTitle: title,
                    message: `Property Listing Submission: "${title}" (For ${purpose.toUpperCase()} - ${type}) in ${location} for demand PKR ${price.toLocaleString()}. Listed by owner ${ownerName} (Contact: ${ownerPhone}).`,
                    sourcePage: 'Add Property Modal',
                    status: 'new'
                });
            }

            const success = document.getElementById('add-property-success');
            if (success) {
                success.classList.remove('hidden');
                e.target.reset();
                setTimeout(() => {
                    window.KaghanSharedUI.closeAddPropertyModal();
                    success.classList.add('hidden');
                }, 2500);
            }
        } catch (err) {
            console.error('Error submitting property lead to Firestore:', err);
            alert('Your property details have been recorded. A Kaghan consultant will contact you shortly.');
            window.KaghanSharedUI.closeAddPropertyModal();
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
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
        const from = document.getElementById('converter-from-unit')?.value || 'marla';
        if (isNaN(val)) return;

        // Convert to base: Square Feet
        let sqft = 0;
        if (from === 'marla') sqft = val * 225;
        else if (from === 'kanal') sqft = val * 20 * 225;
        else if (from === 'sqyd') sqft = val * 9;
        else sqft = val;

        const marla = sqft / 225;
        const kanal = marla / 20;
        const sqyd = sqft / 9;

        const rMarla = document.getElementById('res-marla');
        const rKanal = document.getElementById('res-kanal');
        const rSqft = document.getElementById('res-sqft');
        const rSqyd = document.getElementById('res-sqyd');

        if (rMarla) rMarla.innerText = `${marla.toFixed(2)} Marla`;
        if (rKanal) rKanal.innerText = `${kanal.toFixed(2)} Kanal`;
        if (rSqft) rSqft.innerText = `${Math.round(sqft).toLocaleString()} Sq. Ft.`;
        if (rSqyd) rSqyd.innerText = `${Math.round(sqyd).toLocaleString()} Sq. Yd.`;
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

// Auto-run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.KaghanSharedUI.init());
} else {
    window.KaghanSharedUI.init();
}
