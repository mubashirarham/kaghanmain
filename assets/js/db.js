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
        isActive: false,
        title: "",
        badge: "",
        description: "",
        link: "projects.html",
        buttonText: "View Properties",
        icon: "fa-solid fa-bullhorn"
    },
    decisionTools: [
        {
            id: "plot-finder",
            title: "Plot Finder",
            badge: "GIS Maps",
            subtitle: "Interactive sector maps & plot layouts",
            description: "Interactive sector maps & plot layouts",
            icon: "fa-solid fa-map-location-dot",
            iconClass: "fa-solid fa-map-location-dot",
            link: "projects.html?tool=plot-finder",
            colorTheme: "emerald",
            isActive: true,
            sortOrder: 1
        },
        {
            id: "area-guides",
            title: "Area Guides",
            badge: "CDA & Galyat",
            subtitle: "Society reviews, CDA sectors & rates",
            description: "Society reviews, CDA sectors & rates",
            icon: "fa-solid fa-compass",
            iconClass: "fa-solid fa-compass",
            link: "area.html",
            colorTheme: "blue",
            isActive: true,
            sortOrder: 2
        },
        {
            id: "new-projects",
            title: "New Projects",
            badge: "Launches",
            subtitle: "Off-plan villas, malls & luxury suites",
            description: "Off-plan villas, malls & luxury suites",
            icon: "fa-solid fa-city",
            iconClass: "fa-solid fa-city",
            link: "projects.html?isNewProject=true",
            colorTheme: "purple",
            isActive: true,
            sortOrder: 3
        },
        {
            id: "home-loans",
            title: "Home Loans",
            badge: "EMI Calc",
            subtitle: "Conventional & Islamic bank finance",
            description: "Conventional & Islamic bank finance",
            icon: "fa-solid fa-calculator",
            iconClass: "fa-solid fa-calculator",
            link: "calculator.html",
            colorTheme: "amber",
            isActive: true,
            sortOrder: 4
        },
        {
            id: "land-records",
            title: "Land Records",
            badge: "Verification",
            subtitle: "Online registry & title deed portal",
            description: "Online registry & title deed portal",
            icon: "fa-solid fa-file-contract",
            iconClass: "fa-solid fa-file-contract",
            link: "societies.html#land-records",
            colorTheme: "rose",
            isActive: true,
            sortOrder: 5
        },
        {
            id: "construction-cost",
            title: "Construction Cost",
            badge: "2026 Rates",
            subtitle: "Turnkey grey structure & finishes",
            description: "Turnkey grey structure & finishes",
            icon: "fa-solid fa-trowel-bricks",
            iconClass: "fa-solid fa-trowel-bricks",
            link: "calculator.html#construction",
            colorTheme: "teal",
            isActive: true,
            sortOrder: 6
        }
    ],
    homePartners: [
        { id: "p1", name: "Meezan Bank", icon: "fa-solid fa-landmark", link: "#", isActive: true },
        { id: "p2", name: "HBL Islamic", icon: "fa-solid fa-building-columns", link: "#", isActive: true },
        { id: "p3", name: "Bank Alfalah", icon: "fa-solid fa-vault", link: "#", isActive: true },
        { id: "p4", name: "Faysal Bank", icon: "fa-solid fa-scale-balanced", link: "#", isActive: true },
        { id: "p5", name: "Habib Metro Sirat", icon: "fa-solid fa-coins", link: "#", isActive: true }
    ],
    browseProperties: [
        // Homes - Popular
        { id: "bp_1", category: "homes", subTab: "popular", title: "On Instalments Houses", link: "projects.html?type=house&keywords=instalment", badge: "Installments", isActive: true, sortOrder: 1 },
        { id: "bp_2", category: "homes", subTab: "popular", title: "1 Bedroom Flats", link: "projects.html?type=apartment&bedrooms=1", badge: "1 Bed", isActive: true, sortOrder: 2 },
        { id: "bp_3", category: "homes", subTab: "popular", title: "2 Bedroom Flats", link: "projects.html?type=apartment&bedrooms=2", badge: "2 Bed", isActive: true, sortOrder: 3 },
        { id: "bp_4", category: "homes", subTab: "popular", title: "3 Bedroom Flats", link: "projects.html?type=apartment&bedrooms=3", badge: "3 Bed", isActive: true, sortOrder: 4 },
        { id: "bp_5", category: "homes", subTab: "popular", title: "On Instalments Flats", link: "projects.html?type=apartment&keywords=instalment", badge: "Installments", isActive: true, sortOrder: 5 },
        { id: "bp_6", category: "homes", subTab: "popular", title: "New Houses", link: "projects.html?type=house&keywords=new", badge: "New", isActive: true, sortOrder: 6 },
        { id: "bp_7", category: "homes", subTab: "popular", title: "Low Price All Homes", link: "projects.html?type=house&sort=price_asc", badge: "Budget", isActive: true, sortOrder: 7 },
        { id: "bp_8", category: "homes", subTab: "popular", title: "Small Houses", link: "projects.html?type=house&area_max=5", badge: "Compact", isActive: true, sortOrder: 8 },

        // Homes - Type
        { id: "bp_9", category: "homes", subTab: "type", title: "Houses & Luxury Villas", link: "projects.html?type=house", badge: "Villas", isActive: true, sortOrder: 1 },
        { id: "bp_10", category: "homes", subTab: "type", title: "Flats & Luxury Suites", link: "projects.html?type=flat", badge: "Flats", isActive: true, sortOrder: 2 },
        { id: "bp_11", category: "homes", subTab: "type", title: "Penthouse Suites", link: "projects.html?type=penthouse", badge: "Luxury", isActive: true, sortOrder: 3 },
        { id: "bp_12", category: "homes", subTab: "type", title: "Upper Portion Homes", link: "projects.html?type=upper_portion", badge: "Portion", isActive: true, sortOrder: 4 },
        { id: "bp_13", category: "homes", subTab: "type", title: "Lower Portion Homes", link: "projects.html?type=lower_portion", badge: "Portion", isActive: true, sortOrder: 5 },
        { id: "bp_14", category: "homes", subTab: "type", title: "Farm Houses & Estates", link: "projects.html?type=farmhouse", badge: "Farmhouse", isActive: true, sortOrder: 6 },
        { id: "bp_15", category: "homes", subTab: "type", title: "Rooms & Studio Suites", link: "projects.html?type=room", badge: "Rooms", isActive: true, sortOrder: 7 },

        // Homes - Area Size
        { id: "bp_16", category: "homes", subTab: "area_size", title: "3 Marla Houses", link: "projects.html?type=house&size=3", badge: "3 Marla", isActive: true, sortOrder: 1 },
        { id: "bp_17", category: "homes", subTab: "area_size", title: "5 Marla Houses", link: "projects.html?type=house&size=5", badge: "5 Marla", isActive: true, sortOrder: 2 },
        { id: "bp_18", category: "homes", subTab: "area_size", title: "10 Marla Houses", link: "projects.html?type=house&size=10", badge: "10 Marla", isActive: true, sortOrder: 3 },
        { id: "bp_19", category: "homes", subTab: "area_size", title: "1 Kanal Houses", link: "projects.html?type=house&size=20", badge: "1 Kanal", isActive: true, sortOrder: 4 },
        { id: "bp_20", category: "homes", subTab: "area_size", title: "2 Kanal Luxury Mansions", link: "projects.html?type=house&size=40", badge: "2 Kanal", isActive: true, sortOrder: 5 },

        // Plots - Popular
        { id: "bp_21", category: "plots", subTab: "popular", title: "Developed Residential Plots", link: "projects.html?type=residential_plot&keywords=developed", badge: "Developed", isActive: true, sortOrder: 1 },
        { id: "bp_22", category: "plots", subTab: "popular", title: "Corner Residential Plots", link: "projects.html?type=residential_plot&keywords=corner", badge: "Corner", isActive: true, sortOrder: 2 },
        { id: "bp_23", category: "plots", subTab: "popular", title: "Low Price Residential Plots", link: "projects.html?type=residential_plot&sort=price_asc", badge: "Budget", isActive: true, sortOrder: 3 },
        { id: "bp_24", category: "plots", subTab: "popular", title: "Park Facing Residential Plots", link: "projects.html?type=residential_plot&keywords=park+facing", badge: "Park Facing", isActive: true, sortOrder: 4 },
        { id: "bp_25", category: "plots", subTab: "popular", title: "On Instalments Residential Plots", link: "projects.html?type=residential_plot&keywords=instalment", badge: "Installments", isActive: true, sortOrder: 5 },
        { id: "bp_26", category: "plots", subTab: "popular", title: "With Possession Commercial Plots", link: "projects.html?type=commercial_plot&keywords=possession", badge: "Possession", isActive: true, sortOrder: 6 },

        // Plots - Type
        { id: "bp_27", category: "plots", subTab: "type", title: "Residential Plots", link: "projects.html?type=residential_plot", badge: "Residential", isActive: true, sortOrder: 1 },
        { id: "bp_28", category: "plots", subTab: "type", title: "Commercial Plots", link: "projects.html?type=commercial_plot", badge: "Commercial", isActive: true, sortOrder: 2 },
        { id: "bp_29", category: "plots", subTab: "type", title: "Industrial Land", link: "projects.html?type=industrial_land", badge: "Industrial", isActive: true, sortOrder: 3 },
        { id: "bp_30", category: "plots", subTab: "type", title: "Agricultural Land", link: "projects.html?type=agricultural_land", badge: "Agro", isActive: true, sortOrder: 4 },
        { id: "bp_30b", category: "plots", subTab: "type", title: "Plot Files & Allocation", link: "projects.html?type=all_plots&keywords=file", badge: "Files", isActive: true, sortOrder: 5 },

        // Plots - Area Size
        { id: "bp_31", category: "plots", subTab: "area_size", title: "3 Marla Residential Plots", link: "projects.html?type=residential_plot&size=3", badge: "3 Marla", isActive: true, sortOrder: 1 },
        { id: "bp_32", category: "plots", subTab: "area_size", title: "5 Marla Residential Plots", link: "projects.html?type=residential_plot&size=5", badge: "5 Marla", isActive: true, sortOrder: 2 },
        { id: "bp_33", category: "plots", subTab: "area_size", title: "10 Marla Residential Plots", link: "projects.html?type=residential_plot&size=10", badge: "10 Marla", isActive: true, sortOrder: 3 },
        { id: "bp_34", category: "plots", subTab: "area_size", title: "1 Kanal Residential Plots", link: "projects.html?type=residential_plot&size=20", badge: "1 Kanal", isActive: true, sortOrder: 4 },
        { id: "bp_35", category: "plots", subTab: "area_size", title: "2 Kanal Commercial & Res", link: "projects.html?type=commercial_plot&size=40", badge: "2 Kanal", isActive: true, sortOrder: 5 },
        { id: "bp_36", category: "plots", subTab: "area_size", title: "4 Kanal+ Farm Plots", link: "projects.html?type=agricultural_land&size=80", badge: "4 Kanal+", isActive: true, sortOrder: 6 },

        // Commercial - Popular
        { id: "bp_37", category: "commercial", subTab: "popular", title: "Small Offices", link: "projects.html?type=office", badge: "Offices", isActive: true, sortOrder: 1 },
        { id: "bp_38", category: "commercial", subTab: "popular", title: "New Offices", link: "projects.html?type=office&keywords=new", badge: "New", isActive: true, sortOrder: 2 },
        { id: "bp_39", category: "commercial", subTab: "popular", title: "On Instalments Shops", link: "projects.html?type=shop&keywords=instalment", badge: "Installments", isActive: true, sortOrder: 3 },
        { id: "bp_40", category: "commercial", subTab: "popular", title: "Small Shops", link: "projects.html?type=shop", badge: "Shops", isActive: true, sortOrder: 4 },
        { id: "bp_41", category: "commercial", subTab: "popular", title: "New Shops", link: "projects.html?type=shop&keywords=new", badge: "New", isActive: true, sortOrder: 5 },
        { id: "bp_42", category: "commercial", subTab: "popular", title: "Running Shops", link: "projects.html?type=shop&keywords=running", badge: "Running", isActive: true, sortOrder: 6 },

        // Commercial - Type
        { id: "bp_43", category: "commercial", subTab: "type", title: "Retail Boulevard Shops", link: "projects.html?type=shop", badge: "Shops", isActive: true, sortOrder: 1 },
        { id: "bp_44", category: "commercial", subTab: "type", title: "Corporate Offices", link: "projects.html?type=office", badge: "Offices", isActive: true, sortOrder: 2 },
        { id: "bp_45", category: "commercial", subTab: "type", title: "Commercial Plazas & Malls", link: "projects.html?type=plaza", badge: "Plazas", isActive: true, sortOrder: 3 },
        { id: "bp_46", category: "commercial", subTab: "type", title: "Commercial Buildings & Towers", link: "projects.html?type=building", badge: "Buildings", isActive: true, sortOrder: 4 },
        { id: "bp_46b", category: "commercial", subTab: "type", title: "Manufacturing Factories", link: "projects.html?type=factory", badge: "Factories", isActive: true, sortOrder: 5 },
        { id: "bp_46c", category: "commercial", subTab: "type", title: "Logistics Warehouses", link: "projects.html?type=warehouse", badge: "Warehouses", isActive: true, sortOrder: 6 },
        { id: "bp_46d", category: "commercial", subTab: "type", title: "Other Commercial Units", link: "projects.html?type=other_commercial", badge: "Other", isActive: true, sortOrder: 7 },

        // Commercial - Area Size
        { id: "bp_47", category: "commercial", subTab: "area_size", title: "Under 250 Sq. Ft. Shops", link: "projects.html?type=shop&area_max=250", badge: "Shops", isActive: true, sortOrder: 1 },
        { id: "bp_48", category: "commercial", subTab: "area_size", title: "500 - 1000 Sq. Ft. Offices", link: "projects.html?type=office&keywords=office", badge: "Mid Size", isActive: true, sortOrder: 2 },
        { id: "bp_49", category: "commercial", subTab: "area_size", title: "Full Floor Commercial Suites", link: "projects.html?type=office&keywords=floor", badge: "Full Floor", isActive: true, sortOrder: 3 }
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
        id: "bahria-enclave-islamabad",
        name: "Bahria Enclave Islamabad",
        slug: "bahria-enclave-islamabad",
        type: "society",
        city: "Islamabad",
        description: "Bahria Enclave Islamabad offers world-class gated community living with 24/7 underground electricity, Civic Center commercial arcade, zoo, CineGold Plex, and scenic Margalla foothills views.",
        amenities: ["24/7 Security", "Underground Electricity", "Commercial Arcades", "CineGold Plex", "Parks & Zoo"],
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3319.467824128522!2d73.1932!3d33.6669",
        coordinates: { lat: 33.6669, lng: 73.1932 },
        introVideoId: "dQw4w9WgXcQ",
        documentsFolderUrl: "https://drive.google.com",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "park-view-city",
        name: "Park View City",
        slug: "park-view-city",
        type: "society",
        city: "Islamabad",
        description: "CDA-approved luxury housing society by Vision Group located on Malot Road Zone IV. Renowned for Downtown Commercial, dancing fountains, botanical gardens, and premium Overseas Block.",
        amenities: ["CDA Approved NOC", "Downtown Dancing Fountains", "Overseas Block", "Gated Security", "Botanical Gardens"],
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13278.432!2d73.1812!3d33.7058",
        coordinates: { lat: 33.7058, lng: 73.1812 },
        introVideoId: "dQw4w9WgXcQ",
        documentsFolderUrl: "https://drive.google.com",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "park-enclave",
        name: "Park Enclave",
        slug: "park-enclave",
        type: "society",
        city: "Islamabad",
        description: "Known as the Jewel of Islamabad, CDA's signature Park Enclave on Park Road provides state-of-the-art infrastructure, wide boulevards, eco-friendly green belts, and premium security.",
        amenities: ["CDA Developed", "Underground Electrification", "Sports Club & Lake", "Gated Boundary", "Prime Park Road Access"],
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13282.9!2d73.1415!3d33.6922",
        coordinates: { lat: 33.6922, lng: 73.1415 },
        introVideoId: "dQw4w9WgXcQ",
        documentsFolderUrl: "https://drive.google.com",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "margalla-enclave",
        name: "Margalla Enclave",
        slug: "margalla-enclave",
        type: "society",
        city: "Islamabad",
        description: "Nestled directly at the Margalla Foothills corridor with direct Margalla Avenue connectivity. Features pristine mountain air, contemporary architecture, and round-the-clock gated security.",
        amenities: ["Margalla Foothill Views", "Margalla Avenue Access", "24/7 Security", "Lush Green Parks", "Underground Utilities"],
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13270.2!2d72.9680!3d33.7250",
        coordinates: { lat: 33.7250, lng: 72.9680 },
        introVideoId: "dQw4w9WgXcQ",
        documentsFolderUrl: "https://drive.google.com",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "margalla-orchards",
        name: "Margalla Orchards",
        slug: "margalla-orchards",
        type: "society",
        city: "Islamabad",
        description: "Exclusive agro-luxury farmhouses and serene residential estates surrounded by nature, organic fruit orchards, and panoramic mountain ridges in Islamabad.",
        amenities: ["Agro Luxury Farmhouses", "Natural Springs & Water", "Fruit Orchards", "Gated Surveillance", "Scenic Hiking Trails"],
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13268.5!2d73.0450!3d33.7550",
        coordinates: { lat: 33.7550, lng: 73.0450 },
        introVideoId: "dQw4w9WgXcQ",
        documentsFolderUrl: "https://drive.google.com",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "murree",
        name: "Murree",
        slug: "murree",
        type: "resort",
        city: "Murree",
        description: "Pakistan's premier hill station resort territory. Famous for alpine pine forests, Mall Road, New Murree Patriata, Bhurban, luxury vacation suites, and lucrative short-term rental yields.",
        amenities: ["Alpine Climate & Snow", "High Tourist Rental Yield", "Patriata Chairlift Access", "Boutique Serviced Suites", "Scenic Valleys"],
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d26451.7!2d73.3907!3d33.9070",
        coordinates: { lat: 33.9070, lng: 73.3907 },
        introVideoId: "dQw4w9WgXcQ",
        documentsFolderUrl: "https://drive.google.com",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "nathia-gali",
        name: "Nathia Gali",
        slug: "nathia-gali",
        type: "resort",
        city: "Nathia Gali",
        description: "The jewel of Galyat with dense pine forests, alpine trails to Mukshpuri & Miranjani, Pine Valley luxury resort chalets, and year-round vacation home investments.",
        amenities: ["Mukshpuri Hiking Trails", "Pine Forest Retreat", "Pine Valley Luxury Chalets", "24/7 Hospitality Care", "Alpine Climate"],
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d26392.2!2d73.3758!3d34.0664",
        coordinates: { lat: 34.0664, lng: 73.3758 },
        introVideoId: "dQw4w9WgXcQ",
        documentsFolderUrl: "https://drive.google.com",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const DEFAULT_PROPERTIES = [
    {
        id: "prop-pine-valley-suites",
        slug: "pine-valley-luxury-alpine-suites-nathia-gali",
        title: "Pine Valley Luxury Alpine Suites & Chalets",
        tagline: "Exclusive mountain holiday suites with guaranteed rental yield",
        description: "Experience the epitome of serene alpine living at Pine Valley Luxury Suites in Nathia Gali. Surrounded by pristine pine forests with panoramic valley vistas, these serviced chalets and duplex suites offer 24/7 hospitality care, smart heated floors, floor-to-ceiling double-glazed viewing windows, and guaranteed seasonal tourist rental yield.",
        type: "flat",
        category: "Flat",
        purpose: "sale",
        price: 28500000,
        priceUnit: "PKR",
        size: 8,
        sizeUnit: "Marla",
        bedrooms: 2,
        bathrooms: 2,
        city: "Nathia Gali",
        area: "Nathia Gali",
        societyId: "nathia-gali",
        location: "Pine Valley Corridor, Main Nathia Gali Road, Galyat",
        isFeatured: true,
        isNewProject: true,
        urgency: "super-hot",
        status: "published",
        developer: "Kaghan Developments",
        constructionStatus: "Under Construction",
        deliveryDate: "December 2026",
        images: [
            { url: "assets/images/interior.png", isPrimary: true, alt: "Pine Valley Luxury Alpine Suite Interior" },
            { url: "assets/images/mideast-view1.png", isPrimary: false, alt: "Alpine Balcony View" },
            { url: "assets/images/mideast-view2.png", isPrimary: false, alt: "Pine Forest Mountain View" }
        ],
        features: [
            "Floor-to-Ceiling Mountain View Windows",
            "Underfloor Radiant Heating",
            "Serviced Housekeeping & 24/7 Concierge",
            "Backup Power Generator & Solar Grid",
            "High Rental Yield Management System",
            "Private Heated Jacuzzi on Balcony",
            "Dedicated Covered Parking"
        ],
        installments: {
            available: true,
            advance: 5700000,
            monthly: 475000,
            durationMonths: 36,
            planDetails: "3-Year Easy Quarterly / Monthly Installments with 20% Downpayment"
        },
        agentId: "user_001",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "prop-bahria-enclave-villa",
        slug: "bahria-enclave-designer-smart-villa",
        title: "1 Kanal Ultra-Modern Designer Smart Villa",
        tagline: "Architect-designed smart home with Margalla view rooftop patio",
        description: "Presenting a bespoke 1 Kanal modern architectural masterpiece in Sector C, Bahria Enclave Islamabad. Designed with double-height ceiling lobby, Spanish porcelain tile flooring, imported Italian kitchen fittings, infinity glass balconies, landscaped courtyard, and full smart home automation.",
        type: "house",
        category: "House",
        purpose: "sale",
        price: 85000000,
        priceUnit: "PKR",
        size: 20,
        sizeUnit: "Marla",
        bedrooms: 5,
        bathrooms: 6,
        city: "Islamabad",
        area: "Bahria Enclave Islamabad",
        societyId: "bahria-enclave-islamabad",
        location: "Sector C, Main Boulevard, Bahria Enclave, Islamabad",
        isFeatured: true,
        isNewProject: false,
        urgency: "hot",
        status: "published",
        developer: "Private Luxury Builders",
        constructionStatus: "Ready",
        deliveryDate: "Immediate Possession",
        images: [
            { url: "assets/images/bahria-villa.png", isPrimary: true, alt: "Bahria Enclave Designer Villa Front Elevation" },
            { url: "assets/images/interior.png", isPrimary: false, alt: "Designer Living Lounge" },
            { url: "assets/images/hero.png", isPrimary: false, alt: "Courtyard and Landscaping" }
        ],
        features: [
            "5 Luxury Ensuite Master Bedrooms",
            "Double Height Grand Lobby",
            "2 Designer Italian Fitted Kitchens",
            "Rooftop BBQ Pavilion with Margalla Views",
            "Smart Home Automation (Lights, AC, Security)",
            "Underground 24/7 Electricity",
            "Double Car Porch with EV Charger"
        ],
        installments: {
            available: false
        },
        agentId: "user_001",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "prop-park-view-commercial",
        slug: "park-view-city-downtown-commercial-plaza-unit",
        title: "Downtown Commercial Boulevard Retail Showroom",
        tagline: "High footfall commercial unit overlooking Downtown Dancing Fountains",
        description: "Prime retail ground showroom situated right on the Downtown Commercial Boulevard in Park View City Islamabad. Located directly facing the signature dancing fountains and botanical lake, ensuring premier retail exposure and high capital appreciation.",
        type: "shop",
        category: "Shop",
        purpose: "sale",
        price: 42000000,
        priceUnit: "PKR",
        size: 1200,
        sizeUnit: "Square Feet",
        bedrooms: 0,
        bathrooms: 1,
        city: "Islamabad",
        area: "Park View City",
        societyId: "park-view-city",
        location: "Downtown Commercial, Malot Road, Park View City, Islamabad",
        isFeatured: true,
        isNewProject: true,
        urgency: "super-hot",
        status: "published",
        developer: "Vision Group",
        constructionStatus: "Under Construction",
        deliveryDate: "June 2026",
        images: [
            { url: "assets/images/parkview.png", isPrimary: true, alt: "Park View City Downtown Commercial Arcade" },
            { url: "assets/images/azan-arcade.png", isPrimary: false, alt: "Commercial Plaza Frontage" }
        ],
        features: [
            "Direct Boulevard & Fountain Frontage",
            "Double Height Ground Floor Ceilings",
            "Ample Customer Parking Bays",
            "24/7 Security & CCTV Surveillance",
            "High Rental Demand from National Brands",
            "Dedicated Utility Connections"
        ],
        installments: {
            available: true,
            advance: 8400000,
            monthly: 700000,
            durationMonths: 24,
            planDetails: "2-Year Flexible Installment Plan with 20% Downpayment"
        },
        agentId: "user_002",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "prop-margalla-orchards-farmhouse",
        slug: "margalla-orchards-luxury-agro-farmhouse",
        title: "4 Kanal Agro-Luxury Country Farmhouse Estate",
        tagline: "Serene mountain-view country estate with organic fruit orchards and pool",
        description: "An exceptional 4 Kanal countryside retreat nestled in the peaceful greenery of Margalla Orchards Islamabad. Featuring an elegant single-storey spanish hacienda, private heated swimming pool, sprawling lawns, organic olive & citrus trees, and breathtaking Margalla ridge sunsets.",
        type: "farmhouse",
        category: "Farm House",
        purpose: "sale",
        price: 135000000,
        priceUnit: "PKR",
        size: 80,
        sizeUnit: "Marla",
        bedrooms: 4,
        bathrooms: 5,
        city: "Islamabad",
        area: "Margalla Orchards",
        societyId: "margalla-orchards",
        location: "Margalla Orchards Agro Enclave, Islamabad",
        isFeatured: true,
        isNewProject: false,
        urgency: "normal",
        status: "published",
        developer: "Signature Estates",
        constructionStatus: "Ready",
        deliveryDate: "Immediate Possession",
        images: [
            { url: "assets/images/hero.png", isPrimary: true, alt: "Margalla Orchards Farmhouse Estate" },
            { url: "assets/images/bahria-villa.png", isPrimary: false, alt: "Farmhouse Exterior" },
            { url: "assets/images/interior.png", isPrimary: false, alt: "Farmhouse Living Lounge" }
        ],
        features: [
            "4 Kanal Land Area with Gated Boundary",
            "Private Heated Swimming Pool & Deck",
            "Organic Olive, Citrus & Fig Orchard",
            "Independent Servant & Guard Quarters",
            "Solar Powered Grid & Deep Tube Well Water",
            "Expansive Covered Verandahs"
        ],
        installments: {
            available: false
        },
        agentId: "user_001",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "prop-murree-pine-heights",
        slug: "murree-pine-heights-serviced-apartment",
        title: "Murree Hills 2-Bed Serviced Alpine Apartment",
        tagline: "Panoramic valley view apartment on Expressway with full tourist rental management",
        description: "Luxury 2-bedroom furnished apartment in Murree with picturesque views of Kashmir Point and lush green pine valleys. Fully managed with keyless check-in and dedicated rental pool service generating attractive returns throughout the summer and snowfall seasons.",
        type: "flat",
        category: "Flat",
        purpose: "sale",
        price: 19500000,
        priceUnit: "PKR",
        size: 5,
        sizeUnit: "Marla",
        bedrooms: 2,
        bathrooms: 2,
        city: "Murree",
        area: "Murree",
        societyId: "murree",
        location: "Murree Expressway, near Bhurban Junction, Murree",
        isFeatured: false,
        isNewProject: true,
        urgency: "hot",
        status: "published",
        developer: "Kaghan Developments",
        constructionStatus: "Ready",
        deliveryDate: "Ready for Handover",
        images: [
            { url: "assets/images/mideast-view2.png", isPrimary: true, alt: "Murree Alpine Apartment Balcony View" },
            { url: "assets/images/interior.png", isPrimary: false, alt: "Furnished Suite Interior" }
        ],
        features: [
            "Fully Furnished with Modern Alpine Decor",
            "Balcony Overlooking Pine Hills",
            "Central Gas Heating System",
            "24/7 Security & On-Site Caretaker",
            "High Rental Demand in Snow Season"
        ],
        installments: {
            available: true,
            advance: 3900000,
            monthly: 325000,
            durationMonths: 24,
            planDetails: "2-Year Installments with Instant Rental Yield Sharing"
        },
        agentId: "user_002",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "prop-park-enclave-plot",
        slug: "park-enclave-cda-1-kanal-corner-plot",
        title: "Park Enclave 1 Kanal CDA Corner Residential Plot",
        tagline: "CDA Sector Phase 1 prime corner plot facing lush community park",
        description: "Ready for immediate construction, CDA-approved 1 Kanal corner residential plot in Phase 1 Park Enclave on Park Road. Features wide 60-ft asphalt roads, underground electrification, CDA NOC, and prime proximity to Club House and lake.",
        type: "residential_plot",
        category: "Residential Plots",
        purpose: "sale",
        price: 68000000,
        priceUnit: "PKR",
        size: 20,
        sizeUnit: "Marla",
        bedrooms: 0,
        bathrooms: 0,
        city: "Islamabad",
        area: "Park Enclave",
        societyId: "park-enclave",
        location: "Phase 1, Sector A, Park Enclave, Park Road, Islamabad",
        isFeatured: false,
        isNewProject: false,
        urgency: "normal",
        status: "published",
        developer: "Capital Development Authority (CDA)",
        constructionStatus: "Ready",
        deliveryDate: "Immediate Possession & Registry",
        images: [
            { url: "assets/images/parkview.png", isPrimary: true, alt: "Park Enclave Sector Layout & Park View" }
        ],
        features: [
            "100% CDA Approved & Verified Title Deed",
            "Corner Plot with Open Frontage",
            "Facing 2-Acre Landscaped Park",
            "Underground Utilities & Gas Pipeline",
            "Ready for Immediate House Construction"
        ],
        installments: {
            available: false
        },
        agentId: "user_001",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "prop-asian-arcade-office",
        slug: "asian-arcade-executive-corporate-office",
        title: "Asian Arcade 1,200 Sq. Ft. Executive Corporate Office",
        tagline: "Modern fitted office space in prime Bahria Enclave Civic Commercial Sector C",
        description: "Premium executive corporate office unit located in Asian Arcade, opposite Bahria Enclave Zoo on C Avenue. Ideal for software houses, corporate headquarters, law firms, and real estate agencies looking for high visibility and prestigious address.",
        type: "office",
        category: "Office",
        purpose: "sale",
        price: 24000000,
        priceUnit: "PKR",
        size: 1200,
        sizeUnit: "Square Feet",
        bedrooms: 0,
        bathrooms: 2,
        city: "Islamabad",
        area: "Bahria Enclave Islamabad",
        societyId: "bahria-enclave-islamabad",
        location: "Asian Arcade, C Avenue, Sector C, Bahria Enclave, Islamabad",
        isFeatured: false,
        isNewProject: false,
        urgency: "hot",
        status: "published",
        developer: "Asian Builders",
        constructionStatus: "Ready",
        deliveryDate: "Immediate Handover",
        images: [
            { url: "assets/images/azan-arcade.png", isPrimary: true, alt: "Asian Arcade Commercial Building" },
            { url: "assets/images/interior.png", isPrimary: false, alt: "Executive Office Suite" }
        ],
        features: [
            "Fitted Glass Partitions & Conference Room",
            "High-Speed Passenger & Cargo Elevators",
            "Dedicated Basement Parking Space",
            "24/7 Electricity with Backup Generator",
            "Pre-wired for Fiber Optic Internet"
        ],
        installments: {
            available: true,
            advance: 7200000,
            monthly: 420000,
            durationMonths: 24,
            planDetails: "2-Year Payment Plan with 30% Downpayment"
        },
        agentId: "user_001",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "prop-margalla-enclave-villa",
        slug: "margalla-enclave-10-marla-executive-villa",
        title: "10 Marla Luxury Modern Mountain-Facing Villa",
        tagline: "Newly built 5-bed designer residence with scenic Margalla Avenue connectivity",
        description: "A striking 10 Marla brand new villa in Margalla Enclave Islamabad. Finished with fine Turkish tiles, solid ash wood doors, dual drawing rooms, modular kitchen, and spacious rooftop barbecue terrace overlooking the Margalla Hills.",
        type: "house",
        category: "House",
        purpose: "sale",
        price: 49500000,
        priceUnit: "PKR",
        size: 10,
        sizeUnit: "Marla",
        bedrooms: 5,
        bathrooms: 5,
        city: "Islamabad",
        area: "Margalla Enclave",
        societyId: "margalla-enclave",
        location: "Margalla Enclave, Margalla Avenue Corridor, Islamabad",
        isFeatured: true,
        isNewProject: false,
        urgency: "normal",
        status: "published",
        developer: "Executive Homes",
        constructionStatus: "Ready",
        deliveryDate: "Immediate Handover",
        images: [
            { url: "assets/images/bahria-villa.png", isPrimary: true, alt: "10 Marla Villa Elevation" },
            { url: "assets/images/interior.png", isPrimary: false, alt: "Modern Master Bedroom" }
        ],
        features: [
            "5 Spacious Ensuite Bedrooms",
            "Dual Drawing & Dining Halls",
            "Solid Ash Wood Doors & Cabinetry",
            "Rooftop BBQ Pavilion with Scenic Hills View",
            "Space for 2 Large SUVs in Porch"
        ],
        installments: {
            available: false
        },
        agentId: "user_002",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    }
];

const DEFAULT_BLOGS = [
    {
        id: "blog-invest-murree-galyat-2026",
        slug: "2026-real-estate-investment-outlook-islamabad-galyat",
        title: "2026 Real Estate Investment Outlook: Why Islamabad & Galyat Alpine Properties are Outperforming",
        excerpt: "An in-depth analysis of property yield dynamics, CDA infrastructure expansions, and the booming short-term tourist rental market in Nathia Gali and Murree.",
        content: "<p class='lead'>The real estate landscape of the Islamabad Capital Territory and the surrounding Galyat alpine corridor is witnessing an unprecedented transformation in 2026. Investors are pivoting from speculative land flipping toward high-yielding tangible assets.</p><h3>1. The Rise of Serviced Alpine Vacation Homes</h3><p>Developments like <strong>Pine Valley Luxury Suites in Nathia Gali</strong> have demonstrated that vacation suites can generate between 14% to 18% annual rental returns during peak summer and winter snow seasons, far outpacing conventional urban residential leases.</p><h3>2. Infrastructure Connectivity</h3><p>The expansion of Margalla Avenue, ring road bypasses, and improved mountain highway networks have dramatically reduced commute times, making weekend getaways and remote work hubs feasible for Islamabad and Rawalpindi residents.</p><h3>3. Capital Preservation and Tangible Value</h3><p>With macroeconomic shifts, tangible real estate backed by solid title deeds in CDA-approved sectors and established societies like Bahria Enclave and Park View City continues to serve as the most resilient hedge against inflation.</p>",
        coverImage: "assets/images/interior.png",
        category: "Market Trends",
        author: {
            name: "Ali Khan",
            role: "Principal Real Estate Consultant",
            avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80"
        },
        readTime: "5 min read",
        views: 1840,
        featured: true,
        status: "published",
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "blog-cda-land-records-guide",
        slug: "complete-guide-to-cda-land-records-online-title-verification",
        title: "Complete Guide to CDA Land Records & Online Title Deed Verification in Islamabad",
        excerpt: "Step-by-step procedure for verifying CDA sector plot allotments, transfer letters, NOC compliance, and avoiding common real estate pitfalls.",
        content: "<p class='lead'>Navigating property documentation in Islamabad requires understanding the legal verification frameworks governed by the Capital Development Authority (CDA) and local revenue authorities.</p><h3>Key Verification Milestones:</h3><ul><li><strong>Allotment Letter Verification:</strong> Always request verified copies directly from the CDA One-Window Directorate.</li><li><strong>NOC and Layout Approval:</strong> For private housing societies in Zone IV and Zone II, cross-reference the approved layout plan on the official CDA portal.</li><li><strong>Non-Encumbrance Certificate (NEC):</strong> Confirm that no bank liens, litigation stays, or unpaid development charges exist on the title deed.</li></ul>",
        coverImage: "assets/images/parkview.png",
        category: "Legal & Records",
        author: {
            name: "Tanzil Minhas",
            role: "Senior Legal & Property Advisor",
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
        },
        readTime: "7 min read",
        views: 2420,
        featured: true,
        status: "published",
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "blog-bahria-vs-parkview-2026",
        slug: "bahria-enclave-vs-park-view-city-2026-comparison",
        title: "Bahria Enclave vs. Park View City: Comprehensive 2026 Buyer's Comparison",
        excerpt: "Comparing infrastructure, underground electrification, CDA NOC status, commercial hubs, and price per marla across Islamabad's top two gated communities.",
        content: "<p class='lead'>Both Bahria Enclave and Park View City represent benchmark gated living in Zone IV Islamabad, but each caters to distinct investor preferences.</p><h3>Infrastructure & Amenities</h3><p>Bahria Enclave offers a fully mature lifestyle with underground electricity, active CineGold Plex, Commercial Arcades, and established parks. Park View City offers modern architectural guidelines, Downtown commercial fountain arena, and rapid modern expansions in the Overseas Block.</p>",
        coverImage: "assets/images/bahria-villa.png",
        category: "Investment Guide",
        author: {
            name: "Ali Khan",
            role: "Principal Real Estate Consultant",
            avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80"
        },
        readTime: "6 min read",
        views: 3150,
        featured: false,
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
        password: "admin",
        phone: "+923340091127",
        role: "admin",
        photoUrl: "assets/images/logo.png",
        specializedAreas: ["Islamabad", "Rawalpindi", "Murree", "Nathia Gali"],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "user_001",
        uid: "usr_admin_default",
        name: "Ali Khan",
        email: "ali@kaghanproperties.com",
        password: "admin",
        phone: "+923340091127",
        role: "admin",
        photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80",
        specializedAreas: ["Bahria Enclave Islamabad", "Park Enclave", "Margalla Orchards"],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "user_002",
        uid: "usr_agent_default",
        name: "Tanzil Minhas",
        email: "tanzilminhas@kaghanproperties.com",
        password: "admin",
        phone: "+923340091127",
        role: "agent",
        photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
        specializedAreas: ["Bahria Enclave Islamabad", "Park View City", "Margalla Enclave", "Murree", "Nathia Gali"],
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
        address: "Office 203, 2nd Floor, Asian Arcade, opposite Zoo, C Avenue, Sector C, Bahria Enclave, Islamabad, Pakistan",
        googleMapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3319.467824128522!2d73.1932!3d33.6669!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDQwJzAwLjgiTiA3M8KwMTEnMzUuNSJF!5e0!3m2!1sen!2spk!4v1700000000000!5m2!1sen!2spk"
    },
    social: {
        facebook: "https://facebook.com/kaghanproperties",
        instagram: "https://instagram.com/kaghanproperties",
        youtube: "https://youtube.com/@kaghanproperties"
    },
    seoDefaults: {
        defaultMetaTitleTemplate: "{pageTitle} – Kaghan Properties",
        defaultMetaDescription: "Find trusted property listings in Islamabad, Murree, and Nathia Gali with Kaghan Properties."
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
    categories: [...DEFAULT_CATEGORIES],
    cities: [...DEFAULT_CITIES],
    siteContent: { ...DEFAULT_SITE_CONTENT },
    blogPosts: [...DEFAULT_BLOGS],
    siteSettings: { ...DEFAULT_SITE_SETTINGS }
};

// Purge any stale mock property cache from localStorage
try {
    const cached = localStorage.getItem('kaghan_properties');
    if (cached && (cached.includes('kaghan-vault') || cached.length < 50)) {
        localStorage.removeItem('kaghan_properties');
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
            if (Array.isArray(parsedProps) && parsedProps.length > 0) {
                localStore.properties = parsedProps;
            }
        } catch(e) {}
    }

    const savedContent = localStorage.getItem('kaghan_site_content');
    if (savedContent) {
        localStore.siteContent = JSON.parse(savedContent);
        if (localStore.siteContent && localStore.siteContent.browseProperties) {
            localStore.siteContent.browseProperties = localStore.siteContent.browseProperties.map(item => {
                const u = item.url || item.link || 'projects.html';
                return { ...item, url: u, link: u };
            });
        }
    }
} catch (e) {
    console.warn("Could not read from localStorage fallback cache:", e);
}

// Auto-seed Firestore on module load ONLY if collections are completely empty AND caller has admin privileges
async function seedFirestoreIfNeeded() {
    if (!db) return;
    try {
        const isAuthAdmin = auth && auth.currentUser && (auth.currentUser.email === 'admin@kaghanproperties.com' || auth.currentUser.email === 'ali@kaghanproperties.com');
        const isAdminPage = typeof window !== 'undefined' && window.location.pathname.includes('/admin/');
        if (!isAuthAdmin && !isAdminPage) {
            return; // Skip write operations for anonymous public visitors
        }

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
        
        // Check societies - ONLY seed if empty
        const socRef = getSubcollectionRef('societies');
        if (socRef) {
            const sSnap = await socRef.limit(1).get();
            if (sSnap.empty) {
                for (const s of DEFAULT_SOCIETIES) {
                    await socRef.doc(s.id).set(s, { merge: true });
                }
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

        // Check properties - ONLY seed if empty
        const propRef = getSubcollectionRef('properties');
        if (propRef) {
            const pSnap = await propRef.limit(1).get();
            if (pSnap.empty) {
                for (const p of DEFAULT_PROPERTIES) {
                    await propRef.doc(p.id).set(p, { merge: true });
                }
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
        console.warn("Firestore auto-seeding skipped:", e);
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
    uploadImageToCloudinary: window.CloudinaryService.uploadImage,
    cloudinary: window.CloudinaryService,
    PROPERTY_TAXONOMY,
    DEFAULT_CATEGORIES,
    DEFAULT_SITE_CONTENT,
    DEFAULT_CITIES,
    DEFAULT_SOCIETIES,

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
        if (!user.password) {
            const existing = (localStore.users || []).find(u => u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()));
            if (existing && existing.password) {
                user.password = existing.password;
            } else {
                user.password = "admin";
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
                snap.forEach(doc => list.push(doc.data()));
                localStore.properties = list;
                try {
                    localStorage.setItem('kaghan_properties', JSON.stringify(list));
                } catch (err) {}
            }
        } catch (e) {
            console.error("Error getting properties from Firestore:", e);
        }
        if (list.length === 0 && !db) {
            list = localStore.properties || [];
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

        // 3. Fallback demo admin login credentials check
        const allowedAdmins = [
            'admin@kp.com',
            'admin@kp.cpm',
            'admin@kaghanproperties.com',
            'admin@kaghan.com',
            'ali@kaghanproperties.com'
        ];
        const allowedPasswords = ['admin1122', 'admin123', 'admin'];

        if (allowedAdmins.includes(normEmail) && allowedPasswords.includes(pass)) {
            const session = {
                uid: 'usr_admin_kp',
                id: 'user_admin_kp',
                name: 'KP Admin',
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
