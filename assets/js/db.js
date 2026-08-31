// Kaghan Properties - Firestore Database and Shared Module
// Manages Firestore top-level collection 'kaghan_properties' and subcollections:
// users, properties, leads, societies, blogPosts, siteSettings/main

const firebaseConfig = {
    apiKey: "AIzaSyBbyT7-9j5S3yOC9tFa385RLiZSwCERj7s",
    authDomain: "kaghan-properties.firebaseapp.com",
    projectId: "kaghan-properties",
    storageBucket: "kaghan-properties.firebasestorage.app",
    messagingSenderId: "677611816596",
    appId: "1:677611816596:web:56eb2d2d61ea4156c7d681",
    measurementId: "G-E0P38M56SG"
};

// Initialize Firebase App & Services if needed
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
const auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;

// Helpers for Media Storage (Google Drive & YouTube)
function getDriveDirectUrl(input) {
    if (!input) return 'assets/images/bahria-villa.png';
    if (typeof input === 'object' && input.url) input = input.url;
    if (typeof input !== 'string') return 'assets/images/bahria-villa.png';
    
    // Extract file ID if Google Drive link or ID
    let fileId = input;
    const matchD = input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const matchId = input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) {
        fileId = matchD[1];
    } else if (matchId && matchId[1]) {
        fileId = matchId[1];
    }
    
    if (fileId && fileId.length > 20 && !fileId.startsWith('http') && !fileId.startsWith('assets/')) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
    return input;
}

function getYouTubeEmbedUrl(input) {
    if (!input) return '';
    let videoId = input;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = input.match(regExp);
    if (match && match[2].length === 11) {
        videoId = match[2];
    }
    return `https://www.youtube.com/embed/${videoId}`;
}

function extractYouTubeId(input) {
    if (!input) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = input.match(regExp);
    if (match && match[2].length === 11) {
        return match[2];
    }
    return input;
}

// Cloudinary CDN Service for Kaghan Properties
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
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        onProgress(percent);
                    }
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

