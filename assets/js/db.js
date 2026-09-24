// Kaghan Properties - Firestore Database and Shared Module
// Manages Firestore top-level collection 'kaghan_properties' and subcollections:
// users, properties, leads, societies, blogPosts, siteSettings/main

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

// Dynamic Property Taxonomy & Categories Taxonomy
const PROPERTY_TAXONOMY = {
    homes: {
        id: "homes",
        name: "Home",
        slug: "homes",
        icon: "fa-solid fa-house-chimney",
        options: [
            { id: "all_homes", name: "All Homes", slug: "all_homes", group: "Home", icon: "fa-solid fa-house-chimney", description: "All residential homes, villas, apartments, and suites" },
            { id: "penthouse", name: "Penthouse", slug: "penthouse", group: "Home", icon: "fa-solid fa-cloud", description: "Ultra-luxury top-floor penthouses with panoramic terraces" },
            { id: "house", name: "House", slug: "house", group: "Home", icon: "fa-solid fa-house", description: "Independent designer villas, family houses, and duplex homes" },
            { id: "flat", name: "Flat", slug: "flat", group: "Home", icon: "fa-solid fa-building", description: "Residential flats, serviced apartments, and alpine suites" },
            { id: "upper_portion", name: "Upper portion", slug: "upper_portion", group: "Home", icon: "fa-solid fa-stairs", description: "Upper portion residential units with separate entrance" },
            { id: "lower_portion", name: "Lower portion", slug: "lower_portion", group: "Home", icon: "fa-solid fa-door-open", description: "Ground/lower portion residential living units" },
            { id: "farmhouse", name: "Farm House", slug: "farmhouse", group: "Home", icon: "fa-solid fa-tree", description: "Agro luxury farmhouses, country estates, and weekend retreats" },
            { id: "room", name: "Room", slug: "room", group: "Home", icon: "fa-solid fa-bed", description: "Single bedrooms, studio rooms, and shared executive living spaces" }
        ]
    },
    plots: {
        id: "plots",
        name: "Plots",
        slug: "plots",
        icon: "fa-solid fa-border-all",
        options: [
            { id: "all_plots", name: "All Plots", slug: "all_plots", group: "Plots", icon: "fa-solid fa-border-all", description: "All residential, commercial, industrial, and agricultural land allotments" },
            { id: "commercial_plot", name: "Commercial plots", slug: "commercial_plot", group: "Plots", icon: "fa-solid fa-store", description: "Prime commercial plots, boulevard commercial, and markaz plots" },
            { id: "residential_plot", name: "Residential Plots", slug: "residential_plot", group: "Plots", icon: "fa-solid fa-map-location-dot", description: "Residential sector plots ready for house construction" },
            { id: "industrial_land", name: "Industrial land", slug: "industrial_land", group: "Plots", icon: "fa-solid fa-industry", description: "Industrial zone plots, factory land, and heavy manufacturing sites" },
            { id: "agricultural_land", name: "Agricultural Land", slug: "agricultural_land", group: "Plots", icon: "fa-solid fa-wheat-awn", description: "Fertile agricultural acreage, farms, and agro-cultivation land" }
        ]
    },
    commercial: {
        id: "commercial",
        name: "Commercial",
        slug: "commercial",
        icon: "fa-solid fa-briefcase",
        options: [
            { id: "all_commercial", name: "All Commercial", slug: "all_commercial", group: "Commercial", icon: "fa-solid fa-briefcase", description: "All commercial business properties, shops, offices, and plazas" },
            { id: "shop", name: "Shop", slug: "shop", group: "Commercial", icon: "fa-solid fa-shop", description: "Retail boulevard shops, ground floor stores, and shopping mall units" },
            { id: "office", name: "Office", slug: "office", group: "Commercial", icon: "fa-solid fa-laptop-code", description: "Corporate offices, executive business suites, and commercial floors" },
            { id: "factory", name: "Factory", slug: "factory", group: "Commercial", icon: "fa-solid fa-industry", description: "Manufacturing factories, industrial processing units, and plants" },
            { id: "warehouse", name: "Warehouse", slug: "warehouse", group: "Commercial", icon: "fa-solid fa-warehouse", description: "Logistics warehouses, storage depots, and distribution sheds" },
            { id: "building", name: "Building", slug: "building", group: "Commercial", icon: "fa-solid fa-city", description: "Complete commercial buildings and corporate office towers" },
            { id: "plaza", name: "Plaza", slug: "plaza", group: "Commercial", icon: "fa-solid fa-monument", description: "Multi-storey commercial shopping plazas and civic hubs" },
            { id: "other_commercial", name: "Other", slug: "other_commercial", group: "Commercial", icon: "fa-solid fa-ellipsis", description: "Specialized commercial ventures and unique real estate opportunities" }
        ]
    }
};

// Initial Dynamic Categories Taxonomy (Flattened for backward compatibility)
const DEFAULT_CATEGORIES = [
    ...PROPERTY_TAXONOMY.homes.options.map((opt, i) => ({ ...opt, isActive: true, sortOrder: i + 1 })),
    ...PROPERTY_TAXONOMY.plots.options.map((opt, i) => ({ ...opt, isActive: true, sortOrder: 10 + i + 1 })),
    ...PROPERTY_TAXONOMY.commercial.options.map((opt, i) => ({ ...opt, isActive: true, sortOrder: 20 + i + 1 }))
];

// Initial Dynamic Cities Catalog
const DEFAULT_CITIES = [
    {
        id: "islamabad",
        name: "Islamabad",
        slug: "islamabad",
        province: "Federal Capital",
        image: "assets/images/parkview.png",
        adCount: 14322,
        featured: true,
        isActive: true,
        sortOrder: 1
    },
    {
        id: "rawalpindi",
        name: "Rawalpindi",
        slug: "rawalpindi",
        province: "Punjab",
        image: "assets/images/azan-arcade.png",
        adCount: 11480,
        featured: true,
        isActive: true,
        sortOrder: 2
    },
    {
        id: "nathia-gali",
        name: "Nathia Gali",
        slug: "nathia-gali",
        province: "KPK (Galyat)",
        image: "assets/images/interior.png",
        adCount: 2180,
        featured: true,
        isActive: true,
        sortOrder: 3
    },
    {
        id: "murree",
        name: "Murree",
        slug: "murree",
        province: "Punjab (Hills)",
        image: "assets/images/mideast-view2.png",
        adCount: 3240,
        featured: true,
        isActive: true,
        sortOrder: 4
    },
    {
        id: "lahore",
        name: "Lahore",
        slug: "lahore",
        province: "Punjab",
        image: "assets/images/hero.png",
        adCount: 18940,
        featured: true,
        isActive: true,
        sortOrder: 5
    },
    {
        id: "karachi",
        name: "Karachi",
        slug: "karachi",
        province: "Sindh",
        image: "assets/images/embassy.png",
        adCount: 22400,
        featured: false,
        isActive: true,
        sortOrder: 6
    },
    {
        id: "peshawar",
        name: "Peshawar",
        slug: "peshawar",
        province: "KPK",
        image: "assets/images/bahria-villa.png",
        adCount: 4350,
        featured: false,
        isActive: true,
        sortOrder: 7
    },
    {
        id: "abbottabad",
        name: "Abbottabad",
        slug: "abbottabad",
        province: "KPK",
        image: "assets/images/mideast-view1.png",
        adCount: 1950,
        featured: false,
        isActive: true,
        sortOrder: 8
    }
];

