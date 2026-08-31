// Kaghan Properties - Shared Header, Footer & Global Navigation UI Component Engine

window.KaghanSharedUI = {
    init: function() {
        this.renderHeader();
        this.renderFooter();
        this.renderFloatingWhatsApp();
        this.updateWishlistBadge();
    },

    getActivePage: function() {
        const path = window.location.pathname;
        if (path.includes('projects.html') || path.includes('/projects')) return 'projects';
        if (path.includes('property.html') || path.includes('/property')) return 'properties';
        if (path.includes('societies.html') || path.includes('/societies')) return 'societies';
        if (path.includes('area.html') || path.includes('/area')) return 'societies';
        if (path.includes('calculator.html') || path.includes('/calculator')) return 'calculator';
        if (path.includes('compare.html') || path.includes('/compare')) return 'compare';
        if (path.includes('agents.html') || path.includes('/agents')) return 'agents';
        if (path.includes('blog.html') || path.includes('/blog')) return 'blog';
        if (path.includes('faqs.html') || path.includes('/faqs')) return 'faqs';
        if (path.includes('contact.html') || path.includes('/contact')) return 'contact';
        if (path.includes('about.html') || path.includes('/about')) return 'about';
        if (path.includes('services.html') || path.includes('/services')) return 'services';
        return 'home';
    },

    renderHeader: function() {
        const active = this.getActivePage();
        const headerContainer = document.getElementById('site-header') || document.querySelector('nav');
        if (!headerContainer) return;

        const favsCount = (JSON.parse(localStorage.getItem('kaghan_favs') || '[]')).length;

        const navHtml = `
            <nav id="navbar" class="bg-slate-900/95 text-white sticky top-0 z-50 backdrop-blur-md border-b border-slate-800 transition-all duration-300">
                <div class="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex justify-between items-center">
                    <!-- Brand Logo -->
                    <a href="index.html" class="flex items-center gap-3">
                        <img src="assets/images/logo.png" alt="Kaghan Properties Logo" class="h-10 w-auto object-contain" onerror="this.src='stay/assets/images/logo.png'">
                        <div class="flex flex-col">
                            <span class="text-lg font-bold tracking-wider uppercase outfit text-white leading-none">Kaghan</span>
                            <span class="text-[9px] text-[#D4AF37] tracking-[0.22em] uppercase font-semibold">Properties</span>
                        </div>
                    </a>

                    <!-- Desktop Menu -->
                    <div class="hidden lg:flex gap-6 items-center font-medium text-xs">
                        <a href="index.html" class="${active==='home'?'text-[#D4AF37] font-bold underline underline-offset-4 decoration-[#D4AF37]':'hover:text-[#D4AF37] text-slate-200'} transition-colors">Home</a>
                        <a href="projects.html" class="${active==='projects' || active==='properties'?'text-[#D4AF37] font-bold underline underline-offset-4 decoration-[#D4AF37]':'hover:text-[#D4AF37] text-slate-200'} transition-colors">Properties</a>
                        <a href="societies.html" class="${active==='societies'?'text-[#D4AF37] font-bold underline underline-offset-4 decoration-[#D4AF37]':'hover:text-[#D4AF37] text-slate-200'} transition-colors">Societies</a>
                        <a href="calculator.html" class="${active==='calculator'?'text-[#D4AF37] font-bold underline underline-offset-4 decoration-[#D4AF37]':'hover:text-[#D4AF37] text-slate-200'} transition-colors">Calculators</a>
                        <a href="compare.html" class="${active==='compare'?'text-[#D4AF37] font-bold underline underline-offset-4 decoration-[#D4AF37]':'hover:text-[#D4AF37] text-slate-200'} transition-colors">Compare</a>
                        <a href="agents.html" class="${active==='agents'?'text-[#D4AF37] font-bold underline underline-offset-4 decoration-[#D4AF37]':'hover:text-[#D4AF37] text-slate-200'} transition-colors">Advisors</a>
                        <a href="blog.html" class="${active==='blog'?'text-[#D4AF37] font-bold underline underline-offset-4 decoration-[#D4AF37]':'hover:text-[#D4AF37] text-slate-200'} transition-colors">Blog</a>
                        <a href="faqs.html" class="${active==='faqs'?'text-[#D4AF37] font-bold underline underline-offset-4 decoration-[#D4AF37]':'hover:text-[#D4AF37] text-slate-200'} transition-colors">FAQs</a>
                    </div>

                    <!-- Right Action Controls -->
                    <div class="hidden lg:flex items-center gap-3">
                        <a href="projects.html" title="Saved Wishlist" class="relative p-2 text-slate-300 hover:text-[#D4AF37] transition-colors">
                            <i class="fa-solid fa-heart text-base"></i>
                            <span id="header-wishlist-badge" class="absolute -top-1 -right-1 bg-[#D4AF37] text-slate-950 font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">${favsCount}</span>
                        </a>
                        <a href="contact.html" class="bg-[#D4AF37] hover:bg-white text-slate-950 font-bold px-5 py-2 rounded-full text-xs transition-all shadow-md uppercase tracking-wider">
                            Contact Us
                        </a>
                    </div>

                    <!-- Mobile Menu Button -->
                    <button onclick="window.KaghanSharedUI.toggleMobileMenu()" class="lg:hidden p-2 text-slate-200 hover:text-[#D4AF37] focus:outline-none">
                        <i class="fa-solid fa-bars text-2xl"></i>
                    </button>
                </div>
            </nav>

            <!-- Mobile Navigation Drawer -->
            <div id="mobile-menu-drawer" class="fixed inset-0 bg-slate-950/95 z-[60] hidden flex flex-col justify-between p-8 text-white transition-all">
                <div class="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div class="flex items-center gap-2">
                        <img src="assets/images/logo.png" class="h-9 w-auto">
                        <span class="text-base font-bold outfit">Kaghan Properties</span>
                    </div>
                    <button onclick="window.KaghanSharedUI.toggleMobileMenu()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark text-2xl"></i></button>
                </div>

                <div class="space-y-4 my-auto text-base font-semibold text-center">
                    <a href="index.html" class="block hover:text-[#D4AF37]">Home</a>
                    <a href="projects.html" class="block hover:text-[#D4AF37]">Properties Catalog</a>
                    <a href="societies.html" class="block hover:text-[#D4AF37]">Societies Directory</a>
                    <a href="calculator.html" class="block hover:text-[#D4AF37]">Financial Calculators</a>
                    <a href="compare.html" class="block hover:text-[#D4AF37]">Compare Properties</a>
                    <a href="agents.html" class="block hover:text-[#D4AF37]">Real Estate Advisors</a>
                    <a href="blog.html" class="block hover:text-[#D4AF37]">Market Updates Blog</a>
                    <a href="faqs.html" class="block hover:text-[#D4AF37]">FAQs & Buying Guide</a>
                    <a href="contact.html" class="block text-[#D4AF37] font-bold">Contact Inquiry Desk</a>
                </div>

                <div class="pt-4 border-t border-slate-800 text-center space-y-3">
                    <a href="https://wa.me/923340091127" target="_blank" class="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl block text-xs uppercase">
                        <i class="fa-brands fa-whatsapp text-sm mr-1"></i> Instant WhatsApp Chat
                    </a>
                </div>
            </div>
        `;

        if (headerContainer.tagName === 'NAV') {
            headerContainer.outerHTML = navHtml;
        } else {
            headerContainer.innerHTML = navHtml;
        }
    },

    toggleMobileMenu: function() {
        const drawer = document.getElementById('mobile-menu-drawer');
        if (drawer) drawer.classList.toggle('hidden');
    },

    renderFooter: function() {
        const footerContainer = document.getElementById('site-footer') || document.querySelector('footer');
        if (!footerContainer) return;

        const footerHtml = `
            <footer class="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 relative z-10 pt-16 pb-8">
                <div class="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                        <!-- Col 1 & 2: Bio & Contact -->
                        <div class="lg:col-span-2 space-y-4">
                            <div class="flex items-center gap-3">
                                <img src="assets/images/logo.png" alt="Kaghan Properties Logo" class="h-10 w-auto object-contain">
                                <span class="text-xl font-bold tracking-wider uppercase outfit text-white">Kaghan Properties</span>
                            </div>
                            <p class="text-slate-400 text-xs leading-relaxed max-w-md">
                                Premier real estate agency and development management company operating across Islamabad, Rawalpindi, and Kaghan Valley. Specializing in high-yield serviced apartments, luxury residential villas, and commercial real estate.
                            </p>
                            <div class="space-y-2 text-slate-300 font-medium pt-2">
                                <div><i class="fa-solid fa-location-dot text-[#D4AF37] w-5"></i> Anjum Plaza, Bahria Enclave, Islamabad</div>
                                <div><i class="fa-solid fa-phone text-[#D4AF37] w-5"></i> +92 334 0091127</div>
                                <div><i class="fa-solid fa-envelope text-[#D4AF37] w-5"></i> info@kaghanproperties.com</div>
                            </div>
                        </div>

                        <!-- Col 3: Quick Navigation -->
                        <div class="space-y-3">
                            <h4 class="text-white font-bold outfit uppercase text-sm tracking-wider border-b border-slate-800 pb-2">Navigation</h4>
                            <ul class="space-y-2">
                                <li><a href="index.html" class="hover:text-[#D4AF37] transition-colors">Home Page</a></li>
                                <li><a href="projects.html" class="hover:text-[#D4AF37] transition-colors">Properties Catalog</a></li>
                                <li><a href="societies.html" class="hover:text-[#D4AF37] transition-colors">Societies Directory</a></li>
                                <li><a href="calculator.html" class="hover:text-[#D4AF37] transition-colors">Financial Calculators</a></li>
                                <li><a href="compare.html" class="hover:text-[#D4AF37] transition-colors">Compare Listings</a></li>
                                <li><a href="agents.html" class="hover:text-[#D4AF37] transition-colors">Real Estate Advisors</a></li>
                                <li><a href="faqs.html" class="hover:text-[#D4AF37] transition-colors">FAQs & Legal Guide</a></li>
                            </ul>
                        </div>

                        <!-- Col 4: Prime Locations -->
                        <div class="space-y-3">
                            <h4 class="text-white font-bold outfit uppercase text-sm tracking-wider border-b border-slate-800 pb-2">Prime Areas</h4>
                            <ul class="space-y-2">
                                <li><a href="area.html?slug=dha-islamabad" class="hover:text-[#D4AF37] transition-colors">DHA Islamabad</a></li>
                                <li><a href="area.html?slug=bahria-enclave" class="hover:text-[#D4AF37] transition-colors">Bahria Enclave</a></li>
                                <li><a href="area.html?slug=bahria-town" class="hover:text-[#D4AF37] transition-colors">Bahria Town</a></li>
                                <li><a href="area.html?slug=cda-sectors" class="hover:text-[#D4AF37] transition-colors">CDA Sectors (F-6/F-7/G-11)</a></li>
                                <li><a href="area.html?slug=nathia-gali" class="hover:text-[#D4AF37] transition-colors">Nathia Gali Heights</a></li>
                                <li><a href="area.html?slug=kaghan-valley" class="hover:text-[#D4AF37] transition-colors">Kaghan Valley Tourism</a></li>
                            </ul>
                        </div>

                        <!-- Col 5: Newsletter Form -->
                        <div class="space-y-3">
                            <h4 class="text-white font-bold outfit uppercase text-sm tracking-wider border-b border-slate-800 pb-2">Market Briefing</h4>
                            <p class="text-slate-400 text-[11px]">Subscribe for monthly Islamabad real estate price alerts and expat yield updates.</p>
                            <form onsubmit="window.KaghanSharedUI.submitNewsletter(event)" class="space-y-2">
                                <input type="email" id="footer-newsletter-email" required placeholder="Enter email address..." class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]">
                                <button type="submit" class="w-full bg-[#D4AF37] hover:bg-white text-slate-950 font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition-all">Subscribe</button>
                            </form>
                            <div id="newsletter-msg" class="hidden text-[10px] text-emerald-400 font-bold"></div>
                        </div>
                    </div>

                    <!-- Bottom Bar -->
                    <div class="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px]">
                        <p>&copy; 2026 Kaghan Properties. All Rights Reserved. Domain: <a href="https://kaghanproperties.com" class="text-[#D4AF37] hover:underline">kaghanproperties.com</a></p>
                        
                        <div class="flex items-center gap-4">
                            <a href="admin/index.html" target="_blank" class="text-slate-400 hover:text-[#D4AF37] transition-colors flex items-center gap-1 font-semibold">
                                <i class="fa-solid fa-lock text-[10px]"></i> Staff Login
                            </a>
                            <span>|</span>
                            <div class="flex gap-3 text-sm text-slate-400">
                                <a href="https://facebook.com" target="_blank" class="hover:text-[#D4AF37]"><i class="fa-brands fa-facebook"></i></a>
                                <a href="https://instagram.com" target="_blank" class="hover:text-[#D4AF37]"><i class="fa-brands fa-instagram"></i></a>
                                <a href="https://youtube.com" target="_blank" class="hover:text-[#D4AF37]"><i class="fa-brands fa-youtube"></i></a>
                                <a href="https://wa.me/923340091127" target="_blank" class="hover:text-emerald-400"><i class="fa-brands fa-whatsapp"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        `;

        if (footerContainer.tagName === 'FOOTER') {
            footerContainer.outerHTML = footerHtml;
        } else {
            footerContainer.innerHTML = footerHtml;
        }
    },

    renderFloatingWhatsApp: function() {
        if (document.getElementById('floating-whatsapp-cta')) return;

        const btn = document.createElement('a');
        btn.id = 'floating-whatsapp-cta';
        btn.href = 'https://wa.me/923340091127?text=Hi%20Kaghan%20Properties,%20I%20am%20interested%20in%20property%20consultation.';
        btn.target = '_blank';
        btn.className = 'fixed bottom-6 right-6 z-50 bg-emerald-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform border-2 border-white/20';
        btn.innerHTML = '<i class="fa-brands fa-whatsapp text-3xl"></i>';
        document.body.appendChild(btn);
    },

    updateWishlistBadge: function() {
        const count = (JSON.parse(localStorage.getItem('kaghan_favs') || '[]')).length;
        const badge = document.getElementById('header-wishlist-badge');
        if (badge) badge.innerText = count;
    },

    submitNewsletter: async function(e) {
        e.preventDefault();
        const emailInput = document.getElementById('footer-newsletter-email');
        const msg = document.getElementById('newsletter-msg');
        const email = emailInput.value.trim();

        if (!email) return;

        try {
            if (window.CorporateDB && window.CorporateDB.addSubscriber) {
                await window.CorporateDB.addSubscriber(email);
            } else if (window.KaghanDB) {
                await window.KaghanDB.createLead({
                    name: 'Newsletter Subscriber',
                    email: email,
                    phone: '',
                    message: 'Subscribed to monthly property briefing',
                    sourcePage: window.location.pathname
                });
            }
            if (msg) {
                msg.innerText = "Thank you! You are subscribed to updates.";
                msg.classList.remove('hidden');
            }
            emailInput.value = '';
        } catch (err) {
            console.error("Newsletter submission error:", err);
        }
    }
};

// Auto-initialize shared UI on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.KaghanSharedUI.init();
});