// Initial Data Seeding for Firestore 'kaghan_properties'
const DEFAULT_SOCIETIES = [
    {
        id: "dha-islamabad",
        name: "DHA Islamabad",
        slug: "dha-islamabad",
        type: "society",
        city: "Islamabad",
        description: "Defence Housing Authority Islamabad offers world-class residential and commercial opportunities with top-tier security, parks, and infrastructure.",
        amenities: ["Security", "Parks", "Schools", "Hospitals", "Commercial Hubs"],
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3324.5!2d73.09!3d33.55!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1",
        coordinates: { lat: 33.55, lng: 73.09 },
        introVideoId: "dQw4w9WgXcQ",
        documentsFolderUrl: "https://drive.google.com",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "bahria-town-islamabad",
        name: "Bahria Town Islamabad",
        slug: "bahria-town-islamabad",
        type: "society",
        city: "Islamabad",
        description: "Bahria Town & Bahria Enclave offer luxury living with 24/7 power backup, gated security, modern shopping arcades, and international standards.",
        amenities: ["24/7 Security", "Gated Entry", "Shopping Malls", "Golf Club", "Parks"],
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3319.467824128522!2d73.1932!3d33.6669",
        coordinates: { lat: 33.6669, lng: 73.1932 },
        introVideoId: "dQw4w9WgXcQ",
        documentsFolderUrl: "https://drive.google.com",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "g11-sector-islamabad",
        name: "CDA Sector G-11",
        slug: "g11-sector-islamabad",
        type: "sector",
        city: "Islamabad",
        description: "Prime CDA sector featuring 29 Mideast Plaza, executive corporate offices, and central access to Kashmir Highway.",
        amenities: ["CDA Water Supply", "Commercial Markaz", "Metro Access", "Schools"],
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3320.1!2d72.99!3d33.67",
        coordinates: { lat: 33.67, lng: 72.99 },
        introVideoId: "",
        documentsFolderUrl: "",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "nathia-gali-kaghan",
        name: "Nathia Gali & Kaghan Valley",
        slug: "nathia-gali-kaghan",
        type: "scheme",
        city: "Kaghan / Galyat",
        description: "Pine valley resorts, alpine smart chalets, and mountain retreats in Galyat and Kaghan Valley.",
        amenities: ["Mountain Views", "Alpine Climate", "Resort Facilities", "Parking"],
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3305.5!2d73.38!3d34.07",
        coordinates: { lat: 34.07, lng: 73.38 },
        introVideoId: "",
        documentsFolderUrl: "",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const DEFAULT_PROPERTIES = [
    {
        id: "islamabad-dha-phase2-house-123",
        title: "3 Bedroom Modern House in DHA Phase 2",
        slug: "islamabad-dha-phase2-house-123",
        type: "house",
        purpose: "sale",
        status: "published",
        city: "Islamabad",
        area: "DHA Islamabad",
        sector: "Phase 2",
        address: "Street 5, House 12",
        landmark: "Near Central Park",
        coordinates: { lat: 33.55, lng: 73.09 },
        price: 45000000,
        currency: "PKR",
        size: 10,
        sizeUnit: "marla",
        bedrooms: 3,
        bathrooms: 4,
        floors: 2,
        facing: "North",
        yearBuilt: 2023,
        parkingSpaces: 2,
        amenities: ["security", "elevator", "generator", "park", "gated"],
        images: [
            { driveFileId: "1abc123", url: "assets/images/bahria-villa.png", caption: "Front View", isPrimary: true }
        ],
        videos: [
            { platform: "youtube", videoId: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Property Tour", type: "property_tour" }
        ],
        documents: [
            { driveFileId: "1xyz789", url: "https://drive.google.com", title: "Floor Plan", type: "floor_plan" }
        ],
        agentId: "user_001",
        agentName: "Ali Khan",
        agentPhone: "+923340091127",
        description: `<h4>Executive Designer Residence in DHA Islamabad Phase 2</h4>
<p>Kaghan Properties is pleased to present this custom-built 10 Marla designer house nestled in a prime, peaceful boulevard of DHA Phase 2 Islamabad. Featuring architectural symmetry, double-glazed Italian tempered glass elevations, and premium imported marble flooring.</p>
<h5>Key Features & Layout:</h5>
<ul>
    <li><strong>3 Executive Master Suites</strong> with attached Spanish-tile ensuites and custom walk-in closets.</li>
    <li><strong>Designer Chef's Kitchen</strong> equipped with German hardware, granite countertops, and grease extractor hood.</li>
    <li><strong>Expansive Sunlit Lounge</strong> and formal drawing/dining area with recessed warm ambient lighting.</li>
    <li><strong>Dedicated Rooftop Terrace</strong> with panoramic Margalla foothill view and open barbeque deck.</li>
    <li><strong>2 Covered Parking Spaces</strong> with automated sliding gate system and 24/7 CCTV surveillance integration.</li>
</ul>
<p>Direct access to G.T. Road, Islamabad Expressway, and Jacaranda Family Club. Ready for immediate handover with clear titles.</p>`,
        metaTitle: "3 Bedroom House in DHA Phase 2 – Kaghan Properties",
        metaDescription: "Spacious 3 bedroom house for sale in DHA Islamabad Phase 2 with modern interior design.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "mideast-plaza-g11-commercial-office",
        title: "Executive Corporate Office in 29 Mideast Plaza",
        slug: "mideast-plaza-g11-commercial-office",
        type: "office",
        purpose: "sale",
        status: "published",
        city: "Islamabad",
        area: "CDA Sector G-11",
        sector: "G-11 Markaz",
        address: "Plot 29, Markaz G-11",
        landmark: "Near Metro Station",
        coordinates: { lat: 33.67, lng: 72.99 },
        price: 18500000,
        currency: "PKR",
        size: 5,
        sizeUnit: "marla",
        bedrooms: 0,
        bathrooms: 2,
        floors: 4,
        facing: "East",
        yearBuilt: 2024,
        parkingSpaces: 4,
        amenities: ["elevator", "generator", "security", "parking"],
        images: [
            { driveFileId: "1mideast", url: "assets/images/mideast-view1.png", caption: "Plaza View", isPrimary: true }
        ],
        videos: [
            { platform: "youtube", videoId: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Plaza Tour", type: "property_tour" }
        ],
        documents: [],
        agentId: "user_001",
        agentName: "Ali Khan",
        agentPhone: "+923340091127",
        description: `<h4>Prime Commercial Office Suite at 29 Mideast Plaza</h4>
<p>Strategically situated in the vibrant hub of <strong>G-11 Markaz Islamabad</strong>, 29 Mideast Plaza is engineered for multinational corporations, software technology companies, and premier consultancy firms seeking a prestigious corporate address.</p>
<h5>Commercial Highlights:</h5>
<ul>
    <li><strong>High-Speed Smart Elevators</strong> with biometric access control.</li>
    <li><strong>24/7 Dedicated Power Backup</strong> via synchronized Caterpillar diesel generators.</li>
    <li><strong>Central Fire Suppression System</strong> and 24/7 security guard control room.</li>
    <li><strong>Underground Reserved Parking</strong> for executive staff and visitors.</li>
</ul>
<p>Available on flexible 3-year installment schedules with high forecasted rental yield (8-10% ROI annual).</p>`,
        metaTitle: "Executive Office in 29 Mideast Plaza G-11 Islamabad",
        metaDescription: "Premium office spaces in G-11 Markaz with flexible 3-year installment plans.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "azan-arcade-bahria-apartment",
        title: "2 Bedroom Luxury Apartment in Azan Arcade",
        slug: "azan-arcade-bahria-apartment",
        type: "apartment",
        purpose: "sale",
        status: "published",
        city: "Islamabad",
        area: "Bahria Town Islamabad",
        sector: "Sector C, Bahria Enclave",
        address: "Main Commercial Boulevard, Sector C",
        landmark: "Next to Civic Center",
        coordinates: { lat: 33.6669, lng: 73.1932 },
        price: 12500000,
        currency: "PKR",
        size: 4,
        sizeUnit: "marla",
        bedrooms: 2,
        bathrooms: 2,
        floors: 1,
        facing: "Corner",
        yearBuilt: 2024,
        parkingSpaces: 1,
        amenities: ["elevator", "security", "gated"],
        images: [
            { driveFileId: "1azan", url: "assets/images/azan-arcade.png", caption: "Building Elevation", isPrimary: true }
        ],
        videos: [],
        documents: [],
        agentId: "user_001",
        agentName: "Ali Khan",
        agentPhone: "+923340091127",
        description: `<h4>Modern 2-Bedroom Luxury Suite at Azan Arcade</h4>
<p>Experience boutique urban living in <strong>Sector C, Bahria Enclave Islamabad</strong>. Azan Arcade blends residential comfort with commercial convenience, surrounded by landscaped parks and hill views.</p>
<h5>Suite Specifications:</h5>
<ul>
    <li><strong>2 Master Bedrooms</strong> with imported European bathroom fixtures.</li>
    <li><strong>Open American Style Kitchen</strong> with premium acrylic cabinets.</li>
    <li><strong>Private Balcony</strong> offering unobstructed hillside views.</li>
    <li><strong>Dedicated Utilities</strong> with uninterrupted Bahria power, gas, and water supply.</li>
</ul>
<p>Ideal for families or high-yield vacation rental investments.</p>`,
        metaTitle: "2 Bedroom Apartment in Azan Arcade Bahria Enclave",
        metaDescription: "Luxury residential suites in Bahria Enclave Sector C Islamabad.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    }
];

const DEFAULT_USERS = [
    {
        id: "user_001",
        uid: "usr_admin_default",
        name: "Ali Khan",
        email: "ali@kaghanproperties.com",
        phone: "+923340091127",
        role: "admin",
        photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80",
        specializedAreas: ["DHA Islamabad", "Bahria Town", "CDA Sector G-11"],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "user_002",
        uid: "usr_agent_default",
        name: "Tanzil Minhas",
        email: "tanzilminhas@kaghanproperties.com",
        phone: "+923340091127",
        role: "agent",
        photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
        specializedAreas: ["Bahria Enclave", "Nathia Gali"],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const DEFAULT_SITE_SETTINGS = {
    siteName: "Kaghan Properties",
    domain: "kaghanproperties.com",
    logoUrl: "assets/images/logo.png",
    faviconUrl: "assets/images/logo.png",
    contact: {
        phone: "+923340091127",
        email: "info@kaghanproperties.com",
        address: "Ground Floor, Anjum Plaza, Near TCS Bahria Enclave / Jinnah Avenue New Mall, Islamabad, Pakistan",
        googleMapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3319.467824128522!2d73.1932!3d33.6669!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDQwJzAwLjgiTiA3M8KwMTEnMzUuNSJF!5e0!3m2!1sen!2spk!4v1700000000000!5m2!1sen!2spk"
    },
    social: {
        facebook: "https://facebook.com/kaghanproperties",
        instagram: "https://instagram.com/kaghanproperties",
        youtube: "https://youtube.com/@kaghanproperties"
    },
    seoDefaults: {
        defaultMetaTitleTemplate: "{pageTitle} – Kaghan Properties",
        defaultMetaDescription: "Find trusted property listings in Islamabad and Kaghan Valley with Kaghan Properties."
    },
    features: {
        showBlog: true,
        showWhatsAppButton: true
    },
    updatedAt: new Date().toISOString()
};

// Top-Level Collection Helper
function getSubcollectionRef(subcollectionName) {
    if (!db) return null;
    // Main target structure: kaghan_properties/{subcollectionName}
    // Using root doc container 'main' so Firestore paths resolve cleanly to kaghan_properties/main/{subcollectionName}
    return db.collection('kaghan_properties').doc('main').collection(subcollectionName);
}

// In-memory local fallback store if Firebase offline/connecting
let localStore = {
    users: [...DEFAULT_USERS],
    properties: [...DEFAULT_PROPERTIES],
    leads: [],
    societies: [...DEFAULT_SOCIETIES],
    blogPosts: [
        {
            id: "market-update-2026",
            title: "Islamabad Property Market Update 2026",
            slug: "islamabad-property-market-update-2026",
            content: "<p>The Islamabad real estate sector is witnessing substantial momentum across DHA Phase 2, Bahria Enclave, and CDA Sector G-11. Investors are focusing on high-yield commercial outlets and turnkey residential homes.</p>",
            excerpt: "Key investment insights and high-demand sectors in Islamabad for 2026.",
            featuredImage: { driveFileId: "", url: "assets/images/mideast-view1.png" },
            category: "market_update",
            authorId: "user_001",
            authorName: "Ali Khan",
            metaTitle: "Islamabad Real Estate Market Trends 2026",
            metaDescription: "In-depth analysis of Islamabad real estate demand and capital growth projections.",
            status: "published",
            publishedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],
    siteSettings: { ...DEFAULT_SITE_SETTINGS }
};

// Auto-seed Firestore on module load
async function seedFirestoreIfNeeded() {
    if (!db) return;
    try {
        const settingsRef = db.collection('kaghan_properties').doc('siteSettings');
        const snap = await settingsRef.get();
        if (!snap.exists) {
            await settingsRef.set({ doc: 'main', ...DEFAULT_SITE_SETTINGS });
        }
        
        // Check societies
        const socRef = getSubcollectionRef('societies');
        if (socRef) {
            const sSnap = await socRef.limit(1).get();
            if (sSnap.empty) {
                for (const s of DEFAULT_SOCIETIES) {
                    await socRef.doc(s.id).set(s);
                }
            }
        }

        // Check properties
        const propRef = getSubcollectionRef('properties');
        if (propRef) {
            const pSnap = await propRef.limit(1).get();
            if (pSnap.empty) {
                for (const p of DEFAULT_PROPERTIES) {
                    await propRef.doc(p.id).set(p);
                }
            }
        }

        // Check users
        const usrRef = getSubcollectionRef('users');
        if (usrRef) {
            const uSnap = await usrRef.limit(1).get();
            if (uSnap.empty) {
                for (const u of DEFAULT_USERS) {
                    await usrRef.doc(u.id).set(u);
                }
            }
        }
    } catch (e) {
        console.warn("Firestore auto-seeding skipped or failed (using fallback store):", e);
    }
}
seedFirestoreIfNeeded();

// Global Unified Kaghan Properties API
window.KaghanDB = {
    // Utility helpers
    getDriveDirectUrl,
    getYouTubeEmbedUrl,
    extractYouTubeId,
    uploadImageToCloudinary: window.CloudinaryService.uploadImage,
    cloudinary: window.CloudinaryService,

    // Site Settings API
    getSiteSettings: async () => {
        try {
            if (db) {
                const snap = await db.collection('kaghan_properties').doc('siteSettings').get();
                if (snap.exists) {
                    return snap.data();
                }
            }
        } catch (e) {
            console.error("Error fetching site settings from Firestore:", e);
        }
        return localStore.siteSettings;
    },

    saveSiteSettings: async (settings) => {
        settings.updatedAt = new Date().toISOString();
        try {
            if (db) {
                await db.collection('kaghan_properties').doc('siteSettings').set(settings, { merge: true });
            }
        } catch (e) {
            console.error("Error saving site settings:", e);
        }
        localStore.siteSettings = { ...localStore.siteSettings, ...settings };
        return { success: true };
    },

    // Users API
    getUsers: async () => {
        try {
            if (db) {
                const snap = await getSubcollectionRef('users').get();
                const list = [];
                snap.forEach(doc => list.push(doc.data()));
                if (list.length > 0) return list;
            }
        } catch (e) {
            console.error("Error getting users:", e);
        }
        return localStore.users;
    },

    getUserByUidOrEmail: async (identifier) => {
        const users = await window.KaghanDB.getUsers();
        return users.find(u => u.uid === identifier || u.email.toLowerCase() === identifier.toLowerCase()) || null;
    },

    saveUser: async (user) => {
        user.updatedAt = new Date().toISOString();
        if (!user.createdAt) user.createdAt = new Date().toISOString();
        if (!user.id) user.id = `user_${Date.now()}`;
        try {
            if (db) {
                await getSubcollectionRef('users').doc(user.id).set(user, { merge: true });
            }
        } catch (e) {
            console.error("Error saving user:", e);
        }
        const index = localStore.users.findIndex(u => u.id === user.id);
        if (index >= 0) localStore.users[index] = user;
        else localStore.users.push(user);
        return { success: true, id: user.id };
    },

    deleteUser: async (id) => {
        try {
            if (db) {
                await getSubcollectionRef('users').doc(id).delete();
            }
        } catch (e) {
            console.error("Error deleting user:", e);
        }
        localStore.users = localStore.users.filter(u => u.id !== id);
        return true;
    },

    // Properties API
    getProperties: async (filters = {}) => {
        let list = [];
        try {
            if (db) {
                const snap = await getSubcollectionRef('properties').get();
                snap.forEach(doc => list.push(doc.data()));
            }
        } catch (e) {
            console.error("Error getting properties from Firestore:", e);
        }
        if (list.length === 0) {
            list = localStore.properties;
        }

        // Apply filters
        return list.filter(p => {
            if (filters.status && p.status !== filters.status) return false;
            if (filters.type && filters.type !== 'all' && p.type !== filters.type) return false;
            if (filters.purpose && filters.purpose !== 'all' && p.purpose !== filters.purpose) return false;
            if (filters.city && filters.city !== 'all' && p.city.toLowerCase() !== filters.city.toLowerCase()) return false;
            if (filters.area && filters.area !== 'all' && !p.area.toLowerCase().includes(filters.area.toLowerCase())) return false;
            if (filters.minPrice && p.price < filters.minPrice) return false;
            if (filters.maxPrice && p.price > filters.maxPrice) return false;
            if (filters.bedrooms && p.bedrooms < filters.bedrooms) return false;
            return true;
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getPropertyBySlugOrId: async (slugOrId) => {
        const all = await window.KaghanDB.getProperties();
        return all.find(p => p.slug === slugOrId || p.id === slugOrId) || null;
    },

    saveProperty: async (property) => {
        property.updatedAt = new Date().toISOString();
        if (!property.createdAt) property.createdAt = new Date().toISOString();
        if (!property.publishedAt && property.status === 'published') property.publishedAt = new Date().toISOString();
        if (!property.id) property.id = property.slug || `prop_${Date.now()}`;
        if (!property.slug) property.slug = property.id;
        
        try {
            if (db) {
                await getSubcollectionRef('properties').doc(property.id).set(property, { merge: true });
            }
        } catch (e) {
            console.error("Error saving property:", e);
        }

        const idx = localStore.properties.findIndex(p => p.id === property.id);
        if (idx >= 0) localStore.properties[idx] = property;
        else localStore.properties.push(property);
        return { success: true, id: property.id };
    },

    deleteProperty: async (id) => {
        try {
            if (db) {
                await getSubcollectionRef('properties').doc(id).delete();
            }
        } catch (e) {
            console.error("Error deleting property:", e);
        }
        localStore.properties = localStore.properties.filter(p => p.id !== id);
        return true;
    },

    // Leads API
    getLeads: async () => {
        let list = [];
        try {
            if (db) {
                const snap = await getSubcollectionRef('leads').get();
                snap.forEach(doc => list.push(doc.data()));
            }
        } catch (e) {
            console.error("Error getting leads:", e);
        }
        if (list.length === 0) list = localStore.leads;
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    createLead: async (lead) => {
        const leadDoc = {
            id: `lead_${Date.now()}_${Math.floor(Math.random()*1000)}`,
            name: lead.name || '',
            email: lead.email ? lead.email.toLowerCase().trim() : '',
            phone: lead.phone || '',
            message: lead.message || '',
            sourcePage: lead.sourcePage || window.location.pathname,
            propertyId: lead.propertyId || '',
            propertyTitle: lead.propertyTitle || '',
            agentId: lead.agentId || 'user_001',
            status: lead.status || 'new', // new, contacted, qualified, lost, closed
            notes: lead.notes || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            if (db) {
                await getSubcollectionRef('leads').doc(leadDoc.id).set(leadDoc);
            }
        } catch (e) {
            console.error("Error writing lead to Firestore:", e);
        }

        localStore.leads.unshift(leadDoc);
        return { success: true, id: leadDoc.id };
    },

    updateLeadStatus: async (id, status) => {
        try {
            if (db) {
                await getSubcollectionRef('leads').doc(id).update({ status, updatedAt: new Date().toISOString() });
            }
        } catch (e) {
            console.error("Error updating lead status:", e);
        }
        const lead = localStore.leads.find(l => l.id === id);
        if (lead) {
            lead.status = status;
            lead.updatedAt = new Date().toISOString();
        }
        return true;
    },

    addLeadNote: async (id, noteText, authorName = "Agent") => {
        const note = {
            text: noteText,
            createdAt: new Date().toISOString(),
            createdBy: authorName
        };
        try {
            if (db) {
                const ref = getSubcollectionRef('leads').doc(id);
                await ref.update({
                    notes: firebase.firestore.FieldValue.arrayUnion(note),
                    updatedAt: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error("Error adding lead note:", e);
        }
        const lead = localStore.leads.find(l => l.id === id);
        if (lead) {
            if (!lead.notes) lead.notes = [];
            lead.notes.push(note);
            lead.updatedAt = new Date().toISOString();
        }
        return true;
    },

    // Societies API
    getSocieties: async () => {
        let list = [];
        try {
            if (db) {
                const snap = await getSubcollectionRef('societies').get();
                snap.forEach(doc => list.push(doc.data()));
            }
        } catch (e) {
            console.error("Error getting societies:", e);
        }
        if (list.length === 0) list = localStore.societies;
        return list;
    },

    saveSociety: async (society) => {
        society.updatedAt = new Date().toISOString();
        if (!society.createdAt) society.createdAt = new Date().toISOString();
        if (!society.id) society.id = society.slug || `soc_${Date.now()}`;
        if (!society.slug) society.slug = society.id;

        try {
            if (db) {
                await getSubcollectionRef('societies').doc(society.id).set(society, { merge: true });
            }
        } catch (e) {
            console.error("Error saving society:", e);
        }

        const idx = localStore.societies.findIndex(s => s.id === society.id);
        if (idx >= 0) localStore.societies[idx] = society;
        else localStore.societies.push(society);
        return { success: true, id: society.id };
    },

    deleteSociety: async (id) => {
        try {
            if (db) {
                await getSubcollectionRef('societies').doc(id).delete();
            }
        } catch (e) {
            console.error("Error deleting society:", e);
        }
        localStore.societies = localStore.societies.filter(s => s.id !== id);
        return true;
    },

    // Blog API
    getBlogPosts: async (statusOnly = 'published') => {
        let list = [];
        try {
            if (db) {
                const snap = await getSubcollectionRef('blogPosts').get();
                snap.forEach(doc => list.push(doc.data()));
            }
        } catch (e) {
            console.error("Error getting blog posts:", e);
        }
        if (list.length === 0) list = localStore.blogPosts;
        return list.filter(b => !statusOnly || b.status === statusOnly).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    saveBlogPost: async (post) => {
        post.updatedAt = new Date().toISOString();
        if (!post.createdAt) post.createdAt = new Date().toISOString();
        if (!post.publishedAt && post.status === 'published') post.publishedAt = new Date().toISOString();
        if (!post.id) post.id = post.slug || `blog_${Date.now()}`;
        if (!post.slug) post.slug = post.id;

        try {
            if (db) {
                await getSubcollectionRef('blogPosts').doc(post.id).set(post, { merge: true });
            }
        } catch (e) {
            console.error("Error saving blog post:", e);
        }

        const idx = localStore.blogPosts.findIndex(b => b.id === post.id);
        if (idx >= 0) localStore.blogPosts[idx] = post;
        else localStore.blogPosts.push(post);
        return { success: true, id: post.id };
    },

    deleteBlogPost: async (id) => {
        try {
            if (db) {
                await getSubcollectionRef('blogPosts').doc(id).delete();
            }
        } catch (e) {
            console.error("Error deleting blog post:", e);
        }
        localStore.blogPosts = localStore.blogPosts.filter(b => b.id !== id);
        return true;
    },

    // Authentication API (Firebase Auth + Fallback)
    login: async (email, password) => {
        const normEmail = email.toLowerCase().trim();
        // 1. Attempt Firebase Auth if available
        if (auth) {
            try {
                const cred = await auth.signInWithEmailAndPassword(normEmail, password);
                const userDoc = await window.KaghanDB.getUserByUidOrEmail(cred.user.uid) || await window.KaghanDB.getUserByUidOrEmail(normEmail);
                const session = {
                    uid: cred.user.uid,
                    id: userDoc ? userDoc.id : cred.user.uid,
                    name: userDoc ? userDoc.name : cred.user.email,
                    email: normEmail,
                    role: userDoc ? userDoc.role : 'admin',
                    expiry: new Date().getTime() + (8 * 60 * 60 * 1000)
                };
                localStorage.setItem('kaghan_corp_session', JSON.stringify(session));
                return { success: true, session };
            } catch (authErr) {
                console.warn("Firebase Auth sign-in failed, trying credential check:", authErr.message);
            }
        }

        // Fallback demo admin login credentials check
        if ((normEmail === 'admin@kaghanproperties.com' || normEmail === 'admin@kaghan.com' || normEmail === 'ali@kaghanproperties.com') && (password === 'admin123' || password === 'admin')) {
            const session = {
                uid: 'usr_admin_default',
                id: 'user_001',
                name: 'Ali Khan (Admin)',
                email: normEmail,
                role: 'admin',
                expiry: new Date().getTime() + (8 * 60 * 60 * 1000)
            };
            localStorage.setItem('kaghan_corp_session', JSON.stringify(session));
            return { success: true, session };
        }

        return { success: false, message: 'Invalid email or password. Please verify credentials.' };
    },

    getCurrentUser: () => {
        const data = localStorage.getItem('kaghan_corp_session');
        if (!data) return null;
        try {
            const session = JSON.parse(data);
            if (new Date().getTime() > session.expiry) {
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

// Backward Compatibility Aliases for CorporateDB
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
            email: email,
            phone: '',
            message: 'Subscribed to corporate newsletter updates',
            sourcePage: '/newsletter'
        });
        return { success: true, message: 'Thank you for subscribing to Kaghan Properties updates!' };
    }
};
