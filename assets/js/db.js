// Kaghan Properties — 100% Firestore-Driven Database Module
// Zero hardcoded listings, projects, blogs, content, or credentials.
// All data is retrieved live from Firebase Firestore (project: smmp-4b3cc, root collection: kaghan_properties).

const firebaseConfig = {
    apiKey: "AIzaSyBgjU9fzFsfx6-gv4p0WWH77_U5BPk69A0",
    authDomain: "smmp-4b3cc.firebaseapp.com",
    databaseURL: "https://smmp-4b3cc-default-rtdb.firebaseio.com",
    projectId: "smmp-4b3cc",
    storageBucket: "smmp-4b3cc.firebasestorage.app",
    messagingSenderId: "43467456148",
    appId: "1:43467456148:web:368b011abf362791edfe81",
    measurementId: "G-Y6HBHEL742"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
const auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;

// In-memory per-page-load promise cache for read-heavy singleton docs (invalidated on every save)
let _siteSettingsCache = null;
let _siteContentCache = null;

function getSubcollectionRef(subcollectionName) {
    if (!db) return null;
    return db.collection('kaghan_properties').doc('main').collection(subcollectionName);
}

// Media Helpers
function getDriveDirectUrl(input) {
    if (!input) return '';
    if (typeof input === 'object' && input.url) input = input.url;
    if (typeof input !== 'string') return '';
    let fileId = input;
    const matchD = input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const matchId = input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) fileId = matchD[1];
    else if (matchId && matchId[1]) fileId = matchId[1];
    if (fileId && fileId.length > 20 && !fileId.startsWith('http') && !fileId.startsWith('assets/')) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
    return input;
}

function extractYouTubeId(input) {
    if (!input) return '';
    const trimmed = String(input).trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const m = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : '';
}

function getYouTubeEmbedUrl(input) {
    const id = extractYouTubeId(input);
    return id ? `https://www.youtube.com/embed/${id}?rel=0` : '';
}

// Cloudinary Media Upload Service
window.CloudinaryService = {
    cloudName: 'dis1ptaip',
    uploadPreset: 'mubashir',
    uploadUrl: 'https://api.cloudinary.com/v1_1/dis1ptaip/image/upload',

    uploadImage: async (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'mubashir');

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://api.cloudinary.com/v1_1/dis1ptaip/image/upload');

            if (xhr.upload && onProgress) {
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
                };
            }

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve({ success: true, url: data.secure_url, publicId: data.public_id, raw: data });
                    } catch (err) {
                        reject(new Error("Failed to parse Cloudinary response: " + err.message));
                    }
                } else {
                    let errMsg = `Upload failed with status ${xhr.status}`;
                    try {
                        const errData = JSON.parse(xhr.responseText);
                        if (errData.error && errData.error.message) errMsg = errData.error.message;
                    } catch (e) {}
                    reject(new Error(errMsg));
                }
            };

            xhr.onerror = () => reject(new Error("Network error during Cloudinary upload"));
            xhr.send(formData);
        });
    }
};

