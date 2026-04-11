document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Scroll Navbar Effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('glass-dark', 'py-4');
            navbar.classList.remove('py-6');
            navbar.classList.add('text-white');
            navbar.classList.remove('text-slate-800');
        } else {
            navbar.classList.remove('glass-dark', 'py-4');
            navbar.classList.add('py-6');
            navbar.classList.remove('text-white');
            navbar.classList.add('text-slate-800');
        }
    });

    // Intersection Observer for Animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Accordion Logic
    document.querySelectorAll('.accordion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.parentElement;
            parent.classList.toggle('accordion-active');
        });
    });

    // Simple ROI Calculator Logic (UI only for now)
    const calcBtn = document.getElementById('calculate-roi');
    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
            const amount = document.getElementById('invest-amount').value;
            const years = document.getElementById('invest-years').value;
            const resultDiv = document.getElementById('roi-result');
            
            if (amount && years) {
                const profit = amount * 0.25 * years; // Mock 25% annual growth
                resultDiv.innerHTML = `Estimated Profit: <span class="text-gold font-bold">PKR ${profit.toLocaleString()}</span>`;
                resultDiv.classList.remove('hidden');
            }
        });
    }

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});
