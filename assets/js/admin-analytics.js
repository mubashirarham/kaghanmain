// Kaghan Properties - Admin Panel Visual Analytics Module (Chart.js Integration)

window.AdminAnalytics = {
    leadChart: null,
    propertyChart: null,

    initOverviewCharts: async function() {
        if (typeof Chart === 'undefined') return;

        const leads = await window.KaghanDB.getLeads();
        const properties = await window.KaghanDB.getProperties();

        this.renderLeadStatusChart(leads);
        this.renderPropertyTypeChart(properties);
    },

    renderLeadStatusChart: function(leads) {
        const ctx = document.getElementById('chart-lead-status');
        if (!ctx) return;

        const counts = { new: 0, contacted: 0, qualified: 0, closed: 0, lost: 0 };
        leads.forEach(l => {
            const status = (l.status || 'new').toLowerCase();
            if (counts[status] !== undefined) counts[status]++;
        });

        if (this.leadChart) this.leadChart.destroy();

        this.leadChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['New Inquiries', 'Contacted', 'Qualified', 'Closed Deals', 'Lost'],
                datasets: [{
                    data: [counts.new, counts.contacted, counts.qualified, counts.closed, counts.lost],
                    backgroundColor: ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444'],
                    borderColor: '#0F172A',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94A3B8', font: { size: 10 } }
                    }
                }
            }
        });
    },

    renderPropertyTypeChart: function(properties) {
        const ctx = document.getElementById('chart-property-type');
        if (!ctx) return;

        const counts = { house: 0, plot: 0, apartment: 0, commercial: 0, office: 0, shop: 0 };
        properties.forEach(p => {
            const type = (p.type || 'house').toLowerCase();
            if (counts[type] !== undefined) counts[type]++;
        });

        if (this.propertyChart) this.propertyChart.destroy();

        this.propertyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['House/Villa', 'Plot', 'Apartment', 'Commercial', 'Office', 'Shop'],
                datasets: [{
                    label: 'Listings Count',
                    data: [counts.house, counts.plot, counts.apartment, counts.commercial, counts.office, counts.shop],
                    backgroundColor: '#D4AF37',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#94A3B8', font: { size: 10 } }, grid: { display: false } },
                    y: { ticks: { color: '#94A3B8', font: { size: 10 }, stepSize: 1 }, grid: { color: '#1E293B' } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
};