// Dynamic Homepage Site Content Modules
const DEFAULT_SITE_CONTENT = {
    promoBanner: {
        isActive: true,
        title: "DHA Margalla Enclave — Official Ballot 1, Ballot 2 & Ballot 3 Payment Plans",
        badge: "DHA Ballots 1, 2 & 3",
        subtitle: "Explore official 1, 2 & 3-Year payment plans for Residential (125, 250, 500 Sq Yds), Commercial (100, 133.25, 200, 500 Sq Yds), and LG+G+5 High-Rise Commercial (133.33, 200, 266.66 Sq Yds) plots at Margalla Foothills.",
        link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2",
        buttonText: "View Payment Plans",
        ctaText: "View Payment Plans",
        ctaUrl: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2",
        icon: "fa-solid fa-mountain"
    },
    decisionTools: [
        {
            id: "plot-finder",
            title: "Plot Finder",
            badge: "GIS Maps",
            subtitle: "DHA Margalla Enclave master layout & sector maps",
            description: "DHA Margalla Enclave master layout & sector maps",
            icon: "fa-solid fa-map-location-dot",
            iconClass: "fa-solid fa-map-location-dot",
            link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2#floor-plans",
            colorTheme: "emerald",
            isActive: true,
            sortOrder: 1
        },
        {
            id: "area-guides",
            title: "DHA Sector Guides",
            badge: "Margalla Avenue",
            subtitle: "Ballot 1, 2 & 3 sector locations & rates",
            description: "Ballot 1, 2 & 3 sector locations & rates",
            icon: "fa-solid fa-compass",
            iconClass: "fa-solid fa-compass",
            link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2#location",
            colorTheme: "blue",
            isActive: true,
            sortOrder: 2
        },
        {
            id: "new-projects",
            title: "DHA Margalla Enclave",
            badge: "Ballot Plans",
            subtitle: "Residential & Commercial 1, 2, 3-Yr Installments",
            description: "Residential & Commercial 1, 2, 3-Yr Installments",
            icon: "fa-solid fa-city",
            iconClass: "fa-solid fa-city",
            link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2",
            colorTheme: "purple",
            isActive: true,
            sortOrder: 3
        },
        {
            id: "home-loans",
            title: "Installment Calculator",
            badge: "20% Down",
            subtitle: "Quarterly installment breakdown for all plot sizes",
            description: "Quarterly installment breakdown for all plot sizes",
            icon: "fa-solid fa-calculator",
            iconClass: "fa-solid fa-calculator",
            link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2#payment-plan",
            colorTheme: "amber",
            isActive: true,
            sortOrder: 4
        },
        {
            id: "land-records",
            title: "DHA Title & Ballot Verification",
            badge: "Verified",
            subtitle: "Official DHA verification & transfer procedure",
            description: "Official DHA verification & transfer procedure",
            icon: "fa-solid fa-file-contract",
            iconClass: "fa-solid fa-file-contract",
            link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2#marketed-by",
            colorTheme: "rose",
            isActive: true,
            sortOrder: 5
        },
        {
            id: "construction-cost",
            title: "Ballot Schedule & Rates",
            badge: "2026 DHA",
            subtitle: "Lump Sum vs 1, 2, 3 Year installment matrices",
            description: "Lump Sum vs 1, 2, 3 Year installment matrices",
            icon: "fa-solid fa-table-cells",
            iconClass: "fa-solid fa-table-cells",
            link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2#payment-plan",
            colorTheme: "teal",
            isActive: true,
            sortOrder: 6
        }
    ],
    homePartners: [
        { id: "p1", name: "Askari Bank", icon: "fa-solid fa-landmark", link: "#", isActive: true },
        { id: "p2", name: "Meezan Bank", icon: "fa-solid fa-building-columns", link: "#", isActive: true },
        { id: "p3", name: "HBL Islamic", icon: "fa-solid fa-vault", link: "#", isActive: true },
        { id: "p4", name: "Bank Alfalah", icon: "fa-solid fa-scale-balanced", link: "#", isActive: true },
        { id: "p5", name: "Kuickpay Online", icon: "fa-solid fa-credit-card", link: "#", isActive: true }
    ],
    browseProperties: [
        // Ballot 1 - Residential
        { id: "bp_1", category: "plots", subTab: "popular", title: "125 Sq Yds (5 Marla) Residential Plot", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=res-125", badge: "Ballot 1", isActive: true, sortOrder: 1 },
        { id: "bp_2", category: "plots", subTab: "popular", title: "250 Sq Yds (10 Marla) Residential Plot", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=res-250", badge: "Ballot 1", isActive: true, sortOrder: 2 },
        { id: "bp_3", category: "plots", subTab: "popular", title: "500 Sq Yds (1 Kanal) Residential Plot", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=res-500", badge: "Ballot 1", isActive: true, sortOrder: 3 },
        { id: "bp_4", category: "plots", subTab: "popular", title: "100 Sq Yds (4 Marla) Commercial Plot", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm-100", badge: "Ballot 2", isActive: true, sortOrder: 4 },
        { id: "bp_5", category: "plots", subTab: "popular", title: "133.25 Sq Yds (5.33 Marla) Commercial Plot", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm-133", badge: "Ballot 2", isActive: true, sortOrder: 5 },
        { id: "bp_6", category: "plots", subTab: "popular", title: "200 Sq Yds (8 Marla) Commercial Plot", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm-200", badge: "Ballot 2", isActive: true, sortOrder: 6 },
        { id: "bp_7", category: "plots", subTab: "popular", title: "500 Sq Yds (20 Marla) Commercial Plot", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm-500", badge: "Ballot 2", isActive: true, sortOrder: 7 },
        { id: "bp_7b", category: "plots", subTab: "popular", title: "133.33 Sq Yds (LG+G+5) Commercial Plot", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm3-133", badge: "Ballot 3", isActive: true, sortOrder: 8 },
        { id: "bp_7c", category: "plots", subTab: "popular", title: "200 Sq Yds (LG+G+5) Commercial Plot", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm3-200", badge: "Ballot 3", isActive: true, sortOrder: 9 },
        { id: "bp_7d", category: "plots", subTab: "popular", title: "266.66 Sq Yds (LG+G+5) Commercial Plot", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm3-266", badge: "Ballot 3", isActive: true, sortOrder: 10 },

        // Plots - Type
        { id: "bp_8", category: "plots", subTab: "type", title: "Ballot 1 Residential Plots", link: "projects.html?type=residential_plot", badge: "Ballot 1", isActive: true, sortOrder: 1 },
        { id: "bp_9", category: "plots", subTab: "type", title: "Ballot 2 Commercial Plots", link: "projects.html?type=commercial_plot", badge: "Ballot 2", isActive: true, sortOrder: 2 },
        { id: "bp_9b", category: "plots", subTab: "type", title: "Ballot 3 (LG+G+5 Commercial Plots)", link: "projects.html?type=commercial_plot", badge: "Ballot 3", isActive: true, sortOrder: 3 },
        { id: "bp_10", category: "plots", subTab: "type", title: "Lump Sum Settlement Plots", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2#payment-plan", badge: "30-Day Pay", isActive: true, sortOrder: 4 },
        { id: "bp_11", category: "plots", subTab: "type", title: "1-Year (4 Quarters) Payment Plan", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2#payment-plan", badge: "1 Year", isActive: true, sortOrder: 5 },
        { id: "bp_12", category: "plots", subTab: "type", title: "2-Years (8 Quarters) Payment Plan", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2#payment-plan", badge: "2 Years", isActive: true, sortOrder: 6 },
        { id: "bp_13", category: "plots", subTab: "type", title: "3-Years (12 Quarters) Payment Plan", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2#payment-plan", badge: "3 Years", isActive: true, sortOrder: 7 },

        // Plots - Area Size
        { id: "bp_14", category: "plots", subTab: "area_size", title: "125 Sq Yds Plots (5 Marla)", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=res-125", badge: "125 Sq Yds", isActive: true, sortOrder: 1 },
        { id: "bp_15", category: "plots", subTab: "area_size", title: "250 Sq Yds Plots (10 Marla)", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=res-250", badge: "250 Sq Yds", isActive: true, sortOrder: 2 },
        { id: "bp_16", category: "plots", subTab: "area_size", title: "500 Sq Yds Plots (1 Kanal)", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=res-500", badge: "500 Sq Yds", isActive: true, sortOrder: 3 },
        { id: "bp_17", category: "plots", subTab: "area_size", title: "100 Sq Yds Commercial", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm-100", badge: "100 Sq Yds", isActive: true, sortOrder: 4 },
        { id: "bp_18", category: "plots", subTab: "area_size", title: "133.25 - 133.33 Sq Yds Commercial", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm-133", badge: "133 Sq Yds", isActive: true, sortOrder: 5 },
        { id: "bp_19", category: "plots", subTab: "area_size", title: "200 Sq Yds Commercial (LG+G+5)", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm3-200", badge: "200 Sq Yds", isActive: true, sortOrder: 6 },
        { id: "bp_19b", category: "plots", subTab: "area_size", title: "266.66 Sq Yds Commercial (LG+G+5)", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm3-266", badge: "266.66 Sq Yds", isActive: true, sortOrder: 7 },

        // Commercial Category
        { id: "bp_20", category: "commercial", subTab: "popular", title: "Boulevard Commercial 100 Sq Yds", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm-100", badge: "Ballot 2", isActive: true, sortOrder: 1 },
        { id: "bp_21", category: "commercial", subTab: "popular", title: "Boulevard Commercial 133.25 Sq Yds", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm-133", badge: "Ballot 2", isActive: true, sortOrder: 2 },
        { id: "bp_22", category: "commercial", subTab: "popular", title: "Commercial Plaza Plot 200 Sq Yds", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm-200", badge: "Ballot 2", isActive: true, sortOrder: 3 },
        { id: "bp_23", category: "commercial", subTab: "popular", title: "Grand Commercial Plot 500 Sq Yds", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm-500", badge: "Ballot 2", isActive: true, sortOrder: 4 },
        { id: "bp_23b", category: "commercial", subTab: "popular", title: "LG+G+5 Commercial Plaza 133.33 Sq Yds", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm3-133", badge: "Ballot 3", isActive: true, sortOrder: 5 },
        { id: "bp_23c", category: "commercial", subTab: "popular", title: "LG+G+5 Commercial Tower 200 Sq Yds", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm3-200", badge: "Ballot 3", isActive: true, sortOrder: 6 },
        { id: "bp_23d", category: "commercial", subTab: "popular", title: "LG+G+5 Grand Plaza Complex 266.66 Sq Yds", link: "project-detail.html?slug=dha-margalla-enclave-ballot-1-2&plot=comm3-266", badge: "Ballot 3", isActive: true, sortOrder: 7 },

        // Homes Category (DHA Margalla Enclave Living)
        { id: "bp_24", category: "homes", subTab: "popular", title: "DHA Margalla Enclave Residential Plots (Ballot 1)", link: "projects.html?type=residential_plot", badge: "Ballot 1", isActive: true, sortOrder: 1 },
        { id: "bp_25", category: "homes", subTab: "popular", title: "DHA Margalla Enclave Commercial Plots (Ballot 2 & 3)", link: "projects.html?type=commercial_plot", badge: "Ballots 2 & 3", isActive: true, sortOrder: 2 }
    ]
};

// Normalize DEFAULT_SITE_CONTENT browseProperties to guarantee both url and link properties
if (DEFAULT_SITE_CONTENT.browseProperties) {
    DEFAULT_SITE_CONTENT.browseProperties = DEFAULT_SITE_CONTENT.browseProperties.map(item => {
        const u = item.url || item.link || 'projects.html';
        return { ...item, url: u, link: u };
    });
}

// Initial Data Seeding for Firestore 'kaghan_properties'
const DEFAULT_SOCIETIES = [
    {
        id: "dha-margalla-enclave",
        name: "DHA Margalla Enclave",
        slug: "dha-margalla-enclave",
        type: "society",
        city: "Islamabad",
        description: "DHA Margalla Enclave is Defence Housing Authority's signature mountain-view masterplanned community nestled directly at the picturesque Margalla Foothills corridor with direct Margalla Avenue connectivity. Features world-class infrastructure, underground utilities, scenic parks, wide boulevards, and high-capital-growth commercial markaz across Ballot 1, Ballot 2 & Ballot 3.",
        amenities: ["DHA Islamabad Masterplan", "Margalla Foothills Views", "Direct Margalla Avenue Access", "Underground Electrification & Utilities", "24/7 Gated Security", "Commercial Boulevard & Markaz", "Approved LG+G+5 High-Rise Zones"],
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13270.2!2d72.9680!3d33.7250",
        coordinates: { lat: 33.7250, lng: 72.9680 },
        introVideoId: "dQw4w9WgXcQ",
        documentsFolderUrl: "https://margallaenclave.dhai-r.com.pk/",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const DEFAULT_PROPERTIES = [
    // 1. MASTER FLAGSHIP PROJECT: DHA Margalla Enclave (Ballot 1, Ballot 2 & Ballot 3)
    {
        id: "prop-dha-margalla-enclave-ballots",
        slug: "dha-margalla-enclave-ballot-1-2",
        title: "DHA Margalla Enclave - Official Ballot 1, Ballot 2 & Ballot 3",
        tagline: "Exclusive 1, 2 & 3-Year Payment Plans for Residential & Commercial (LG+G+5) Plots at Margalla Foothills",
        description: "DHA Margalla Enclave Islamabad presents premier residential and commercial plot balloting nestled at the scenic Margalla foothills with direct Margalla Avenue access. Offering Ballot 1 Residential Plots (125, 250, and 500 Sq. Yds.), Ballot 2 Boulevard Commercial Plots (100, 133.25, 200, and 500 Sq. Yds.), and Ballot 3 High-Rise Commercial Plots (133.33, 200, and 266.66 Sq. Yds. with approved LG+G+5 height) on flexible Lump Sum settlement and 1, 2, and 3-Year quarterly installment schedules with a 20% down payment.",
        type: "residential_plot",
        category: "Residential Plots",
        purpose: "sale",
        price: 21434375,
        priceRangeStr: "PKR 2.14 Crore - 40.00 Crore",
        priceUnit: "PKR",
        size: 20,
        sqYards: 500,
        sizeUnit: "Marla",
        bedrooms: 0,
        bathrooms: 0,
        city: "Islamabad",
        area: "DHA Margalla Enclave",
        sector: "Margalla Avenue Corridor",
        address: "DHA Margalla Enclave, Margalla Avenue Corridor",
        societyId: "dha-margalla-enclave",
        location: "DHA Margalla Enclave, Margalla Avenue Corridor, Islamabad",
        isFeatured: true,
        isNewProject: true,
        urgency: "super-hot",
        status: "published",
        developer: "Defence Housing Authority (DHA)",
        constructionStatus: "Balloted & Under Development",
        deliveryDate: "2027-2029",
        images: [
            { url: "assets/images/dha-margalla-hero.jpg", isPrimary: true, alt: "DHA Margalla Enclave Master Elevation" },
            { url: "assets/images/dha-res-125sqyds.jpg", isPrimary: false, alt: "DHA Margalla 5 Marla Residential Plots" },
            { url: "assets/images/dha-res-250sqyds.jpg", isPrimary: false, alt: "DHA Margalla 10 Marla Residential Plots" },
            { url: "assets/images/dha-res-500sqyds.jpg", isPrimary: false, alt: "DHA Margalla 1 Kanal Luxury Estate Plots" },
            { url: "assets/images/dha-comm-100sqyds.jpg", isPrimary: false, alt: "DHA Margalla 4 Marla Commercial Arcade" },
            { url: "assets/images/dha-comm-boulevard.jpg", isPrimary: false, alt: "DHA Margalla 5.33 Marla Commercial Markaz" },
            { url: "assets/images/dha-commercial-plots.jpg", isPrimary: false, alt: "DHA Margalla 8 Marla Boulevard Commercial" },
            { url: "assets/images/dha-comm-500sqyds.jpg", isPrimary: false, alt: "DHA Margalla 1 Kanal Commercial Complex" },
            { url: "assets/images/dha-ballot3-133sqyds.jpg", isPrimary: false, alt: "Ballot 3 LG+G+5 133.33 Sq Yds Commercial Plaza" },
            { url: "assets/images/dha-ballot3-200sqyds.jpg", isPrimary: false, alt: "Ballot 3 LG+G+5 200 Sq Yds Commercial Building" },
            { url: "assets/images/dha-ballot3-266sqyds.jpg", isPrimary: false, alt: "Ballot 3 LG+G+5 266.66 Sq Yds Grand Corporate Plaza" },
            { url: "assets/images/dha-masterplan.jpg", isPrimary: false, alt: "DHA Margalla Enclave Masterplan Site Map" }
        ],
        features: [
            "Official DHA Computerized Balloting Allotment",
            "Ballot 1 (Residential), Ballot 2 (Commercial) & Ballot 3 (LG+G+5 Commercial)",
            "Lump Sum & 1, 2, 3-Year Quarterly Installment Options",
            "20% Down Payment within 30 Days of Ballot",
            "Direct Connectivity to Margalla Avenue & Ring Road",
            "Underground Electrification, Gas & Water Supply",
            "24/7 Gated Perimeter Surveillance & DHA Security",
            "Lush Green Parks, Margalla Hiking Ridges & Grand Mosque"
        ],
        categorizedAmenities: {
            mainFeatures: [
                "Official DHA Computerized Ballot",
                "Approved LG+G+5 Multi-Storey Commercial Zones",
                "Wide 120-ft & 80-ft Main Boulevards",
                "Lump Sum Discounted Settlement Option",
                "1, 2 & 3-Year Flexible Quarterly Schedules",
                "Non-Refundable Processing Fee Included"
            ],
            facilities: [
                "Underground Power Grid & Sub-stations",
                "Sui Gas & Deep Tube Well Water Network",
                "Modern Drainage & Sewerage Treatment Plant",
                "24/7 DHA Armed Patrols & Security Checkposts",
                "Smart CCTV Corridor Surveillance"
            ],
            community: [
                "Grand Jamia Mosque with Islamic Center",
                "Sector Neighborhood Community Parks",
                "Walking, Jogging & Cycling Tracks",
                "DHA Commercial Markaz & Banking Squares",
                "Scenic Margalla Hills Viewing Promenades"
            ]
        },
        projectUnits: [
            { type: "125 Sq Yds Residential Plot (5 Marla)", category: "Residential (Ballot 1)", priceRange: "PKR 2.14 Cr - 2.50 Cr", sizeRange: "125 Sq Yds (5 Marla)", descriptor: "Ballot 1 Residential. Lump Sum: PKR 21,434,375 | 1-Yr Plan: PKR 22,562,500 | 2-Yr Plan: PKR 23,750,000 | 3-Yr Plan: PKR 25,000,000 (20% Down: PKR 5,000,000). Processing Fee: PKR 10,000/-." },
            { type: "250 Sq Yds Residential Plot (10 Marla)", category: "Residential (Ballot 1)", priceRange: "PKR 4.20 Cr - 4.90 Cr", sizeRange: "250 Sq Yds (10 Marla)", descriptor: "Ballot 1 Residential. Lump Sum: PKR 42,011,375 | 1-Yr Plan: PKR 44,222,500 | 2-Yr Plan: PKR 46,550,000 | 3-Yr Plan: PKR 49,000,000 (20% Down: PKR 9,800,000). Processing Fee: PKR 15,000/-." },
            { type: "500 Sq Yds Residential Plot (1 Kanal)", category: "Residential (Ballot 1)", priceRange: "PKR 7.28 Cr - 8.50 Cr", sizeRange: "500 Sq Yds (1 Kanal)", descriptor: "Ballot 1 Residential. Lump Sum: PKR 72,876,875 | 1-Yr Plan: PKR 76,712,500 | 2-Yr Plan: PKR 80,750,000 | 3-Yr Plan: PKR 85,000,000 (20% Down: PKR 17,000,000). Processing Fee: PKR 20,000/-." },
            { type: "100 Sq Yds Commercial Plot (4 Marla)", category: "Commercial (Ballot 2)", priceRange: "PKR 8.14 Cr - 9.50 Cr", sizeRange: "100 Sq Yds (4 Marla)", descriptor: "Ballot 2 Commercial. Lump Sum: PKR 81,450,625 | 1-Yr Plan: PKR 85,737,500 | 2-Yr Plan: PKR 90,250,000 | 3-Yr Plan: PKR 95,000,000 (20% Down: PKR 19,000,000). Processing Fee: PKR 30,000/-." },
            { type: "133.25 Sq Yds Commercial Plot (5.33 Marla)", category: "Commercial (Ballot 2)", priceRange: "PKR 12.00 Cr - 14.00 Cr", sizeRange: "133.25 Sq Yds (5.33 Marla)", descriptor: "Ballot 2 Commercial. Lump Sum: PKR 120,032,500 | 1-Yr Plan: PKR 126,350,000 | 2-Yr Plan: PKR 133,000,000 | 3-Yr Plan: PKR 140,000,000 (20% Down: PKR 28,000,000). Processing Fee: PKR 40,000/-." },
            { type: "200 Sq Yds Commercial Plot (8 Marla)", category: "Commercial (Ballot 2)", priceRange: "PKR 14.57 Cr - 17.00 Cr", sizeRange: "200 Sq Yds (8 Marla)", descriptor: "Ballot 2 Commercial. Lump Sum: PKR 145,753,750 | 1-Yr Plan: PKR 153,425,000 | 2-Yr Plan: PKR 161,500,000 | 3-Yr Plan: PKR 170,000,000 (20% Down: PKR 34,000,000). Processing Fee: PKR 50,000/-." },
            { type: "500 Sq Yds Commercial Plot (20 Marla)", category: "Commercial (Ballot 2)", priceRange: "PKR 34.29 Cr - 40.00 Cr", sizeRange: "500 Sq Yds (20 Marla / 1 Kanal)", descriptor: "Ballot 2 Commercial. Lump Sum: PKR 342,950,000 | 1-Yr Plan: PKR 361,000,000 | 2-Yr Plan: PKR 380,000,000 | 3-Yr Plan: PKR 400,000,000 (20% Down: PKR 80,000,000). Processing Fee: PKR 60,000/-." },
            { type: "133.33 Sq Yds Commercial Plot (LG+G+5)", category: "Commercial (Ballot 3)", priceRange: "PKR 13.58 Cr - 15.98 Cr", sizeRange: "133.33 Sq Yds (5.33 Marla)", descriptor: "Ballot 3 LG+G+5 Commercial. Lump Sum: PKR 135,830,000 | 1-Yr Plan: PKR 143,820,000 | 2-Yr Plan: PKR 151,810,000 | 3-Yr Plan: PKR 159,800,000 (20% Down: PKR 31,960,000). Processing Fee: PKR 40,000/-." },
            { type: "200 Sq Yds Commercial Plot (LG+G+5)", category: "Commercial (Ballot 3)", priceRange: "PKR 19.65 Cr - 23.12 Cr", sizeRange: "200 Sq Yds (8 Marla)", descriptor: "Ballot 3 LG+G+5 Commercial. Lump Sum: PKR 196,520,000 | 1-Yr Plan: PKR 208,080,000 | 2-Yr Plan: PKR 219,640,000 | 3-Yr Plan: PKR 231,200,000 (20% Down: PKR 46,240,000). Processing Fee: PKR 50,000/-." },
            { type: "266.66 Sq Yds Commercial Plot (LG+G+5)", category: "Commercial (Ballot 3)", priceRange: "PKR 20.15 Cr - 23.71 Cr", sizeRange: "266.66 Sq Yds (10.66 Marla)", descriptor: "Ballot 3 LG+G+5 Commercial. Lump Sum: PKR 201,535,000 | 1-Yr Plan: PKR 213,390,000 | 2-Yr Plan: PKR 225,245,000 | 3-Yr Plan: PKR 237,100,000 (20% Down: PKR 47,420,000). Processing Fee: PKR 60,000/-." }
        ],
        floorPlans: [
            { id: "fp-master", title: "DHA Margalla Enclave Master Plan", subtitle: "Official Approved Layout & Sectors", area: "100 - 500 Sq Yds", height: "DHA Approved Bye-laws", view: "Margalla Hills Foothills Panorama", image: "assets/images/dha-masterplan.jpg" },
            { id: "fp-res", title: "Ballot 1 Residential Sectors Layout", subtitle: "125, 250 & 500 Sq Yds Plots", area: "5, 10 Marla & 1 Kanal", height: "G+2 Residential Standard", view: "Scenic Mountain & Park Facing", image: "assets/images/dha-residential-plots.jpg" },
            { id: "fp-comm", title: "Ballot 2 Commercial Boulevard Grid", subtitle: "100, 133.25, 200 & 500 Sq Yds Plots", area: "4 to 20 Marla Commercial", height: "Commercial Plaza Arcade", view: "120-ft Main Boulevard Facing", image: "assets/images/dha-commercial-plots.jpg" },
            { id: "fp-comm3", title: "Ballot 3 LG+G+5 Multi-Storey Commercial Grid", subtitle: "133.33, 200 & 266.66 Sq Yds Plots", area: "5.33 to 10.66 Marla Commercial", height: "Approved Lower Ground + Ground + 5 Floors", view: "Prime Arterial Commercial Avenue Facing", image: "assets/images/dha-ballot3-chart.jpg" }
        ],
        paymentPlan: {
            duration: "Official 1, 2 & 3-Year Installment Schedules & Lump Sum Option",
            image: "assets/images/dha-masterplan.jpg",
            booking: "20% - Down Payment within 30 Days of Ballot",
            confirmation: "100% - Lump Sum Settlement within 30 Days of Ballot",
            monthly: "80% - In 4, 8, or 12 Quarterly Installments",
            balloon: "Non-Refundable Processing Fee with Application",
            possession: "On scheduled completion of development milestones",
            rebates: "Note: Prices are Exclusive of Applicable DHA Charges & Government Taxes."
        },
        installments: {
            available: true,
            advance: 5000000,
            monthly: 1666667,
            durationMonths: 36,
            planDetails: "3-Year Easy Quarterly Installments (12 Quarters) with 20% Down Payment"
        },
        agentId: "user_001",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },

    // 2. BALLOT 1: 125 Sq Yds (5 Marla) Residential Plot
    {
        id: "prop-dha-margalla-ballot-1-125-sq-yds",
        slug: "dha-margalla-enclave-125-sq-yds-residential-plot-ballot-1",
        title: "125 Sq Yds (5 Marla) Residential Plot - Ballot 1",
        tagline: "DHA Margalla Enclave Ballot 1 residential plot with 1, 2 & 3-Year installment plans",
        description: "Prime 125 Sq. Yds. (approx 5 Marla) residential plot in DHA Margalla Enclave Islamabad (Ballot 1). Available on Lump Sum price of PKR 21,434,375 (within 30 days) or 1-Year (PKR 22,562,500), 2-Year (PKR 23,750,000), and 3-Year (PKR 25,000,000) payment plans with 20% down payment (PKR 5,000,000) and 12 quarterly installments of PKR 1,666,667. Non-refundable processing fee: PKR 10,000/-.",
        type: "residential_plot",
        category: "Residential Plots",
        purpose: "sale",
        price: 21434375,
        priceUnit: "PKR",
        size: 5,
        sqYards: 125,
        sizeUnit: "Marla",
        bedrooms: 0,
        bathrooms: 0,
        city: "Islamabad",
        area: "DHA Margalla Enclave",
        sector: "Sector A",
        address: "Sector A, DHA Margalla Enclave",
        societyId: "dha-margalla-enclave",
        location: "Sector A, DHA Margalla Enclave, Islamabad",
        isFeatured: true,
        isNewProject: false,
        urgency: "super-hot",
        status: "published",
        developer: "Defence Housing Authority (DHA)",
        constructionStatus: "Balloted Plot",
        deliveryDate: "Immediate Transfer",
        images: [
            { url: "assets/images/dha-res-125sqyds.jpg", isPrimary: true, alt: "125 Sq Yds Residential Plot DHA Margalla Enclave" },
            { url: "assets/images/dha-residential-plots.jpg", isPrimary: false, alt: "DHA Margalla Residential Sector" },
            { url: "assets/images/dha-margalla-hero.jpg", isPrimary: false, alt: "DHA Margalla Enclave Overview" },
            { url: "assets/images/dha-masterplan.jpg", isPrimary: false, alt: "Masterplan Map" }
        ],
        features: [
            "Ballot 1 Official Allotment File",
            "Lump Sum Price: PKR 21,434,375",
            "1-Year Plan: PKR 22,562,500 (20% Down: PKR 4,512,500)",
            "2-Year Plan: PKR 23,750,000 (20% Down: PKR 4,750,000)",
            "3-Year Plan: PKR 25,000,000 (20% Down: PKR 5,000,000)",
            "12x Quarterly Installments of PKR 1,666,667",
            "Processing Fee: PKR 10,000/- (Non-Refundable)"
        ],
        installments: {
            available: true,
            advance: 5000000,
            monthly: 1666667,
            durationMonths: 36,
            planDetails: "3-Year Quarterly Plan (12 Quarters of PKR 1,666,667) or Lump Sum PKR 21,434,375"
        },
        agentId: "user_001",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },

    // 3. BALLOT 1: 250 Sq Yds (10 Marla) Residential Plot
    {
        id: "prop-dha-margalla-ballot-1-250-sq-yds",
        slug: "dha-margalla-enclave-250-sq-yds-residential-plot-ballot-1",
        title: "250 Sq Yds (10 Marla) Residential Plot - Ballot 1",
        tagline: "Prime 10 Marla residential plot in DHA Margalla Enclave with easy quarterly installments",
        description: "Prestigious 250 Sq. Yds. (approx 10 Marla) residential plot in DHA Margalla Enclave Islamabad (Ballot 1). Available on Lump Sum price of PKR 42,011,375 (within 30 days) or 1-Year (PKR 44,222,500), 2-Year (PKR 46,550,000), and 3-Year (PKR 49,000,000) payment plans with 20% down payment (PKR 9,800,000) and 12 quarterly installments of PKR 3,266,667. Non-refundable processing fee: PKR 15,000/-.",
        type: "residential_plot",
        category: "Residential Plots",
        purpose: "sale",
        price: 42011375,
        priceUnit: "PKR",
        size: 10,
        sqYards: 250,
        sizeUnit: "Marla",
        bedrooms: 0,
        bathrooms: 0,
        city: "Islamabad",
        area: "DHA Margalla Enclave",
        sector: "Sector B",
        address: "Sector B, DHA Margalla Enclave",
        societyId: "dha-margalla-enclave",
        location: "Sector B, DHA Margalla Enclave, Islamabad",
        isFeatured: true,
        isNewProject: false,
        urgency: "hot",
        status: "published",
        developer: "Defence Housing Authority (DHA)",
        constructionStatus: "Balloted Plot",
        deliveryDate: "Immediate Transfer",
        images: [
            { url: "assets/images/dha-res-250sqyds.jpg", isPrimary: true, alt: "250 Sq Yds Residential Plot DHA Margalla Enclave" },
            { url: "assets/images/dha-residential-plots.jpg", isPrimary: false, alt: "DHA Margalla Residential Sector" },
            { url: "assets/images/dha-margalla-hero.jpg", isPrimary: false, alt: "DHA Margalla Enclave Overview" },
            { url: "assets/images/dha-masterplan.jpg", isPrimary: false, alt: "Masterplan Map" }
        ],
        features: [
            "Ballot 1 Official Allotment File",
            "Lump Sum Price: PKR 42,011,375",
            "1-Year Plan: PKR 44,222,500 (20% Down: PKR 8,844,500)",
            "2-Year Plan: PKR 46,550,000 (20% Down: PKR 9,310,000)",
            "3-Year Plan: PKR 49,000,000 (20% Down: PKR 9,800,000)",
            "12x Quarterly Installments of PKR 3,266,667",
            "Processing Fee: PKR 15,000/- (Non-Refundable)"
        ],
        installments: {
            available: true,
            advance: 9800000,
            monthly: 3266667,
            durationMonths: 36,
            planDetails: "3-Year Quarterly Plan (12 Quarters of PKR 3,266,667) or Lump Sum PKR 42,011,375"
        },
        agentId: "user_001",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },

    // 4. BALLOT 1: 500 Sq Yds (1 Kanal) Residential Plot
    {
        id: "prop-dha-margalla-ballot-1-500-sq-yds",
        slug: "dha-margalla-enclave-500-sq-yds-residential-plot-ballot-1",
        title: "500 Sq Yds (1 Kanal / 20 Marla) Residential Plot - Ballot 1",
        tagline: "Luxury 1 Kanal residential estate plot in DHA Margalla Enclave at the foothills",
        description: "Exclusive 500 Sq. Yds. (1 Kanal / 20 Marla) luxury residential plot in DHA Margalla Enclave Islamabad (Ballot 1). Available on Lump Sum price of PKR 72,876,875 (within 30 days) or 1-Year (PKR 76,712,500), 2-Year (PKR 80,750,000), and 3-Year (PKR 85,000,000) payment plans with 20% down payment (PKR 17,000,000) and 12 quarterly installments of PKR 5,666,667. Non-refundable processing fee: PKR 20,000/-.",
        type: "residential_plot",
        category: "Residential Plots",
        purpose: "sale",
        price: 72876875,
        priceUnit: "PKR",
        size: 20,
        sqYards: 500,
        sizeUnit: "Marla",
        bedrooms: 0,
        bathrooms: 0,
        city: "Islamabad",
        area: "DHA Margalla Enclave",
        sector: "Executive Sector C",
        address: "Executive Sector C, DHA Margalla Enclave",
        societyId: "dha-margalla-enclave",
        location: "Executive Sector C, DHA Margalla Enclave, Islamabad",
        isFeatured: true,
        isNewProject: false,
        urgency: "super-hot",
        status: "published",
        developer: "Defence Housing Authority (DHA)",
        constructionStatus: "Balloted Plot",
        deliveryDate: "Immediate Transfer",
        images: [
            { url: "assets/images/dha-res-500sqyds.jpg", isPrimary: true, alt: "500 Sq Yds 1 Kanal Plot DHA Margalla Enclave" },
            { url: "assets/images/dha-residential-plots.jpg", isPrimary: false, alt: "DHA Margalla Residential Sector" },
            { url: "assets/images/dha-margalla-hero.jpg", isPrimary: false, alt: "DHA Margalla Enclave Overview" },
            { url: "assets/images/dha-masterplan.jpg", isPrimary: false, alt: "Masterplan Map" }
        ],
        features: [
            "Ballot 1 Official Allotment File",
            "Lump Sum Price: PKR 72,876,875",
            "1-Year Plan: PKR 76,712,500 (20% Down: PKR 15,342,500)",
            "2-Year Plan: PKR 80,750,000 (20% Down: PKR 16,150,000)",
            "3-Year Plan: PKR 85,000,000 (20% Down: PKR 17,000,000)",
            "12x Quarterly Installments of PKR 5,666,667",
            "Processing Fee: PKR 20,000/- (Non-Refundable)"
        ],
        installments: {
            available: true,
            advance: 17000000,
            monthly: 5666667,
            durationMonths: 36,
            planDetails: "3-Year Quarterly Plan (12 Quarters of PKR 5,666,667) or Lump Sum PKR 72,876,875"
        },
        agentId: "user_001",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },

    // 5. BALLOT 2: 100 Sq Yds (4 Marla) Commercial Plot
    {
        id: "prop-dha-margalla-ballot-2-100-sq-yds",
        slug: "dha-margalla-enclave-100-sq-yds-commercial-plot-ballot-2",
        title: "100 Sq Yds (4 Marla) Commercial Plot - Ballot 2",
        tagline: "Prime boulevard commercial plot in DHA Margalla Enclave with high business yield",
        description: "High-value 100 Sq. Yds. (approx 4 Marla) commercial plot in DHA Margalla Enclave Islamabad (Ballot 2). Available on Lump Sum price of PKR 81,450,625 (within 30 days) or 1-Year (PKR 85,737,500), 2-Year (PKR 90,250,000), and 3-Year (PKR 95,000,000) payment plans with 20% down payment (PKR 19,000,000) and 12 quarterly installments of PKR 6,333,333. Non-refundable processing fee: PKR 30,000/-.",
        type: "commercial_plot",
        category: "Commercial Plots",
        purpose: "sale",
        price: 81450625,
        priceUnit: "PKR",
        size: 4,
        sqYards: 100,
        sizeUnit: "Marla",
        bedrooms: 0,
        bathrooms: 0,
        city: "Islamabad",
        area: "DHA Margalla Enclave",
        sector: "Commercial Boulevard A",
        address: "Commercial Boulevard Sector A, DHA Margalla Enclave",
        societyId: "dha-margalla-enclave",
        location: "Commercial Boulevard Sector A, DHA Margalla Enclave, Islamabad",
        isFeatured: true,
        isNewProject: false,
        urgency: "super-hot",
        status: "published",
        developer: "Defence Housing Authority (DHA)",
        constructionStatus: "Balloted Commercial Plot",
        deliveryDate: "Immediate Transfer",
        images: [
            { url: "assets/images/dha-comm-100sqyds.jpg", isPrimary: true, alt: "100 Sq Yds Commercial Plot DHA Margalla Enclave" },
            { url: "assets/images/dha-comm-boulevard.jpg", isPrimary: false, alt: "DHA Margalla Commercial Boulevard" },
            { url: "assets/images/dha-commercial-plots.jpg", isPrimary: false, alt: "DHA Margalla Commercial Markaz" },
            { url: "assets/images/dha-masterplan.jpg", isPrimary: false, alt: "Masterplan Map" }
        ],
        features: [
            "Ballot 2 Official Commercial Allotment",
            "Lump Sum Price: PKR 81,450,625",
            "1-Year Plan: PKR 85,737,500 (20% Down: PKR 17,147,500)",
            "2-Year Plan: PKR 90,250,000 (20% Down: PKR 18,050,000)",
            "3-Year Plan: PKR 95,000,000 (20% Down: PKR 19,000,000)",
            "12x Quarterly Installments of PKR 6,333,333",
            "Processing Fee: PKR 30,000/- (Non-Refundable)"
        ],
        installments: {
            available: true,
            advance: 19000000,
            monthly: 6333333,
            durationMonths: 36,
            planDetails: "3-Year Quarterly Plan (12 Quarters of PKR 6,333,333) or Lump Sum PKR 81,450,625"
        },
        agentId: "user_002",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },

    // 6. BALLOT 2: 133.25 Sq Yds (5.33 Marla) Commercial Plot
    {
        id: "prop-dha-margalla-ballot-2-133-sq-yds",
        slug: "dha-margalla-enclave-133-sq-yds-commercial-plot-ballot-2",
        title: "133.25 Sq Yds (5.33 Marla) Commercial Plot - Ballot 2",
        tagline: "Main commercial markaz plot in DHA Margalla Enclave for retail plazas & corporate hubs",
        description: "Prominent 133.25 Sq. Yds. (approx 5.33 Marla) commercial plot in DHA Margalla Enclave Islamabad (Ballot 2). Available on Lump Sum price of PKR 120,032,500 (within 30 days) or 1-Year (PKR 126,350,000), 2-Year (PKR 133,000,000), and 3-Year (PKR 140,000,000) payment plans with 20% down payment (PKR 28,000,000) and 12 quarterly installments of PKR 9,333,333. Non-refundable processing fee: PKR 40,000/-.",
        type: "commercial_plot",
        category: "Commercial Plots",
        purpose: "sale",
        price: 120032500,
        priceUnit: "PKR",
        size: 5.33,
        sqYards: 133.25,
        sizeUnit: "Marla",
        bedrooms: 0,
        bathrooms: 0,
        city: "Islamabad",
        area: "DHA Margalla Enclave",
        sector: "Central Commercial Markaz",
        address: "Central Commercial Markaz, DHA Margalla Enclave",
        societyId: "dha-margalla-enclave",
        location: "Central Commercial Markaz, DHA Margalla Enclave, Islamabad",
        isFeatured: true,
        isNewProject: false,
        urgency: "hot",
        status: "published",
        developer: "Defence Housing Authority (DHA)",
        constructionStatus: "Balloted Commercial Plot",
        deliveryDate: "Immediate Transfer",
        images: [
            { url: "assets/images/dha-comm-boulevard.jpg", isPrimary: true, alt: "133.25 Sq Yds Commercial Plot DHA Margalla Enclave" },
            { url: "assets/images/dha-comm-100sqyds.jpg", isPrimary: false, alt: "DHA Margalla Retail Arcade" },
            { url: "assets/images/dha-commercial-plots.jpg", isPrimary: false, alt: "DHA Margalla Commercial Grid" },
            { url: "assets/images/dha-masterplan.jpg", isPrimary: false, alt: "Masterplan Map" }
        ],
        features: [
            "Ballot 2 Official Commercial Allotment",
            "Lump Sum Price: PKR 120,032,500",
            "1-Year Plan: PKR 126,350,000 (20% Down: PKR 25,270,000)",
            "2-Year Plan: PKR 133,000,000 (20% Down: PKR 26,600,000)",
            "3-Year Plan: PKR 140,000,000 (20% Down: PKR 28,000,000)",
            "12x Quarterly Installments of PKR 9,333,333",
            "Processing Fee: PKR 40,000/- (Non-Refundable)"
        ],
        installments: {
            available: true,
            advance: 28000000,
            monthly: 9333333,
            durationMonths: 36,
            planDetails: "3-Year Quarterly Plan (12 Quarters of PKR 9,333,333) or Lump Sum PKR 120,032,500"
        },
        agentId: "user_002",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },

    // 7. BALLOT 2: 200 Sq Yds (8 Marla) Commercial Plot
    {
        id: "prop-dha-margalla-ballot-2-200-sq-yds",
        slug: "dha-margalla-enclave-200-sq-yds-commercial-plot-ballot-2",
        title: "200 Sq Yds (8 Marla) Commercial Plot - Ballot 2",
        tagline: "Large commercial plaza plot on 120-ft Avenue in DHA Margalla Enclave",
        description: "Prestigious 200 Sq. Yds. (approx 8 Marla) commercial boulevard plot in DHA Margalla Enclave Islamabad (Ballot 2). Available on Lump Sum price of PKR 145,753,750 (within 30 days) or 1-Year (PKR 153,425,000), 2-Year (PKR 161,500,000), and 3-Year (PKR 170,000,000) payment plans with 20% down payment (PKR 34,000,000) and 12 quarterly installments of PKR 11,333,333. Non-refundable processing fee: PKR 50,000/-.",
        type: "commercial_plot",
        category: "Commercial Plots",
        purpose: "sale",
        price: 145753750,
        priceUnit: "PKR",
        size: 8,
        sqYards: 200,
        sizeUnit: "Marla",
        bedrooms: 0,
        bathrooms: 0,
        city: "Islamabad",
        area: "DHA Margalla Enclave",
        sector: "Main 120-ft Avenue Boulevard",
        address: "Main 120-ft Avenue Boulevard, DHA Margalla Enclave",
        societyId: "dha-margalla-enclave",
        location: "Main Boulevard Commercial, DHA Margalla Enclave, Islamabad",
        isFeatured: true,
        isNewProject: false,
        urgency: "super-hot",
        status: "published",
        developer: "Defence Housing Authority (DHA)",
        constructionStatus: "Balloted Commercial Plot",
        deliveryDate: "Immediate Transfer",
        images: [
            { url: "assets/images/dha-commercial-plots.jpg", isPrimary: true, alt: "200 Sq Yds Commercial Plot DHA Margalla Enclave" },
            { url: "assets/images/dha-comm-boulevard.jpg", isPrimary: false, alt: "DHA Margalla Commercial Boulevard" },
            { url: "assets/images/dha-comm-500sqyds.jpg", isPrimary: false, alt: "DHA Margalla Commercial Hub" },
            { url: "assets/images/dha-masterplan.jpg", isPrimary: false, alt: "Masterplan Map" }
        ],
        features: [
            "Ballot 2 Official Commercial Allotment",
            "Lump Sum Price: PKR 145,753,750",
            "1-Year Plan: PKR 153,425,000 (20% Down: PKR 30,685,000)",
            "2-Year Plan: PKR 161,500,000 (20% Down: PKR 32,300,000)",
            "3-Year Plan: PKR 170,000,000 (20% Down: PKR 34,000,000)",
            "12x Quarterly Installments of PKR 11,333,333",
            "Processing Fee: PKR 50,000/- (Non-Refundable)"
        ],
        installments: {
            available: true,
            advance: 34000000,
            monthly: 11333333,
            durationMonths: 36,
            planDetails: "3-Year Quarterly Plan (12 Quarters of PKR 11,333,333) or Lump Sum PKR 145,753,750"
        },
        agentId: "user_002",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },

    // 8. BALLOT 2: 500 Sq Yds (20 Marla / 1 Kanal) Commercial Plot
    {
        id: "prop-dha-margalla-ballot-2-500-sq-yds",
        slug: "dha-margalla-enclave-500-sq-yds-commercial-plot-ballot-2",
        title: "500 Sq Yds (20 Marla / 1 Kanal) Commercial Mega Plot - Ballot 2",
        tagline: "Flagship 500 Sq. Yds. commercial mega-site for shopping mall, hotel or corporate headquarters",
        description: "Grand 500 Sq. Yds. (20 Marla / 1 Kanal) prime commercial mega-site in DHA Margalla Enclave Islamabad (Ballot 2). Ideal for shopping malls, mixed-use towers, brand hotels, and corporate complexes. Available on Lump Sum price of PKR 342,950,000 (within 30 days) or 1-Year (PKR 361,000,000), 2-Year (PKR 380,000,000), and 3-Year (PKR 400,000,000) payment plans with 20% down payment (PKR 80,000,000) and 12 quarterly installments of PKR 26,666,667. Non-refundable processing fee: PKR 60,000/-.",
        type: "commercial_plot",
        category: "Commercial Plots",
        purpose: "sale",
        price: 342950000,
        priceUnit: "PKR",
        size: 20,
        sqYards: 500,
        sizeUnit: "Marla",
        bedrooms: 0,
        bathrooms: 0,
        city: "Islamabad",
        area: "DHA Margalla Enclave",
        sector: "Avenue Central Commercial Hub",
        address: "Avenue Central Commercial Hub, DHA Margalla Enclave",
        societyId: "dha-margalla-enclave",
        location: "Avenue Central Commercial Hub, DHA Margalla Enclave, Islamabad",
        isFeatured: true,
        isNewProject: false,
        urgency: "super-hot",
        status: "published",
        developer: "Defence Housing Authority (DHA)",
        constructionStatus: "Balloted Commercial Mega Plot",
        deliveryDate: "Immediate Transfer",
        images: [
            { url: "assets/images/dha-comm-500sqyds.jpg", isPrimary: true, alt: "500 Sq Yds Commercial Plot DHA Margalla Enclave" },
            { url: "assets/images/dha-comm-boulevard.jpg", isPrimary: false, alt: "DHA Margalla Commercial Boulevard" },
            { url: "assets/images/dha-commercial-plots.jpg", isPrimary: false, alt: "DHA Margalla Commercial Markaz" },
            { url: "assets/images/dha-masterplan.jpg", isPrimary: false, alt: "Masterplan Map" }
        ],
        features: [
            "Ballot 2 Flagship Commercial Mega-Site Allotment",
            "Lump Sum Price: PKR 342,950,000",
            "1-Year Plan: PKR 361,000,000 (20% Down: PKR 72,200,000)",
            "2-Year Plan: PKR 380,000,000 (20% Down: PKR 76,000,000)",
            "3-Year Plan: PKR 400,000,000 (20% Down: PKR 80,000,000)",
            "12x Quarterly Installments of PKR 26,666,667",
            "Processing Fee: PKR 60,000/- (Non-Refundable)"
        ],
        installments: {
            available: true,
            advance: 80000000,
            monthly: 26666667,
            durationMonths: 36,
            planDetails: "3-Year Quarterly Plan (12 Quarters of PKR 26,666,667) or Lump Sum PKR 342,950,000"
        },
        agentId: "user_002",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },

    // 9. BALLOT 3: 133.33 Sq Yds (LG+G+5) Commercial Plot
    {
        id: "prop-dha-margalla-ballot-3-133-sq-yds",
        slug: "dha-margalla-enclave-133-33-sq-yds-commercial-plot-ballot-3",
        title: "133.33 Sq Yds Commercial Plot (LG+G+5) - Ballot 3",
        tagline: "Approved Multi-Storey (LG+G+5) commercial plot in DHA Margalla Enclave with 1, 2 & 3-Year plans",
        description: "Official Ballot 3 approved multi-storey 133.33 Sq. Yds. (approx 5.33 Marla) commercial plot in DHA Margalla Enclave Islamabad. Approved for Lower Ground + Ground + 5 Floors construction. Available on Lump Sum price of PKR 135,830,000 (within 30 days) or 1-Year (PKR 143,820,000, 20% down: PKR 28,764,000), 2-Year (PKR 151,810,000, 20% down: PKR 30,362,000), and 3-Year (PKR 159,800,000, 20% down: PKR 31,960,000 with 12 quarterly installments of PKR 10,653,333). Non-refundable processing fee: PKR 40,000/-.",
        type: "commercial_plot",
        category: "Commercial Plots",
        purpose: "sale",
        price: 135830000,
        priceUnit: "PKR",
        size: 5.33,
        sqYards: 133.33,
        sizeUnit: "Marla",
        bedrooms: 0,
        bathrooms: 0,
        city: "Islamabad",
        area: "DHA Margalla Enclave",
        sector: "Commercial Sector LG+G+5",
        address: "Multi-Storey Commercial Boulevard, DHA Margalla Enclave",
        societyId: "dha-margalla-enclave",
        location: "Commercial Avenue (LG+G+5 Zone), DHA Margalla Enclave, Islamabad",
        isFeatured: true,
        isNewProject: false,
        urgency: "super-hot",
        status: "published",
        developer: "Defence Housing Authority (DHA)",
        constructionStatus: "Balloted LG+G+5 Commercial Plot",
        deliveryDate: "Immediate Transfer",
        images: [
            { url: "assets/images/dha-ballot3-133sqyds.jpg", isPrimary: true, alt: "133.33 Sq Yds Commercial Plot LG+G+5 DHA Margalla Enclave" },
            { url: "assets/images/dha-ballot3-chart.jpg", isPrimary: false, alt: "Ballot 3 Official Payment Plan Chart" },
            { url: "assets/images/dha-comm-boulevard.jpg", isPrimary: false, alt: "DHA Margalla Commercial Boulevard" },
            { url: "assets/images/dha-masterplan.jpg", isPrimary: false, alt: "Masterplan Map" }
        ],
        features: [
            "Ballot 3 Approved Multi-Storey Commercial Plot",
            "Permitted Height: Lower Ground + Ground + 5 Floors (LG+G+5)",
            "Lump Sum Price: PKR 135,830,000 (Within 30 Days)",
            "1-Year Plan: PKR 143,820,000 (20% Down: PKR 28,764,000)",
            "2-Year Plan: PKR 151,810,000 (20% Down: PKR 30,362,000)",
            "3-Year Plan: PKR 159,800,000 (20% Down: PKR 31,960,000)",
            "12x Quarterly Installments of PKR 10,653,333",
            "Processing Fee: PKR 40,000/- (Non-Refundable)"
        ],
        installments: {
            available: true,
            advance: 31960000,
            monthly: 10653333,
            durationMonths: 36,
            planDetails: "3-Year Quarterly Plan (12 Quarters of PKR 10,653,333) or Lump Sum PKR 135,830,000"
        },
        agentId: "user_002",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },

    // 10. BALLOT 3: 200 Sq Yds (LG+G+5) Commercial Plot
    {
        id: "prop-dha-margalla-ballot-3-200-sq-yds",
        slug: "dha-margalla-enclave-200-sq-yds-commercial-plot-ballot-3",
        title: "200 Sq Yds Commercial Plot (LG+G+5) - Ballot 3",
        tagline: "Prime 200 Sq. Yds. multi-storey commercial plot approved for 6 floors (LG+G+5)",
        description: "Official Ballot 3 approved multi-storey 200 Sq. Yds. (approx 8 Marla) commercial plot in DHA Margalla Enclave Islamabad. Approved for Lower Ground + Ground + 5 Floors construction. Available on Lump Sum price of PKR 196,520,000 (within 30 days) or 1-Year (PKR 208,080,000, 20% down: PKR 41,616,000), 2-Year (PKR 219,640,000, 20% down: PKR 43,928,000), and 3-Year (PKR 231,200,000, 20% down: PKR 46,240,000 with 12 quarterly installments of PKR 15,413,333). Non-refundable processing fee: PKR 50,000/-.",
        type: "commercial_plot",
        category: "Commercial Plots",
        purpose: "sale",
        price: 196520000,
        priceUnit: "PKR",
        size: 8,
        sqYards: 200,
        sizeUnit: "Marla",
        bedrooms: 0,
        bathrooms: 0,
        city: "Islamabad",
        area: "DHA Margalla Enclave",
        sector: "Commercial Sector LG+G+5",
        address: "Central Commercial Boulevard LG+G+5, DHA Margalla Enclave",
        societyId: "dha-margalla-enclave",
        location: "Central Commercial Boulevard, DHA Margalla Enclave, Islamabad",
        isFeatured: true,
        isNewProject: false,
        urgency: "super-hot",
        status: "published",
        developer: "Defence Housing Authority (DHA)",
        constructionStatus: "Balloted LG+G+5 Commercial Plot",
        deliveryDate: "Immediate Transfer",
        images: [
            { url: "assets/images/dha-ballot3-200sqyds.jpg", isPrimary: true, alt: "200 Sq Yds Commercial Plot LG+G+5 DHA Margalla Enclave" },
            { url: "assets/images/dha-ballot3-chart.jpg", isPrimary: false, alt: "Ballot 3 Official Payment Plan Chart" },
            { url: "assets/images/dha-commercial-plots.jpg", isPrimary: false, alt: "DHA Margalla Commercial Boulevard" },
            { url: "assets/images/dha-masterplan.jpg", isPrimary: false, alt: "Masterplan Map" }
        ],
        features: [
            "Ballot 3 Approved Multi-Storey Commercial Plot",
            "Permitted Height: Lower Ground + Ground + 5 Floors (LG+G+5)",
            "Lump Sum Price: PKR 196,520,000 (Within 30 Days)",
            "1-Year Plan: PKR 208,080,000 (20% Down: PKR 41,616,000)",
            "2-Year Plan: PKR 219,640,000 (20% Down: PKR 43,928,000)",
            "3-Year Plan: PKR 231,200,000 (20% Down: PKR 46,240,000)",
            "12x Quarterly Installments of PKR 15,413,333",
            "Processing Fee: PKR 50,000/- (Non-Refundable)"
        ],
        installments: {
            available: true,
            advance: 46240000,
            monthly: 15413333,
            durationMonths: 36,
            planDetails: "3-Year Quarterly Plan (12 Quarters of PKR 15,413,333) or Lump Sum PKR 196,520,000"
        },
        agentId: "user_002",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },

    // 11. BALLOT 3: 266.66 Sq Yds (LG+G+5) Commercial Plot
    {
        id: "prop-dha-margalla-ballot-3-266-sq-yds",
        slug: "dha-margalla-enclave-266-66-sq-yds-commercial-plot-ballot-3",
        title: "266.66 Sq Yds Commercial Plot (LG+G+5) - Ballot 3",
        tagline: "Grand multi-storey commercial plaza site (LG+G+5) in DHA Margalla Enclave",
        description: "Official Ballot 3 approved multi-storey 266.66 Sq. Yds. (approx 10.66 Marla) commercial plot in DHA Margalla Enclave Islamabad. Approved for Lower Ground + Ground + 5 Floors construction. Available on Lump Sum price of PKR 201,535,000 (within 30 days) or 1-Year (PKR 213,390,000, 20% down: PKR 42,678,000), 2-Year (PKR 225,245,000, 20% down: PKR 45,049,000), and 3-Year (PKR 237,100,000, 20% down: PKR 47,420,000 with 12 quarterly installments of PKR 15,806,667). Non-refundable processing fee: PKR 60,000/-.",
        type: "commercial_plot",
        category: "Commercial Plots",
        purpose: "sale",
        price: 201535000,
        priceUnit: "PKR",
        size: 10.66,
        sqYards: 266.66,
        sizeUnit: "Marla",
        bedrooms: 0,
        bathrooms: 0,
        city: "Islamabad",
        area: "DHA Margalla Enclave",
        sector: "Commercial Sector LG+G+5",
        address: "Grand Commercial Boulevard LG+G+5, DHA Margalla Enclave",
        societyId: "dha-margalla-enclave",
        location: "Grand Commercial Boulevard, DHA Margalla Enclave, Islamabad",
        isFeatured: true,
        isNewProject: false,
        urgency: "super-hot",
        status: "published",
        developer: "Defence Housing Authority (DHA)",
        constructionStatus: "Balloted LG+G+5 Commercial Plot",
        deliveryDate: "Immediate Transfer",
        images: [
            { url: "assets/images/dha-ballot3-266sqyds.jpg", isPrimary: true, alt: "266.66 Sq Yds Commercial Plot LG+G+5 DHA Margalla Enclave" },
            { url: "assets/images/dha-ballot3-chart.jpg", isPrimary: false, alt: "Ballot 3 Official Payment Plan Chart" },
            { url: "assets/images/dha-comm-500sqyds.jpg", isPrimary: false, alt: "DHA Margalla Commercial Complex" },
            { url: "assets/images/dha-masterplan.jpg", isPrimary: false, alt: "Masterplan Map" }
        ],
        features: [
            "Ballot 3 Approved Multi-Storey Commercial Plot",
            "Permitted Height: Lower Ground + Ground + 5 Floors (LG+G+5)",
            "Lump Sum Price: PKR 201,535,000 (Within 30 Days)",
            "1-Year Plan: PKR 213,390,000 (20% Down: PKR 42,678,000)",
            "2-Year Plan: PKR 225,245,000 (20% Down: PKR 45,049,000)",
            "3-Year Plan: PKR 237,100,000 (20% Down: PKR 47,420,000)",
            "12x Quarterly Installments of PKR 15,806,667",
            "Processing Fee: PKR 60,000/- (Non-Refundable)"
        ],
        installments: {
            available: true,
            advance: 47420000,
            monthly: 15806667,
            durationMonths: 36,
            planDetails: "3-Year Quarterly Plan (12 Quarters of PKR 15,806,667) or Lump Sum PKR 201,535,000"
        },
        agentId: "user_002",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    }
];

const DEFAULT_BLOGS = [
    {
        id: "blog-dha-margalla-enclave-ballot-guide",
        slug: "dha-margalla-enclave-ballot-1-ballot-2-complete-payment-plan-guide",
        title: "DHA Margalla Enclave Ballot 1 & Ballot 2: Official Payment Plans, Prices & Plot Sizes",
        excerpt: "Comprehensive breakdown of DHA Margalla Enclave's residential (125, 250, 500 Sq Yds) and commercial (100, 133.25, 200, 500 Sq Yds) plot payment schedules, 20% down payment deadlines, and processing fees.",
        content: "<p class='lead'>DHA Margalla Enclave Islamabad has announced official payment schedules for Ballot 1 (Residential Plots) and Ballot 2 (Commercial Plots), providing investors and home builders with flexible options ranging from Lump Sum settlement to 1, 2, and 3-Year quarterly installment plans.</p><h3>1. Ballot 1 — Residential Plots</h3><p>Residential plot inventory covers three highly sought-after categories: <strong>125 Sq. Yds. (approx 5 Marla)</strong> starting at PKR 21,434,375 (Lump Sum), <strong>250 Sq. Yds. (10 Marla)</strong> at PKR 42,011,375 (Lump Sum), and <strong>500 Sq. Yds. (1 Kanal)</strong> at PKR 72,876,875 (Lump Sum). All 3-year installment plans require a 20% down payment payable within 30 days of balloting, followed by 12 equal quarterly installments.</p><h3>2. Ballot 2 — Commercial Plots</h3><p>For high-yield retail and corporate investments, Ballot 2 commercial plots feature <strong>100 Sq. Yds. (4 Marla)</strong>, <strong>133.25 Sq. Yds. (5.33 Marla)</strong>, <strong>200 Sq. Yds. (8 Marla)</strong>, and <strong>500 Sq. Yds. (20 Marla / 1 Kanal)</strong> located on wide arterial boulevards and commercial hubs.</p><h3>3. Important Verification & Payment Timelines</h3><p>Successful applicants must ensure that their 20% down payment or Lump Sum settlement is deposited within 30 days of the ballot date to confirm allocation. All payments can be processed through official DHA challans at designated Askari Bank branches or online via Kuickpay.</p>",
        coverImage: "assets/images/dha-margalla-hero.jpg",
        category: "DHA Margalla Enclave",
        author: {
            name: "Ali Khan",
            role: "Principal Real Estate Consultant",
            avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80"
        },
        readTime: "5 min read",
        views: 4520,
        featured: true,
        status: "published",
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const DEFAULT_USERS = [
    {
        id: "user_admin_kp",
        uid: "usr_admin_kp",
        name: "KP Admin",
        email: "admin@kp.com",
        password: "tanzil@minhas2007",
        phone: "+923340091127",
        role: "admin",
        photoUrl: "assets/images/logo.png",
        specializedAreas: ["DHA Margalla Enclave", "Islamabad", "Rawalpindi"],
        allowMaintenanceAccess: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "user_001",
        uid: "usr_admin_default",
        name: "Ali Khan",
        email: "ali@kaghanproperties.com",
        password: "tanzil@minhas2007",
        phone: "+923340091127",
        role: "admin",
        photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80",
        specializedAreas: ["DHA Margalla Enclave Ballot 1", "DHA Margalla Enclave Ballot 2"],
        allowMaintenanceAccess: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "user_002",
        uid: "usr_agent_default",
        name: "Tanzil Minhas",
        email: "tanzilminhas2007@gmail.com",
        password: "Dhamargallla@2027",
        phone: "+923340091127",
        role: "admin",
        photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
        specializedAreas: ["DHA Margalla Enclave Commercial", "DHA Margalla Enclave Residential"],
        allowMaintenanceAccess: true,
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
        address: "Office 203, 2nd Floor, Asian Arcade, C Avenue, Sector C, Islamabad, Pakistan",
        googleMapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13270.2!2d72.9680!3d33.7250!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDQwJzAwLjgiTiA3M8KwMTEnMzUuNSJF!5e0!3m2!1sen!2spk!4v1700000000000!5m2!1sen!2spk"
    },
    social: {
        facebook: "https://facebook.com/kaghanproperties",
        instagram: "https://instagram.com/kaghanproperties",
        youtube: "https://youtube.com/@kaghanproperties"
    },
    seoDefaults: {
        defaultMetaTitleTemplate: "{pageTitle} – Kaghan Properties",
        defaultMetaDescription: "Official DHA Margalla Enclave Ballot 1 & Ballot 2 Payment Plans, Residential & Commercial Plots with Kaghan Properties."
    },
    features: {
        showBlog: true,
        showWhatsAppButton: true
    },
    underConstruction: {
        enabled: false,
        headline: "We Are Upgrading Our Digital Experience",
        subheadline: "Kaghan Properties is currently undergoing scheduled platform upgrades, infrastructure enhancements, and portfolio synchronization. We will be back online shortly.",
        estimatedEndTime: "",
        contactEmail: "info@kaghanproperties.com",
        contactPhone: "+923340091127",
        contactWhatsApp: "+923340091127",
        bypassPasscode: "KAGHAN-VIP-2026",
        allowedRoles: ["admin"],
        allowedEmails: ["tanzilminhas2007@gmail.com", "admin@kaghanproperties.com", "ali@kaghanproperties.com"],
        noticeBadge: "Scheduled Maintenance Mode",
        allowEmergencyContact: true,
        allowLeadCapture: true
    },
    updatedAt: new Date().toISOString()
};

// Top-Level Collection Helper
function getSubcollectionRef(subcollectionName) {
    if (!db) return null;
    return db.collection('kaghan_properties').doc('main').collection(subcollectionName);
}

// In-memory local fallback store if Firebase offline/connecting
let localStore = {
    users: [...DEFAULT_USERS],
    properties: [...DEFAULT_PROPERTIES],
    leads: [],
    societies: [...DEFAULT_SOCIETIES],
    categories: [...DEFAULT_CATEGORIES],
    cities: [...DEFAULT_CITIES],
    siteContent: { ...DEFAULT_SITE_CONTENT },
    blogPosts: [...DEFAULT_BLOGS],
    siteSettings: { ...DEFAULT_SITE_SETTINGS }
};

// Purge any stale mock property cache from localStorage (ensuring strictly DHA Margalla properties)
try {
    const cached = localStorage.getItem('kaghan_properties');
    if (cached) {
        const parsed = JSON.parse(cached);
        const hasStale = !Array.isArray(parsed) || parsed.length < DEFAULT_PROPERTIES.length || !cached.includes('ballot-3') || parsed.some(p => !p.id || !p.id.startsWith('prop-dha-margalla'));
        if (hasStale || cached.includes('Asian Arcade') || cached.includes('pine-valley') || cached.includes('bahria')) {
            localStorage.removeItem('kaghan_properties');
            localStorage.removeItem('kaghan_site_content');
            localStorage.removeItem('kaghan_societies');
        }
    }
} catch (e) {}

// Hydrate from localStorage if available
try {
    const savedCats = localStorage.getItem('kaghan_categories');
    if (savedCats) {
        try {
            const parsed = JSON.parse(savedCats);
            if (Array.isArray(parsed) && parsed.length >= 20) {
                localStore.categories = parsed;
            } else {
                localStore.categories = [...DEFAULT_CATEGORIES];
                localStorage.setItem('kaghan_categories', JSON.stringify(localStore.categories));
            }
        } catch (e) {
            localStore.categories = [...DEFAULT_CATEGORIES];
        }
    }

    const savedCities = localStorage.getItem('kaghan_cities');
    if (savedCities) localStore.cities = JSON.parse(savedCities);

    const savedSocs = localStorage.getItem('kaghan_societies');
    if (savedSocs) localStore.societies = JSON.parse(savedSocs);

    const savedProps = localStorage.getItem('kaghan_properties');
    if (savedProps) {
        try {
            const parsedProps = JSON.parse(savedProps);
            if (Array.isArray(parsedProps) && parsedProps.length >= DEFAULT_PROPERTIES.length && parsedProps.every(p => p.id && p.id.startsWith('prop-dha-margalla'))) {
                localStore.properties = parsedProps;
            } else {
                localStore.properties = [...DEFAULT_PROPERTIES];
                localStorage.setItem('kaghan_properties', JSON.stringify(localStore.properties));
            }
        } catch(e) {
            localStore.properties = [...DEFAULT_PROPERTIES];
        }
    } else {
        localStore.properties = [...DEFAULT_PROPERTIES];
    }

    const savedContent = localStorage.getItem('kaghan_site_content');
    if (savedContent) {
        try {
            const parsedContent = JSON.parse(savedContent);
            if (parsedContent && parsedContent.promoBanner && parsedContent.promoBanner.title && parsedContent.promoBanner.title.includes('DHA Margalla')) {
                localStore.siteContent = parsedContent;
            } else {
                localStore.siteContent = { ...DEFAULT_SITE_CONTENT };
                localStorage.setItem('kaghan_site_content', JSON.stringify(localStore.siteContent));
            }
        } catch (e) {
            localStore.siteContent = { ...DEFAULT_SITE_CONTENT };
        }
    }

    const savedSettings = localStorage.getItem('kaghan_site_settings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            localStore.siteSettings = {
                ...DEFAULT_SITE_SETTINGS,
                ...parsedSettings,
                underConstruction: {
                    ...DEFAULT_SITE_SETTINGS.underConstruction,
                    ...(parsedSettings.underConstruction || {})
                }
            };
        } catch (e) {
            localStore.siteSettings = { ...DEFAULT_SITE_SETTINGS };
        }
    }
} catch (e) {
    console.warn("Could not read from localStorage fallback cache:", e);
}

// Auto-seed and auto-sync Firestore on module load to guarantee clean DHA Margalla listings
async function seedFirestoreIfNeeded() {
    if (!db) return;
    try {
        const settingsRef = db.collection('kaghan_properties').doc('siteSettings');
        const snap = await settingsRef.get();
        if (!snap.exists) {
            await settingsRef.set({ doc: 'main', ...DEFAULT_SITE_SETTINGS });
        }

        // Sync siteContent document
        try {
            const contentRef = db.collection('kaghan_properties').doc('siteContent');
            const contentSnap = await contentRef.get();
            if (!contentSnap.exists) {
                await contentRef.set({ doc: 'main', ...DEFAULT_SITE_CONTENT });
            }
        } catch (e) {}

        // Check categories - ONLY seed if empty
        const catRef = getSubcollectionRef('categories');
        if (catRef) {
            const cSnap = await catRef.limit(1).get();
            if (cSnap.empty) {
                for (const c of DEFAULT_CATEGORIES) {
                    await catRef.doc(c.id).set(c, { merge: true });
                }
            }
        }

        // Check cities - ONLY seed if empty
        const cityRef = getSubcollectionRef('cities');
        if (cityRef) {
            const ciSnap = await cityRef.limit(1).get();
            if (ciSnap.empty) {
                for (const c of DEFAULT_CITIES) {
                    await cityRef.doc(c.id).set(c, { merge: true });
                }
            }
        }
        
        // Sync societies
        const socRef = getSubcollectionRef('societies');
        if (socRef) {
            for (const s of DEFAULT_SOCIETIES) {
                await socRef.doc(s.id).set(s, { merge: true });
            }
        }

        // Check users - ONLY seed if empty
        const usrRef = getSubcollectionRef('users');
        if (usrRef) {
            const uSnap = await usrRef.limit(1).get();
            if (uSnap.empty) {
                for (const u of DEFAULT_USERS) {
                    await usrRef.doc(u.id).set(u);
                }
            }
        }

        // Purge legacy properties and upsert all 8 DHA Margalla properties into Firestore
        const propRef = getSubcollectionRef('properties');
        if (propRef) {
            const pSnap = await propRef.get();
            const batch = db.batch();
            let opCount = 0;
            pSnap.forEach(doc => {
                const data = doc.data();
                const pid = String(data.id || doc.id);
                if (!pid.startsWith('prop-dha-margalla') && data.societyId !== 'dha-margalla-enclave') {
                    batch.delete(doc.ref);
                    opCount++;
                }
            });
            for (const p of DEFAULT_PROPERTIES) {
                batch.set(propRef.doc(p.id), p, { merge: true });
                opCount++;
            }
            if (opCount > 0) {
                await batch.commit();
            }
        }

        // Check blogPosts - ONLY seed if empty
        const blogRef = getSubcollectionRef('blogPosts');
        if (blogRef) {
            const bSnap = await blogRef.limit(1).get();
            if (bSnap.empty) {
                for (const b of DEFAULT_BLOGS) {
                    await blogRef.doc(b.id).set(b, { merge: true });
                }
            }
        }
    } catch (e) {
        console.warn("Firestore auto-seeding/sync skipped:", e);
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
    PROPERTY_TAXONOMY,
    DEFAULT_CATEGORIES,
    DEFAULT_SITE_CONTENT,
    DEFAULT_CITIES,
    DEFAULT_SOCIETIES,
    DEFAULT_PROPERTIES,
    DEFAULT_BLOGS,
    DEFAULT_USERS,
    DEFAULT_SITE_SETTINGS,

    formatPriceWithMagnitude: (priceInPKR) => {
        if (window.KaghanSharedUI && window.KaghanSharedUI.formatPrice) {
            return window.KaghanSharedUI.formatPrice(priceInPKR);
        }
        if (!priceInPKR) return 'Call for Price';
        if (priceInPKR >= 10000000) return `PKR ${(priceInPKR / 10000000).toFixed(2)} Crore`;
        if (priceInPKR >= 100000) return `PKR ${(priceInPKR / 100000).toFixed(2)} Lakh`;
        return `PKR ${priceInPKR.toLocaleString()}`;
    },

    convertAreaUnit: (marla) => {
        if (window.KaghanSharedUI && window.KaghanSharedUI.formatArea) {
            return window.KaghanSharedUI.formatArea(marla);
        }
        return `${marla} Marla`;
    },

    // Site Settings API
    getSiteSettings: async () => {
        try {
            if (db) {
                const snap = await db.collection('kaghan_properties').doc('siteSettings').get();
                if (snap.exists) {
                    const data = snap.data();
                    const merged = {
                        ...DEFAULT_SITE_SETTINGS,
                        ...data,
                        underConstruction: {
                            ...DEFAULT_SITE_SETTINGS.underConstruction,
                            ...((data && data.underConstruction) || {})
                        },
                        features: {
                            ...DEFAULT_SITE_SETTINGS.features,
                            ...((data && data.features) || {})
                        },
                        contact: {
                            ...DEFAULT_SITE_SETTINGS.contact,
                            ...((data && data.contact) || {})
                        },
                        social: {
                            ...DEFAULT_SITE_SETTINGS.social,
                            ...((data && data.social) || {})
                        }
                    };
                    localStore.siteSettings = merged;
                    localStorage.setItem('kaghan_site_settings', JSON.stringify(merged));
                    return merged;
                }
            }
        } catch (e) {
            console.error("Error fetching site settings from Firestore:", e);
        }
        return localStore.siteSettings;
    },

    saveSiteSettings: async (settings) => {
        settings.updatedAt = new Date().toISOString();
        const merged = {
            ...localStore.siteSettings,
            ...settings,
            underConstruction: {
                ...(localStore.siteSettings.underConstruction || DEFAULT_SITE_SETTINGS.underConstruction),
                ...((settings && settings.underConstruction) || {})
            }
        };

        try {
            if (db) {
                await db.collection('kaghan_properties').doc('siteSettings').set(merged, { merge: true });
            }
        } catch (e) {
            console.error("Error saving site settings:", e);
        }
        localStore.siteSettings = merged;
        localStorage.setItem('kaghan_site_settings', JSON.stringify(merged));
        
        // Dispatch event for instant UI reaction if any listener is active
        window.dispatchEvent(new CustomEvent('siteSettingsUpdated', { detail: merged }));
        return { success: true, settings: merged };
    },

    // Site Maintenance / Under-Construction API
    getMaintenanceSettings: async () => {
        const settings = await window.KaghanDB.getSiteSettings();
        const under = (settings && settings.underConstruction) ? settings.underConstruction : DEFAULT_SITE_SETTINGS.underConstruction;
        return {
            ...DEFAULT_SITE_SETTINGS.underConstruction,
            ...under
        };
    },

    setMaintenanceMode: async (enabled, config = {}) => {
        const settings = await window.KaghanDB.getSiteSettings();
        const currentUnder = settings.underConstruction || { ...DEFAULT_SITE_SETTINGS.underConstruction };
        const updatedUnder = {
            ...currentUnder,
            ...config,
            enabled: !!enabled,
            updatedAt: new Date().toISOString()
        };
        const res = await window.KaghanDB.saveSiteSettings({
            ...settings,
            underConstruction: updatedUnder
        });
        return { success: true, underConstruction: updatedUnder };
    },

    canUserBypassMaintenance: (settings, user, bypassKey) => {
        const maint = (settings && settings.underConstruction) ? settings.underConstruction : DEFAULT_SITE_SETTINGS.underConstruction;
        if (!maint || !maint.enabled) return { allowed: true, reason: 'maintenance_disabled' };

        // 1. Logged in Admin
        if (user && user.role === 'admin') {
            return { allowed: true, reason: 'admin' };
        }

        // 2. User has explicit allowMaintenanceAccess permission flag
        if (user && user.allowMaintenanceAccess === true) {
            return { allowed: true, reason: 'user_permission' };
        }

        // 3. User role is in allowedRoles
        const allowedRoles = Array.isArray(maint.allowedRoles) ? maint.allowedRoles : ['admin'];
        if (user && user.role && allowedRoles.includes(user.role)) {
            return { allowed: true, reason: 'role_allowed' };
        }

        // 4. User email is in whitelist
        const allowedEmails = Array.isArray(maint.allowedEmails) 
            ? maint.allowedEmails.map(e => String(e).toLowerCase().trim()) 
            : ['tanzilminhas2007@gmail.com', 'admin@kaghanproperties.com', 'ali@kaghanproperties.com'];
        if (user && user.email && allowedEmails.includes(String(user.email).toLowerCase().trim())) {
            return { allowed: true, reason: 'email_whitelisted' };
        }

        // 5. VIP Passcode match
        const configuredPasscode = (maint.bypassPasscode || 'KAGHAN-VIP-2026').trim();
        if (bypassKey && String(bypassKey).trim() === configuredPasscode) {
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
        if (user.role === 'admin') {
            user.allowMaintenanceAccess = true;
        } else if (user.allowMaintenanceAccess === undefined) {
            const existing = (localStore.users || []).find(u => u.id === user.id);
            user.allowMaintenanceAccess = existing ? !!existing.allowMaintenanceAccess : false;
        }
        if (!user.password) {
            const existing = (localStore.users || []).find(u => u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()));
            if (existing && existing.password) {
                user.password = existing.password;
            } else {
                user.password = "tanzil@minhas2007";
            }
        }
        try {
            if (db) {
                await getSubcollectionRef('users').doc(user.id).set(user, { merge: true });
                try {
                    await db.collection('users').doc(user.id).set(user, { merge: true });
                } catch(e) {}
            }
        } catch (e) {
            console.error("Error saving user:", e);
        }
        const index = localStore.users.findIndex(u => u.id === user.id);
        if (index >= 0) localStore.users[index] = user;
        else localStore.users.push(user);
        return { success: true, id: user.id, user };
    },

    setUserPassword: async (userIdOrEmail, newPassword) => {
        if (!userIdOrEmail || !newPassword) {
            return { success: false, message: "User identifier and password are required" };
        }
        const norm = String(userIdOrEmail).toLowerCase().trim();
        const users = await window.KaghanDB.getUsers();
        const user = users.find(u => (u.id && u.id.toLowerCase() === norm) || (u.email && u.email.toLowerCase() === norm) || (u.uid && u.uid.toLowerCase() === norm));
        
        if (!user) {
            return { success: false, message: "User account not found" };
        }

        user.password = String(newPassword).trim();
        user.updatedAt = new Date().toISOString();

        try {
            if (db) {
                await getSubcollectionRef('users').doc(user.id).set(user, { merge: true });
                try {
                    await db.collection('users').doc(user.id).set(user, { merge: true });
                } catch(e) {}
            }
        } catch (e) {
            console.error("Error updating user password in Firestore:", e);
        }

        const idx = localStore.users.findIndex(u => u.id === user.id);
        if (idx >= 0) localStore.users[idx] = user;
        else localStore.users.push(user);

        return { success: true, message: `Password for ${user.name} (${user.email}) updated successfully!`, user };
    },

    deleteUser: async (id) => {
        try {
            if (db) {
                await getSubcollectionRef('users').doc(id).delete();
                try {
                    await db.collection('users').doc(id).delete();
                } catch(e) {}
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
                const validList = [];
                const staleDocIds = [];
                snap.forEach(doc => {
                    const data = doc.data();
                    const pid = String(data.id || doc.id);
                    if (pid.startsWith('prop-dha-margalla') || data.societyId === 'dha-margalla-enclave') {
                        validList.push(data);
                    } else {
                        staleDocIds.push(doc.id);
                    }
                });

                // Asynchronously purge stale docs
                if (staleDocIds.length > 0) {
                    staleDocIds.forEach(id => {
                        getSubcollectionRef('properties').doc(id).delete().catch(() => {});
                    });
                }

                // If Firestore is missing default DHA properties, merge from DEFAULT_PROPERTIES
                for (const defP of DEFAULT_PROPERTIES) {
                    if (!validList.some(p => p.id === defP.id)) {
                        validList.push(defP);
                        getSubcollectionRef('properties').doc(defP.id).set(defP, { merge: true }).catch(() => {});
                    }
                }

                list = validList;
                localStore.properties = list;
                try {
                    localStorage.setItem('kaghan_properties', JSON.stringify(list));
                } catch (err) {}
            }
        } catch (e) {
            console.error("Error getting properties from Firestore:", e);
        }
        if (list.length === 0) {
            list = [...DEFAULT_PROPERTIES];
            localStore.properties = list;
        }

        // Strictly enforce DHA Margalla property filtering
        return list.filter(p => {
            const pid = String(p.id || '');
            if (!pid.startsWith('prop-dha-margalla') && p.societyId !== 'dha-margalla-enclave') {
                return false;
            }

            if (filters.status && p.status !== filters.status) return false;
            if (filters.type && filters.type !== 'all' && p.type !== filters.type) return false;
            if (filters.purpose && filters.purpose !== 'all' && p.purpose !== filters.purpose) return false;
            if (filters.city && filters.city !== 'all' && p.city && p.city.toLowerCase() !== filters.city.toLowerCase()) return false;
            if (filters.area && filters.area !== 'all' && p.area && !p.area.toLowerCase().includes(filters.area.toLowerCase())) return false;
            if (filters.minPrice && p.price < filters.minPrice) return false;
            if (filters.maxPrice && p.price > filters.maxPrice) return false;
            if (filters.bedrooms && p.bedrooms < filters.bedrooms) return false;
            return true;
        }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    },

    getPropertyBySlugOrId: async (slugOrId) => {
        if (!slugOrId) return null;
        const norm = String(slugOrId).toLowerCase().trim();
        const all = await window.KaghanDB.getProperties();
        return all.find(p => (p.slug && p.slug.toLowerCase() === norm) || (p.id && String(p.id).toLowerCase() === norm)) || null;
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

        try {
            localStorage.setItem('kaghan_properties', JSON.stringify(localStore.properties));
        } catch (err) {}

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
        try {
            localStorage.setItem('kaghan_properties', JSON.stringify(localStore.properties));
        } catch (err) {}
        return true;
    },

    getLocationListingCounts: async () => {
        const properties = await window.KaghanDB.getProperties();
        const counts = {};
        for (const p of properties) {
            if (p.area) {
                const a = p.area.trim();
                counts[a] = (counts[a] || 0) + 1;
            }
            if (p.city) {
                const c = p.city.trim();
                counts[c] = (counts[c] || 0) + 1;
            }
        }
        return counts;
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
        try {
            localStorage.setItem('kaghan_leads', JSON.stringify(localStore.leads));
        } catch (err) {}
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

    // =========================================================================
    // Dynamic Categories & Property Types API
    // =========================================================================
    getCategories: async (onlyActive = false) => {
        let list = [];
        try {
            if (db) {
                const snap = await getSubcollectionRef('categories').get();
                snap.forEach(doc => list.push(doc.data()));
            }
        } catch (e) {
            console.error("Error getting categories:", e);
        }
        if (list.length === 0) list = localStore.categories;
        if (onlyActive) {
            list = list.filter(c => c.isActive !== false);
        }
        return list.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
    },

    getCategoryByIdOrSlug: async (idOrSlug) => {
        const all = await window.KaghanDB.getCategories(false);
        return all.find(c => c.id === idOrSlug || c.slug === idOrSlug) || null;
    },

    saveCategory: async (category) => {
        category.updatedAt = new Date().toISOString();
        if (!category.createdAt) category.createdAt = new Date().toISOString();
        if (!category.id) category.id = category.slug || `cat_${Date.now()}`;
        if (!category.slug) category.slug = category.id;
        if (typeof category.isActive === 'undefined') category.isActive = true;

        try {
            if (db) {
                await getSubcollectionRef('categories').doc(category.id).set(category, { merge: true });
            }
        } catch (e) {
            console.error("Error saving category:", e);
        }

        const idx = localStore.categories.findIndex(c => c.id === category.id);
        if (idx >= 0) localStore.categories[idx] = category;
        else localStore.categories.push(category);

        try {
            localStorage.setItem('kaghan_categories', JSON.stringify(localStore.categories));
        } catch (err) {}

        return { success: true, id: category.id };
    },

    deleteCategory: async (id) => {
        try {
            if (db) {
                await getSubcollectionRef('categories').doc(id).delete();
            }
        } catch (e) {
            console.error("Error deleting category:", e);
        }
        localStore.categories = localStore.categories.filter(c => c.id !== id);
        try {
            localStorage.setItem('kaghan_categories', JSON.stringify(localStore.categories));
        } catch (err) {}
        return true;
    },

    // =========================================================================
    // Dynamic Locations / Cities API
    // =========================================================================
    getCities: async (onlyActive = false) => {
        let list = [];
        try {
            if (db) {
                const snap = await getSubcollectionRef('cities').get();
                snap.forEach(doc => list.push(doc.data()));
            }
        } catch (e) {
            console.error("Error getting cities:", e);
        }
        if (list.length === 0) list = localStore.cities;
        if (onlyActive) {
            list = list.filter(c => c.isActive !== false);
        }
        return list.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
    },

    getCityByIdOrSlug: async (idOrSlug) => {
        const all = await window.KaghanDB.getCities(false);
        return all.find(c => c.id === idOrSlug || c.slug === idOrSlug || c.name.toLowerCase() === idOrSlug.toLowerCase()) || null;
    },

    saveCity: async (city) => {
        city.updatedAt = new Date().toISOString();
        if (!city.createdAt) city.createdAt = new Date().toISOString();
        if (!city.id) city.id = city.slug || `city_${Date.now()}`;
        if (!city.slug) city.slug = city.id;
        if (typeof city.isActive === 'undefined') city.isActive = true;

        try {
            if (db) {
                await getSubcollectionRef('cities').doc(city.id).set(city, { merge: true });
            }
        } catch (e) {
            console.error("Error saving city:", e);
        }

        const idx = localStore.cities.findIndex(c => c.id === city.id);
        if (idx >= 0) localStore.cities[idx] = city;
        else localStore.cities.push(city);

        try {
            localStorage.setItem('kaghan_cities', JSON.stringify(localStore.cities));
        } catch (err) {}

        return { success: true, id: city.id };
    },

    deleteCity: async (id) => {
        try {
            if (db) {
                await getSubcollectionRef('cities').doc(id).delete();
            }
        } catch (e) {
            console.error("Error deleting city:", e);
        }
        localStore.cities = localStore.cities.filter(c => c.id !== id);
        try {
            localStorage.setItem('kaghan_cities', JSON.stringify(localStore.cities));
        } catch (err) {}
        return true;
    },

    // =========================================================================
    // Societies & Prime Areas API
    // =========================================================================
    getSocieties: async (filterCity = null, onlyActive = false) => {
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
        if (filterCity && filterCity !== 'all') {
            list = list.filter(s => (s.city || '').toLowerCase() === filterCity.toLowerCase());
        }
        if (onlyActive) {
            list = list.filter(s => s.isActive !== false);
        }
        return list;
    },

    saveSociety: async (society) => {
        society.updatedAt = new Date().toISOString();
        if (!society.createdAt) society.createdAt = new Date().toISOString();
        if (!society.id) society.id = society.slug || `soc_${Date.now()}`;
        if (!society.slug) society.slug = society.id;
        if (typeof society.isActive === 'undefined') society.isActive = true;

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

        try {
            localStorage.setItem('kaghan_societies', JSON.stringify(localStore.societies));
        } catch (err) {}

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
        try {
            localStorage.setItem('kaghan_societies', JSON.stringify(localStore.societies));
        } catch (err) {}
        return true;
    },

    // =========================================================================
    // Site Content & Homepage Modules API
    // =========================================================================
    getSiteContent: async () => {
        try {
            if (db) {
                const snap = await db.collection('kaghan_properties').doc('siteContent').get();
                if (snap.exists) {
                    const data = snap.data();
                    const merged = { ...DEFAULT_SITE_CONTENT, ...data };
                    if (!merged.browseProperties || merged.browseProperties.length === 0) {
                        merged.browseProperties = [...DEFAULT_SITE_CONTENT.browseProperties];
                    }
                    merged.browseProperties = (merged.browseProperties || []).map(item => {
                        const u = item.url || item.link || 'projects.html';
                        return { ...item, url: u, link: u };
                    });
                    localStore.siteContent = merged;
                    return localStore.siteContent;
                }
            }
        } catch (e) {
            console.error("Error reading siteContent from Firestore:", e);
        }
        const res = localStore.siteContent || { ...DEFAULT_SITE_CONTENT };
        if (res && res.browseProperties) {
            res.browseProperties = res.browseProperties.map(item => {
                const u = item.url || item.link || 'projects.html';
                return { ...item, url: u, link: u };
            });
        }
        return res;
    },

    saveSiteContent: async (content) => {
        content.updatedAt = new Date().toISOString();
        if (content.browseProperties) {
            content.browseProperties = content.browseProperties.map(item => {
                const u = item.url || item.link || 'projects.html';
                return { ...item, url: u, link: u };
            });
        }
        try {
            if (db) {
                await db.collection('kaghan_properties').doc('siteContent').set(content, { merge: true });
            }
        } catch (e) {
            console.error("Error saving siteContent:", e);
        }
        localStore.siteContent = { ...localStore.siteContent, ...content };
        try {
            localStorage.setItem('kaghan_site_content', JSON.stringify(localStore.siteContent));
        } catch (err) {}
        return { success: true };
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

    // Authentication API (Firebase Auth + Firestore DB Users + Fallback)
    login: async (email, password) => {
        const normEmail = email.toLowerCase().trim();
        const pass = String(password || '').trim();

        // 1. Attempt Firebase Auth if available
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
                    expiry: new Date().getTime() + (8 * 60 * 60 * 1000)
                };
                localStorage.setItem('kaghan_corp_session', JSON.stringify(session));
                return { success: true, session };
            } catch (authErr) {
                console.warn("Firebase Auth sign-in failed, checking Firestore database credentials:", authErr.message);
            }
        }

        // 2. Check live users in Firestore & local database
        try {
            const users = await window.KaghanDB.getUsers();
            const matchedUser = users.find(u => u.email && u.email.toLowerCase().trim() === normEmail);
            if (matchedUser && matchedUser.password && matchedUser.password === pass) {
                const session = {
                    uid: matchedUser.uid || matchedUser.id || 'usr_' + Date.now(),
                    id: matchedUser.id || matchedUser.uid,
                    name: matchedUser.name || matchedUser.email,
                    email: normEmail,
                    role: matchedUser.role || 'admin',
                    photoUrl: matchedUser.photoUrl || '',
                    expiry: new Date().getTime() + (8 * 60 * 60 * 1000)
                };
                localStorage.setItem('kaghan_corp_session', JSON.stringify(session));
                return { success: true, session };
            }
        } catch (dbErr) {
            console.warn("Error checking database credentials:", dbErr);
        }

        // 3. Fallback admin login credentials check
        const adminCredentials = {
            'tanzilminhas2007@gmail.com': 'Dhamargallla@2027',
            'tanzilminhas@kaghanproperties.com': 'Dhamargallla@2027',
            'admin@kp.com': 'tanzil@minhas2007',
            'admin@kaghanproperties.com': 'tanzil@minhas2007',
            'admin@kaghan.com': 'tanzil@minhas2007',
            'ali@kaghanproperties.com': 'tanzil@minhas2007'
        };

        if (adminCredentials[normEmail] && pass === adminCredentials[normEmail]) {
            const isTanzil = normEmail.includes('tanzil');
            const session = {
                uid: isTanzil ? 'usr_tanzil_admin' : 'usr_admin_kp',
                id: isTanzil ? 'user_tanzil_admin' : 'user_admin_kp',
                name: isTanzil ? 'Tanzil Minhas' : 'KP Admin',
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
    },

    // Standard Area Units Supported across Pakistan Real Estate Marketplace
    AREA_UNITS: [
        { key: "marla", name: "Marla", sqftFactor: 225, label: "Marla" },
        { key: "sqft", name: "Square Feet", sqftFactor: 1, label: "Sq. Ft." },
        { key: "sqyd", name: "Square Yards", sqftFactor: 9, label: "Sq. Yd." },
        { key: "sqm", name: "Square Meters", sqftFactor: 10.76391, label: "Sq. M." },
        { key: "kanal", name: "Kanal", sqftFactor: 4500, label: "Kanal" }
    ],

    convertAreaUnit: (value, fromUnit = 'marla', toUnit = 'marla') => {
        const units = {
            marla: 225,
            sqft: 1,
            sqyd: 9,
            sqm: 10.76391,
            kanal: 4500
        };
        const val = parseFloat(value) || 0;
        const fromFactor = units[(fromUnit || 'marla').toLowerCase()] || 225;
        const toFactor = units[(toUnit || 'marla').toLowerCase()] || 225;
        const sqft = val * fromFactor;
        return sqft / toFactor;
    },

    seedDatabase: async (force = false) => {
        if (!db) return { success: false, error: "Firestore SDK not available" };
        const results = {
            cities: 0,
            categories: 0,
            societies: 0,
            users: 0,
            properties: 0,
            blogPosts: 0,
            siteSettings: 0,
            siteContent: 0
        };

        try {
            // 1. Root Site Settings
            await db.collection('kaghan_properties').doc('siteSettings').set({ doc: 'main', ...DEFAULT_SITE_SETTINGS }, { merge: true });
            results.siteSettings = 1;

            // 2. Root Site Content
            await db.collection('kaghan_properties').doc('siteContent').set({ doc: 'main', ...DEFAULT_SITE_CONTENT }, { merge: true });
            results.siteContent = 1;

            // 3. Subcollection helper
            const writeSubDocs = async (colName, list, key) => {
                const colRef = getSubcollectionRef(colName);
                if (!colRef) return;
                for (const item of list) {
                    const id = item.id || item.slug || `doc_${Date.now()}`;
                    await colRef.doc(id).set(item, { merge: true });
                    // Also write to root collection for cross-compatibility
                    try {
                        await db.collection(colName).doc(id).set(item, { merge: true });
                    } catch (err) {}
                    results[key]++;
                }
            };

            await writeSubDocs('cities', DEFAULT_CITIES, 'cities');
            await writeSubDocs('categories', DEFAULT_CATEGORIES, 'categories');
            await writeSubDocs('societies', DEFAULT_SOCIETIES, 'societies');
            await writeSubDocs('users', DEFAULT_USERS, 'users');
            await writeSubDocs('properties', DEFAULT_PROPERTIES, 'properties');
            await writeSubDocs('blogPosts', DEFAULT_BLOGS, 'blogPosts');

            // Sync local store
            localStore.cities = [...DEFAULT_CITIES];
            localStore.categories = [...DEFAULT_CATEGORIES];
            localStore.societies = [...DEFAULT_SOCIETIES];
            localStore.users = [...DEFAULT_USERS];
            localStore.properties = [...DEFAULT_PROPERTIES];
            localStore.blogPosts = [...DEFAULT_BLOGS];
            localStore.siteSettings = { ...DEFAULT_SITE_SETTINGS };
            localStore.siteContent = { ...DEFAULT_SITE_CONTENT };

            try {
                localStorage.setItem('kaghan_categories', JSON.stringify(localStore.categories));
                localStorage.setItem('kaghan_cities', JSON.stringify(localStore.cities));
                localStorage.setItem('kaghan_societies', JSON.stringify(localStore.societies));
                localStorage.setItem('kaghan_properties', JSON.stringify(localStore.properties));
                localStorage.setItem('kaghan_site_content', JSON.stringify(localStore.siteContent));
            } catch (storageErr) {}

            return { success: true, results };
        } catch (e) {
            console.error("Database seeding encountered an error:", e);
            return { success: false, error: e.message, results };
        }
    }
};

// Backward Compatibility Aliases for CorporateDB
window.CorporateDB = {
    ...(window.CorporateDB || {}),
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