window.KaghanDB = {
    getDriveDirectUrl,
    getYouTubeEmbedUrl,
    extractYouTubeId,
    uploadImageToCloudinary: window.CloudinaryService.uploadImage,
    cloudinary: window.CloudinaryService,

    AREA_UNITS: [
        { key: "marla", name: "Marla", sqftFactor: 225, label: "Marla" },
        { key: "sqft", name: "Square Feet", sqftFactor: 1, label: "Sq. Ft." },
        { key: "sqyd", name: "Square Yards", sqftFactor: 9, label: "Sq. Yd." },
        { key: "sqm", name: "Square Meters", sqftFactor: 10.76391, label: "Sq. M." },
        { key: "kanal", name: "Kanal", sqftFactor: 4500, label: "Kanal" }
    ],

    formatPriceWithMagnitude: (priceInPKR) => {
        if (window.KaghanSharedUI && window.KaghanSharedUI.formatPrice) {
            return window.KaghanSharedUI.formatPrice(priceInPKR);
        }
        if (!priceInPKR) return 'Call for Price';
        if (priceInPKR >= 10000000) return `PKR ${(priceInPKR / 10000000).toFixed(2).replace(/\.00$/, '')} Crore`;
        if (priceInPKR >= 100000) return `PKR ${(priceInPKR / 100000).toFixed(2).replace(/\.00$/, '')} Lakh`;
        return `PKR ${Number(priceInPKR).toLocaleString()}`;
    },

    convertAreaUnit: (value, fromUnit = 'marla', toUnit = 'marla') => {
        const units = { marla: 225, sqft: 1, sqyd: 9, sqm: 10.76391, kanal: 4500 };
        const val = parseFloat(value) || 0;
        const fromFactor = units[(fromUnit || 'marla').toLowerCase()] || 225;
        const toFactor = units[(toUnit || 'marla').toLowerCase()] || 225;
        return (val * fromFactor) / toFactor;
    },

    // ==================== SITE SETTINGS (Firestore: kaghan_properties/siteSettings) ====================
    getSiteSettings: async (forceRefresh = false) => {
        if (_siteSettingsCache && !forceRefresh) return _siteSettingsCache;
        if (!db) return {};
        try {
            const snap = await db.collection('kaghan_properties').doc('siteSettings').get();
            const data = snap.exists ? snap.data() : {};
            _siteSettingsCache = data || {};
            return _siteSettingsCache;
        } catch (e) {
            console.error("Error fetching siteSettings from Firestore:", e);
            return _siteSettingsCache || {};
        }
    },

    saveSiteSettings: async (settings) => {
        if (!db) throw new Error("Firestore SDK not initialized");
        const payload = {
            ...settings,
            updatedAt: new Date().toISOString()
        };
        await db.collection('kaghan_properties').doc('siteSettings').set(payload, { merge: true });
        _siteSettingsCache = { ...(_siteSettingsCache || {}), ...payload };
        window.dispatchEvent(new CustomEvent('siteSettingsUpdated', { detail: _siteSettingsCache }));
        return { success: true, settings: _siteSettingsCache };
    },

    // ==================== SITE CONTENT & SEO (Firestore: kaghan_properties/siteContent) ====================
    getSiteContent: async (forceRefresh = false) => {
        if (_siteContentCache && !forceRefresh) return _siteContentCache;
        if (!db) return {};
        try {
            const snap = await db.collection('kaghan_properties').doc('siteContent').get();
            const data = snap.exists ? snap.data() : {};
            _siteContentCache = data || {};
            return _siteContentCache;
        } catch (e) {
            console.error("Error fetching siteContent from Firestore:", e);
            return _siteContentCache || {};
        }
    },

    saveSiteContent: async (content) => {
        if (!db) throw new Error("Firestore SDK not initialized");
        const payload = {
            ...content,
            updatedAt: new Date().toISOString()
        };
        await db.collection('kaghan_properties').doc('siteContent').set(payload, { merge: true });
        _siteContentCache = { ...(_siteContentCache || {}), ...payload };
        return { success: true, content: _siteContentCache };
    },

    // ==================== MAINTENANCE MODE (Strictly from Firestore siteSettings) ====================
    getMaintenanceSettings: async () => {
        const settings = await window.KaghanDB.getSiteSettings();
        return (settings && settings.underConstruction) ? settings.underConstruction : { enabled: false };
    },

    setMaintenanceMode: async (enabled, config = {}) => {
        const settings = await window.KaghanDB.getSiteSettings(true);
        const updatedUnder = {
            ...(settings.underConstruction || {}),
            ...config,
            enabled: !!enabled,
            updatedAt: new Date().toISOString()
        };
        await window.KaghanDB.saveSiteSettings({ underConstruction: updatedUnder });
        return { success: true, underConstruction: updatedUnder };
    },

    canUserBypassMaintenance: (settings, user, bypassKey) => {
        const maint = settings && settings.underConstruction;
        if (!maint || !maint.enabled) return { allowed: true, reason: 'maintenance_disabled' };
        if (user && user.role === 'admin') return { allowed: true, reason: 'admin' };
        if (user && user.allowMaintenanceAccess === true) return { allowed: true, reason: 'user_permission' };
        const allowedRoles = Array.isArray(maint.allowedRoles) ? maint.allowedRoles : ['admin'];
        if (user && user.role && allowedRoles.includes(user.role)) return { allowed: true, reason: 'role_allowed' };
        const allowedEmails = Array.isArray(maint.allowedEmails)
            ? maint.allowedEmails.map(e => String(e).toLowerCase().trim())
            : [];
        if (user && user.email && allowedEmails.includes(String(user.email).toLowerCase().trim())) {
            return { allowed: true, reason: 'email_whitelisted' };
        }
        const configuredPasscode = (maint.bypassPasscode || '').trim();
        if (configuredPasscode && bypassKey && String(bypassKey).trim() === configuredPasscode) {
            return { allowed: true, reason: 'passcode' };
        }
        return { allowed: false, reason: 'unauthorized' };
    },

    setMaintenanceBypassKey: (key) => {
        if (!key) return false;
        localStorage.setItem('kaghan_maintenance_bypass', String(key).trim());
        return true;
    },

    clearMaintenanceBypassKey: () => {
        localStorage.removeItem('kaghan_maintenance_bypass');
    },

    getMaintenanceBypassKey: () => {
        return localStorage.getItem('kaghan_maintenance_bypass') || '';
    },

    // ==================== PROJECTS (Firestore: kaghan_properties/main/projects) ====================
    getProjects: async (onlyPublished = false) => {
        if (!db) return [];
        try {
            const snap = await getSubcollectionRef('projects').get();
            let list = [];
            snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            if (onlyPublished) {
                list = list.filter(pr => pr.status !== 'draft');
            }
            return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        } catch (e) {
            console.error("Error getting projects from Firestore:", e);
            return [];
        }
    },

    getProjectBySlugOrId: async (slugOrId) => {
        if (!slugOrId) return null;
        const norm = String(slugOrId).toLowerCase().trim();
        const all = await window.KaghanDB.getProjects(false);
        return all.find(p =>
            (p.slug && String(p.slug).toLowerCase() === norm) ||
            (p.id && String(p.id).toLowerCase() === norm)
        ) || null;
    },

    saveProject: async (project) => {
        if (!db) throw new Error("Firestore SDK not initialized");
        const now = new Date().toISOString();
        const slug = project.slug || (project.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `proj_${Date.now()}`;
        const id = project.id || slug;
        const payload = {
            ...project,
            id,
            slug,
            status: project.status || 'published',
            createdAt: project.createdAt || now,
            updatedAt: now
        };
        await getSubcollectionRef('projects').doc(id).set(payload, { merge: true });
        return { success: true, id, project: payload };
    },

    deleteProject: async (id) => {
        if (!db) throw new Error("Firestore SDK not initialized");
        await getSubcollectionRef('projects').doc(id).delete();
        return true;
    },

    assignListingsToProject: async (projectId, selectedListingIds = []) => {
        const selectedSet = new Set(selectedListingIds);
        const allProps = await window.KaghanDB.getProperties();
        for (const p of allProps) {
            const currentlyIn = (p.projectId === projectId) || (!p.projectId && p.societyId === projectId);
            const shouldBeIn = selectedSet.has(p.id);
            if (shouldBeIn && !currentlyIn) {
                await window.KaghanDB.saveProperty({ ...p, projectId, societyId: projectId });
            } else if (!shouldBeIn && currentlyIn) {
                await window.KaghanDB.saveProperty({ ...p, projectId: '', societyId: p.societyId === projectId ? '' : (p.societyId || '') });
            }
        }
        return { success: true };
    },

    // ==================== PROPERTIES / LISTINGS (Firestore: kaghan_properties/main/properties) ====================
    getProperties: async (filters = {}) => {
        if (!db) return [];
        try {
            const snap = await getSubcollectionRef('properties').get();
            const list = [];
            snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));

            return list.filter(p => {
                if (filters.projectId && p.projectId !== filters.projectId && p.societyId !== filters.projectId) return false;
                if (filters.status && p.status !== filters.status) return false;
                if (filters.type && filters.type !== 'all' && p.type !== filters.type) return false;
                if (filters.purpose && filters.purpose !== 'all' && p.purpose !== filters.purpose) return false;
                if (filters.city && filters.city !== 'all' && p.city && p.city.toLowerCase() !== filters.city.toLowerCase()) return false;
                if (filters.area && filters.area !== 'all' && p.area && !p.area.toLowerCase().includes(filters.area.toLowerCase())) return false;
                if (filters.minPrice && (p.price || 0) < filters.minPrice) return false;
                if (filters.maxPrice && (p.price || 0) > filters.maxPrice) return false;
                return true;
            }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        } catch (e) {
            console.error("Error getting properties from Firestore:", e);
            return [];
        }
    },

    getPropertyBySlugOrId: async (slugOrId) => {
        if (!slugOrId) return null;
        const norm = String(slugOrId).toLowerCase().trim();
        const all = await window.KaghanDB.getProperties();
        return all.find(p =>
            (p.slug && String(p.slug).toLowerCase() === norm) ||
            (p.id && String(p.id).toLowerCase() === norm)
        ) || null;
    },

    saveProperty: async (property) => {
        if (!db) throw new Error("Firestore SDK not initialized");
        const now = new Date().toISOString();
        const id = property.id || property.slug || `prop_${Date.now()}`;
        const slug = property.slug || id;
        const payload = {
            ...property,
            id,
            slug,
            status: property.status || 'published',
            createdAt: property.createdAt || now,
            updatedAt: now,
            publishedAt: property.publishedAt || (property.status === 'published' ? now : '')
        };
        await getSubcollectionRef('properties').doc(id).set(payload, { merge: true });
        return { success: true, id, property: payload };
    },

    deleteProperty: async (id) => {
        if (!db) throw new Error("Firestore SDK not initialized");
        await getSubcollectionRef('properties').doc(id).delete();
        return true;
    },

    // ==================== LEADS (Firestore: kaghan_properties/main/leads) ====================
    getLeads: async () => {
        if (!db) return [];
        try {
            const snap = await getSubcollectionRef('leads').get();
            const list = [];
            snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        } catch (e) {
            console.error("Error getting leads from Firestore:", e);
            return [];
        }
    },

    createLead: async (lead) => {
        if (!db) throw new Error("Firestore SDK not initialized");
        const now = new Date().toISOString();
        const leadDoc = {
            id: `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: lead.name || '',
            email: lead.email ? lead.email.toLowerCase().trim() : '',
            phone: lead.phone || '',
            message: lead.message || '',
            sourcePage: lead.sourcePage || window.location.pathname,
            propertyId: lead.propertyId || '',
            propertyTitle: lead.propertyTitle || '',
            status: lead.status || 'new',
            notes: lead.notes || [],
            createdAt: now,
            updatedAt: now
        };
        await getSubcollectionRef('leads').doc(leadDoc.id).set(leadDoc);
        return { success: true, id: leadDoc.id };
    },

    updateLeadStatus: async (id, status) => {
        if (!db) throw new Error("Firestore SDK not initialized");
        await getSubcollectionRef('leads').doc(id).update({ status, updatedAt: new Date().toISOString() });
        return true;
    },

    deleteLead: async (id) => {
        if (!db) throw new Error("Firestore SDK not initialized");
        await getSubcollectionRef('leads').doc(id).delete();
        return true;
    },

    addLeadNote: async (id, noteText, authorName = "Admin") => {
        if (!db) throw new Error("Firestore SDK not initialized");
        const note = { text: noteText, createdAt: new Date().toISOString(), createdBy: authorName };
        await getSubcollectionRef('leads').doc(id).update({
            notes: firebase.firestore.FieldValue.arrayUnion(note),
            updatedAt: new Date().toISOString()
        });
        return true;
    },

    // ==================== BLOG POSTS (Firestore: kaghan_properties/main/blogPosts) ====================
    getBlogPosts: async (statusOnly = 'published') => {
        if (!db) return [];
        try {
            const snap = await getSubcollectionRef('blogPosts').get();
            const list = [];
            snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            return list
                .filter(b => !statusOnly || b.status === statusOnly)
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        } catch (e) {
            console.error("Error getting blog posts from Firestore:", e);
            return [];
        }
    },

    saveBlogPost: async (post) => {
        if (!db) throw new Error("Firestore SDK not initialized");
        const now = new Date().toISOString();
        const id = post.id || post.slug || `blog_${Date.now()}`;
        const payload = {
            ...post,
            id,
            slug: post.slug || id,
            status: post.status || 'published',
            createdAt: post.createdAt || now,
            updatedAt: now
        };
        await getSubcollectionRef('blogPosts').doc(id).set(payload, { merge: true });
        return { success: true, id };
    },

    deleteBlogPost: async (id) => {
        if (!db) throw new Error("Firestore SDK not initialized");
        await getSubcollectionRef('blogPosts').doc(id).delete();
        return true;
    },

    // ==================== CATEGORIES / CITIES / SOCIETIES (Pure Firestore) ====================
    getCategories: async (onlyActive = false) => {
        if (!db) return [];
        try {
            const snap = await getSubcollectionRef('categories').get();
            const list = [];
            snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            return list
                .filter(c => !onlyActive || c.isActive !== false)
                .sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
        } catch (e) {
            console.error("Error getting categories from Firestore:", e);
            return [];
        }
    },

    getCities: async (onlyActive = false) => {
        if (!db) return [];
        try {
            const snap = await getSubcollectionRef('cities').get();
            const list = [];
            snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            return list
                .filter(c => !onlyActive || c.isActive !== false)
                .sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
        } catch (e) {
            console.error("Error getting cities from Firestore:", e);
            return [];
        }
    },

    getSocieties: async (onlyActive = false) => {
        if (!db) return [];
        try {
            const snap = await getSubcollectionRef('societies').get();
            const list = [];
            snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            return list
                .filter(s => !onlyActive || s.isActive !== false)
                .sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
        } catch (e) {
            console.error("Error getting societies from Firestore:", e);
            return [];
        }
    },

    // ==================== USERS & AUTH (Firebase Auth + Firestore users collection) ====================
    getUsers: async () => {
        if (!db) return [];
        try {
            const list = [];
            const seen = new Set();
            const subSnap = await getSubcollectionRef('users').get();
            subSnap.forEach(doc => {
                const d = { id: doc.id, ...doc.data() };
                list.push(d);
                seen.add(doc.id);
            });
            try {
                const rootSnap = await db.collection('users').get();
                rootSnap.forEach(doc => {
                    if (!seen.has(doc.id)) list.push({ id: doc.id, ...doc.data() });
                });
            } catch (e) {}
            return list;
        } catch (e) {
            console.error("Error getting users from Firestore:", e);
            return [];
        }
    },

    getUserByUidOrEmail: async (identifier) => {
        if (!identifier) return null;
        const norm = String(identifier).toLowerCase().trim();
        const users = await window.KaghanDB.getUsers();
        return users.find(u =>
            (u.uid && String(u.uid).toLowerCase() === norm) ||
            (u.email && String(u.email).toLowerCase() === norm)
        ) || null;
    },

    saveUser: async (user) => {
        if (!db) throw new Error("Firestore SDK not initialized");
        const now = new Date().toISOString();
        const id = user.id || `user_${Date.now()}`;
        const payload = { ...user, id, createdAt: user.createdAt || now, updatedAt: now };
        await getSubcollectionRef('users').doc(id).set(payload, { merge: true });
        return { success: true, id, user: payload };
    },

    deleteUser: async (id) => {
        if (!db) throw new Error("Firestore SDK not initialized");
        await getSubcollectionRef('users').doc(id).delete();
        return true;
    },

    login: async (email, password) => {
        const normEmail = String(email || '').toLowerCase().trim();
        const pass = String(password || '').trim();
        if (!normEmail || !pass) {
            return { success: false, message: 'Email and password are required.' };
        }

        // 1. Check live users stored in Firestore first (avoids noisy Firebase Auth 400 when using Firestore-managed accounts)
        try {
            const users = await window.KaghanDB.getUsers();
            const matchedUser = users.find(u => u.email && String(u.email).toLowerCase().trim() === normEmail);
            if (matchedUser && matchedUser.password && String(matchedUser.password).trim() === pass) {
                const session = {
                    uid: matchedUser.uid || matchedUser.id,
                    id: matchedUser.id || matchedUser.uid,
                    name: matchedUser.name || matchedUser.email,
                    email: normEmail,
                    role: matchedUser.role || 'admin',
                    photoUrl: matchedUser.photoUrl || '',
                    expiry: Date.now() + (8 * 60 * 60 * 1000)
                };
                localStorage.setItem('kaghan_corp_session', JSON.stringify(session));
                return { success: true, session };
            }
        } catch (dbErr) {
            console.warn("Error checking Firestore users collection:", dbErr);
        }

        // 2. Try Firebase Authentication
        if (auth) {
            try {
                const cred = await auth.signInWithEmailAndPassword(normEmail, pass);
                const userDoc = await window.KaghanDB.getUserByUidOrEmail(cred.user.uid) || await window.KaghanDB.getUserByUidOrEmail(normEmail);
                const session = {
                    uid: cred.user.uid,
                    id: userDoc ? userDoc.id : cred.user.uid,
                    name: userDoc ? userDoc.name : cred.user.email,
                    email: normEmail,
                    role: userDoc ? userDoc.role : 'admin',
                    photoUrl: userDoc ? userDoc.photoUrl : '',
                    expiry: Date.now() + (8 * 60 * 60 * 1000)
                };
                localStorage.setItem('kaghan_corp_session', JSON.stringify(session));
                return { success: true, session };
            } catch (authErr) {
                console.warn("Firebase Auth sign-in rejected:", authErr.code || authErr.message);
            }
        }

        return { success: false, message: 'Invalid email or password.' };
    },

    getCurrentUser: () => {
        const data = localStorage.getItem('kaghan_corp_session');
        if (!data) return null;
        try {
            const session = JSON.parse(data);
            if (Date.now() > session.expiry) {
                localStorage.removeItem('kaghan_corp_session');
                return null;
            }
            return session;
        } catch (e) {
            return null;
        }
    },

    logout: async () => {
        if (auth) {
            try { await auth.signOut(); } catch (e) {}
        }
        localStorage.removeItem('kaghan_corp_session');
        window.location.reload();
    }
};

// Backward Compatibility Aliases
window.CorporateDB = {
    ...window.KaghanDB,
    addInquiry: window.KaghanDB.createLead,
    getInquiries: window.KaghanDB.getLeads,
    updateInquiryStatus: window.KaghanDB.updateLeadStatus,
    getListings: window.KaghanDB.getProperties,
    addListing: window.KaghanDB.saveProperty,
    deleteListing: window.KaghanDB.deleteProperty,
    updateListing: window.KaghanDB.saveProperty,
    getBlogs: () => window.KaghanDB.getBlogPosts('published'),
    addBlog: window.KaghanDB.saveBlogPost,
    addSubscriber: async (email) => {
        await window.KaghanDB.createLead({
            name: 'Newsletter Subscriber',
            email,
            phone: '',
            message: 'Subscribed to newsletter updates',
            sourcePage: '/newsletter'
        });
        return { success: true };
    }
};
