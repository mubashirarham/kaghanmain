// Kaghan Properties - Advanced CRM & Lead Management Module

window.AdminCRM = {
    viewMode: 'table', // 'table' or 'kanban'

    toggleViewMode: function(mode) {
        this.viewMode = mode;
        const tableView = document.getElementById('leads-table-container');
        const kanbanView = document.getElementById('leads-kanban-container');
        const btnTable = document.getElementById('btn-view-table');
        const btnKanban = document.getElementById('btn-view-kanban');

        if (mode === 'kanban') {
            if (tableView) tableView.classList.add('hidden');
            if (kanbanView) kanbanView.classList.remove('hidden');
            if (btnTable) btnTable.className = "px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold";
            if (btnKanban) btnKanban.className = "px-3 py-1.5 bg-[#D4AF37] text-slate-950 rounded-lg text-xs font-bold shadow-md";
            this.renderKanbanBoard();
        } else {
            if (kanbanView) kanbanView.classList.add('hidden');
            if (tableView) tableView.classList.remove('hidden');
            if (btnTable) btnTable.className = "px-3 py-1.5 bg-[#D4AF37] text-slate-950 rounded-lg text-xs font-bold shadow-md";
            if (btnKanban) btnKanban.className = "px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold";
            window.renderLeadsTable();
        }
    },

    renderKanbanBoard: async function() {
        const leads = await window.KaghanDB.getLeads();
        const columns = ['new', 'contacted', 'qualified', 'closed', 'lost'];
        
        columns.forEach(col => {
            const container = document.getElementById(`kanban-col-${col}`);
            const badge = document.getElementById(`kanban-count-${col}`);
            if (!container) return;

            const colLeads = leads.filter(l => (l.status || 'new') === col);
            if (badge) badge.innerText = colLeads.length;

            if (colLeads.length === 0) {
                container.innerHTML = `<div class="text-slate-600 text-xs p-4 text-center border border-dashed border-slate-800 rounded-xl">Empty Column</div>`;
            } else {
                container.innerHTML = colLeads.map(l => {
                    const score = this.calculateLeadScore(l);
                    return `
                        <div class="bg-slate-900 border border-slate-800 hover:border-[#D4AF37] rounded-xl p-4 space-y-2 shadow-md transition-all">
                            <div class="flex justify-between items-start">
                                <strong class="text-white text-xs font-bold truncate max-w-[140px]">${l.name}</strong>
                                <span class="text-[9px] font-extrabold px-2 py-0.5 rounded-full ${score > 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}">Score: ${score}</span>
                            </div>
                            <div class="text-[11px] text-slate-400 font-medium truncate"><i class="fa-solid fa-phone text-[#D4AF37] mr-1"></i> ${l.phone}</div>
                            <div class="text-[10px] text-slate-500 truncate">${l.propertyTitle || 'General Inquiry'}</div>
                            
                            <div class="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px]">
                                <select onchange="window.AdminCRM.moveLeadStatus('${l.id}', this.value)" class="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 focus:outline-none">
                                    <option value="new" ${col==='new'?'selected':''}>Move: New</option>
                                    <option value="contacted" ${col==='contacted'?'selected':''}>Move: Contacted</option>
                                    <option value="qualified" ${col==='qualified'?'selected':''}>Move: Qualified</option>
                                    <option value="closed" ${col==='closed'?'selected':''}>Move: Closed</option>
                                    <option value="lost" ${col==='lost'?'selected':''}>Move: Lost</option>
                                </select>
                                <button onclick="window.openLeadModal('${l.id}')" class="text-[#D4AF37] hover:underline font-bold">Details</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        });
    },

    moveLeadStatus: async function(id, newStatus) {
        await window.KaghanDB.updateLeadStatus(id, newStatus);
        if (window.AdminTools) window.AdminTools.logAudit(`Lead ${id} moved to status: ${newStatus}`);
        this.renderKanbanBoard();
        window.renderOverview();
    },

    calculateLeadScore: function(lead) {
        let score = 50;
        if (lead.phone && lead.phone.length >= 10) score += 20;
        if (lead.email && lead.email.includes('@')) score += 15;
        if (lead.propertyId) score += 15;
        if (lead.message && lead.message.length > 30) score += 10;
        return Math.min(score, 100);
    },

    generateWhatsAppLink: function(phone, leadName, propertyTitle, templateType = 'followup') {
        const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
        let msg = '';

        if (templateType === 'followup') {
            msg = `Hi ${leadName}, thank you for reaching out to Kaghan Properties. Regarding your interest in "${propertyTitle || 'our listings'}", when would be a good time for a brief call?`;
        } else if (templateType === 'viewing') {
            msg = `Hello ${leadName}, we have scheduled property viewings for "${propertyTitle || 'our Islamabad project'}" this week. Would you like to reserve an exclusive slot?`;
        } else if (templateType === 'docs') {
            msg = `Hi ${leadName}, herewith legal floor plans, NOCs, and payment feasibility brochures for "${propertyTitle || 'Kaghan Properties'}": https://kaghanproperties.com`;
        }

        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    },

    exportLeadsToCSV: async function() {
        const leads = await window.KaghanDB.getLeads();
        if (leads.length === 0) {
            alert("No leads data available to export.");
            return;
        }

        const headers = ["ID", "Name", "Phone", "Email", "Property Title", "Source Page", "Status", "Created At"];
        const rows = leads.map(l => [
            `"${l.id || ''}"`,
            `"${(l.name || '').replace(/"/g, '""')}"`,
            `"${(l.phone || '').replace(/"/g, '""')}"`,
            `"${(l.email || '').replace(/"/g, '""')}"`,
            `"${(l.propertyTitle || '').replace(/"/g, '""')}"`,
            `"${(l.sourcePage || '').replace(/"/g, '""')}"`,
            `"${l.status || 'new'}"`,
            `"${l.createdAt || ''}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `kaghan_leads_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (window.AdminTools) window.AdminTools.logAudit("Exported leads to CSV");
    },

    exportPropertiesToCSV: async function() {
        const props = await window.KaghanDB.getProperties();
        if (props.length === 0) {
            alert("No properties data available to export.");
            return;
        }

        const headers = ["ID", "Title", "Type", "Purpose", "Status", "Price PKR", "City", "Area", "Bedrooms", "Bathrooms", "Size"];
        const rows = props.map(p => [
            `"${p.id || ''}"`,
            `"${(p.title || '').replace(/"/g, '""')}"`,
            `"${p.type || ''}"`,
            `"${p.purpose || ''}"`,
            `"${p.status || ''}"`,
            p.price || 0,
            `"${(p.city || '').replace(/"/g, '""')}"`,
            `"${(p.area || '').replace(/"/g, '""')}"`,
            p.bedrooms || 0,
            p.bathrooms || 0,
            `"${p.size || 0} ${p.sizeUnit || 'marla'}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `kaghan_properties_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (window.AdminTools) window.AdminTools.logAudit("Exported properties to CSV");
    }
};
