// Kaghan Properties - Admin System Tools & Data Backup Module

window.AdminTools = {
    logAudit: function(actionText) {
        const logs = JSON.parse(localStorage.getItem('kaghan_audit_logs') || '[]');
        const user = window.KaghanDB.getCurrentUser();
        const entry = {
            timestamp: new Date().toISOString(),
            user: user ? user.name : 'System',
            action: actionText
        };
        logs.unshift(entry);
        localStorage.setItem('kaghan_audit_logs', JSON.stringify(logs.slice(0, 100))); // Keep last 100
        this.renderAuditLogsTable();
    },

    getAuditLogs: function() {
        return JSON.parse(localStorage.getItem('kaghan_audit_logs') || '[]');
    },

    renderAuditLogsTable: function() {
        const container = document.getElementById('audit-logs-container');
        if (!container) return;

        const logs = this.getAuditLogs();
        if (logs.length === 0) {
            container.innerHTML = `<div class="text-slate-500 text-xs py-4 text-center">No system actions logged yet.</div>`;
            return;
        }

        container.innerHTML = logs.map(l => `
            <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <div>
                    <span class="font-bold text-white">${l.action}</span>
                    <div class="text-[10px] text-slate-500 mt-0.5">By ${l.user}</div>
                </div>
                <span class="text-[10px] text-[#D4AF37] font-semibold">${new Date(l.timestamp).toLocaleTimeString()}</span>
            </div>
        `).join('');
    },

    exportFullDatabaseJSON: async function() {
        try {
            const properties = await window.KaghanDB.getProperties();
            const leads = await window.KaghanDB.getLeads();
            const societies = await window.KaghanDB.getSocieties();
            const users = await window.KaghanDB.getUsers();
            const blogPosts = await window.KaghanDB.getBlogPosts('');
            const siteSettings = await window.KaghanDB.getSiteSettings();

            const fullBackup = {
                version: "1.0",
                exportedAt: new Date().toISOString(),
                database: "kaghan_properties",
                data: {
                    properties,
                    leads,
                    societies,
                    users,
                    blogPosts,
                    siteSettings
                }
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `kaghan_firestore_backup_${new Date().toISOString().slice(0,10)}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            this.logAudit("Downloaded full JSON database backup");
            alert("Database backup JSON downloaded successfully!");
        } catch (e) {
            console.error("Backup failed:", e);
            alert("Database backup failed: " + e.message);
        }
    },

    importFullDatabaseJSON: function(fileInput) {
        const file = fileInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                if (!backup.data) throw new Error("Invalid backup format");

                const d = backup.data;
                if (d.properties) for (const p of d.properties) await window.KaghanDB.saveProperty(p);
                if (d.societies) for (const s of d.societies) await window.KaghanDB.saveSociety(s);
                if (d.users) for (const u of d.users) await window.KaghanDB.saveUser(u);
                if (d.blogPosts) for (const b of d.blogPosts) await window.KaghanDB.saveBlogPost(b);
                if (d.siteSettings) await window.KaghanDB.saveSiteSettings(d.siteSettings);

                this.logAudit("Restored database from JSON backup");
                alert("Database successfully restored from JSON file!");
                window.location.reload();
            } catch (err) {
                alert("Failed to restore database: " + err.message);
            }
        };
        reader.readAsText(file);
    }
};
