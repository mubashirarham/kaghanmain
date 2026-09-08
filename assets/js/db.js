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
        id: "azan-arcade-bahria-apartment",
        title: "2 Bedroom Luxury Apartment in Azan Arcade",
        slug: "azan-arcade-bahria-apartment",
        type: "apartment",
        purpose: "sale",
        status: "published",
        urgency: "super-hot",
        isVerified: true,
        agencyTier: "Titanium",
        addedRelative: "2 hours ago (Updated: 15 mins ago)",
        city: "Islamabad",
        area: "Bahria Enclave Islamabad",
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
        photoCount: 27,
        amenities: ["elevator", "security", "gated", "generator"],
        categorizedAmenities: {
            mainFeatures: ["Elevator / Passenger Lift", "Double Glazed Soundproof Windows", "Central Heating & Cooling Ready", "24/7 Underground Power Backup", "Dedicated Gas Connection"],
            rooms: ["2 Master Bedrooms with Attached Baths", "Designer Powder Room", "Open Concept American Kitchen", "Spacious Family Living Lounge", "Private Balcony with Hill View"],
            business: ["High-Speed Optical Fiber Internet", "Intercom Facility to Lobby", "Satellite / Smart TV Cabling"],
            community: ["Community Park & Walking Trail", "Civic Center Commercial Mall", "Gated Security & Access Gate"],
            healthcare: ["First Aid Clinic on Premises", "Fitness & Yoga Center nearby"],
            nearby: ["Roots Millennium School (3 mins)", "Shifa Medical Complex (8 mins)", "Commercial Banks & ATMs (2 mins)"],
            facilities: ["Maintenance Staff on Call", "24/7 CCTV Surveillance", "Dedicated Covered Basement Parking"]
        },
        nearbyPOIs: [
            { category: "Schools", name: "Roots Millennium School Enclave", distance: "3 mins" },
            { category: "Hospitals", name: "Shifa International Clinic", distance: "5 mins" },
            { category: "Shopping", name: "Civic Mall & Green Valley Store", distance: "2 mins" },
            { category: "Restaurants", name: "Gloria Jean's & Tehzeeb Bakery", distance: "4 mins" },
            { category: "Parks", name: "Bahria Enclave Music Theme Park", distance: "5 mins" },
            { category: "Banks", name: "Meezan Bank & HBL Commercial Zone", distance: "2 mins" }
        ],
        images: [
            { driveFileId: "1azan", url: "assets/images/azan-arcade.png", caption: "Building Elevation & Facade", isPrimary: true },
            { driveFileId: "1int125", url: "assets/images/interior.png", caption: "Modern Living & Dining Area", isPrimary: false },
            { driveFileId: "1hero124", url: "assets/images/hero.png", caption: "Complex View & Surroundings", isPrimary: false },
            { driveFileId: "1p1", url: "assets/images/bahria-villa.png", caption: "Balcony Scenic Outlook", isPrimary: false },
            { driveFileId: "1p2", url: "assets/images/mideast-view1.png", caption: "Master Bedroom Suite", isPrimary: false }
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
    },
    {
        id: "modern-villa-sector-c-bahria-enclave",
        title: "5 Marla Ultra Modern Villa in Sector C",
        slug: "modern-villa-sector-c-bahria-enclave",
        type: "house",
        purpose: "sale",
        status: "published",
        urgency: "hot",
        isVerified: true,
        agencyTier: "Titanium",
        addedRelative: "4 hours ago (Updated: 1 hour ago)",
        city: "Islamabad",
        area: "Bahria Enclave Islamabad",
        sector: "Sector C",
        address: "Street 8, Sector C",
        landmark: "Near Enclave Zoo",
        coordinates: { lat: 33.6685, lng: 73.1950 },
        price: 28500000,
        currency: "PKR",
        size: 5,
        sizeUnit: "marla",
        bedrooms: 4,
        bathrooms: 5,
        floors: 2,
        facing: "North",
        yearBuilt: 2024,
        parkingSpaces: 2,
        photoCount: 32,
        amenities: ["security", "generator", "park", "gated"],
        categorizedAmenities: {
            mainFeatures: ["Built in 2024", "Spanish Porcelain Tile Flooring", "Solid Ash Wood Finish", "Solar Inverter Ready", "Dual Water Tank Supply"],
            rooms: ["4 Ensuite Bedrooms", "Formal Drawing Room", "Dirty & Clean Kitchens", "Rooftop BBQ Pavilion"],
            business: ["Broadband Fiber Optic", "Smart Video Door Bell", "CCTV Provision"],
            community: ["Sector C Central Park (100m)", "Jamia Mosque nearby", "Gated Security Entry"],
            healthcare: ["Enclave Hospital (5 mins)", "Walking Track"],
            nearby: ["Beaconhouse School (4 mins)", "Commercial Market (2 mins)"],
            facilities: ["2 Car Garage Porch", "Servant Room with Bath"]
        },
        nearbyPOIs: [
            { category: "Parks", name: "Sector C Bird Sanctuary Park", distance: "2 mins" },
            { category: "Schools", name: "Beaconhouse Enclave Campus", distance: "4 mins" },
            { category: "Hospitals", name: "Bahria Enclave Hospital", distance: "5 mins" },
            { category: "Shopping", name: "Sector C Commercial Avenue", distance: "2 mins" }
        ],
        images: [
            { driveFileId: "1bvilla", url: "assets/images/bahria-villa.png", caption: "Contemporary Front Elevation", isPrimary: true },
            { driveFileId: "1int123", url: "assets/images/interior.png", caption: "Designer Living Lounge", isPrimary: false },
            { driveFileId: "1hero123", url: "assets/images/hero.png", caption: "Architectural Overview", isPrimary: false },
            { driveFileId: "1emb", url: "assets/images/embassy.png", caption: "Master Bath & Wardrobe", isPrimary: false }
        ],
        videos: [
            { platform: "youtube", videoId: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Villa Tour", type: "property_tour" }
        ],
        documents: [],
        agentId: "user_002",
        agentName: "Tanzil Minhas",
        agentPhone: "+923340091127",
        description: `<h4>Custom-Built 5 Marla Designer Villa in Bahria Enclave</h4>
<p>Kaghan Properties is proud to present this architectural masterpiece located in the prime sector C of Bahria Enclave Islamabad. Features imported Spanish tiles, double-glazed glass windows, and high-end wooden woodwork.</p>
<h5>Key Highlights:</h5>
<ul>
    <li>4 spacious ensuite bedrooms with custom wardrobes.</li>
    <li>Dual modern kitchens with built-in appliances.</li>
    <li>Rooftop barbeque deck with open views of Margalla hills.</li>
    <li>24/7 underground electricity with zero load-shedding.</li>
</ul>`,
        metaTitle: "5 Marla Modern Villa in Bahria Enclave Islamabad",
        metaDescription: "Brand new 5 Marla luxury house for sale in Bahria Enclave Sector C Islamabad.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "pine-valley-resort-suites-project",
        title: "Pine Valley Serviced Resort Suites & Chalets",
        slug: "pine-valley-resort-suites-project",
        type: "apartment",
        purpose: "sale",
        status: "published",
        isNewProject: true,
        urgency: "super-hot",
        isVerified: true,
        agencyTier: "Titanium",
        addedRelative: "Just Now",
        city: "Nathia Gali",
        area: "Nathia Gali",
        sector: "Pine Valley Ridge",
        address: "Governor House Ridge Road, Nathia Gali",
        landmark: "Near Pine Top Hotel & Mukshpuri Base",
        coordinates: { lat: 34.0664, lng: 73.3758 },
        price: 9500000,
        currency: "PKR",
        size: 3,
        sizeUnit: "marla",
        bedrooms: 2,
        bathrooms: 2,
        floors: 4,
        facing: "Scenic Valley",
        yearBuilt: 2025,
        parkingSpaces: 1,
        photoCount: 40,
        amenities: ["security", "generator", "park", "elevator"],
        projectUnits: [
            { type: "Studio Alpine Suite", priceRange: "PKR 95 Lakh - 1.15 Crore", sizeRange: "425 - 550 Sq Ft" },
            { type: "1-Bed Executive Chalet", priceRange: "PKR 1.45 - 1.75 Crore", sizeRange: "720 - 900 Sq Ft" },
            { type: "2-Bed Duplex Penthouse", priceRange: "PKR 2.40 - 2.95 Crore", sizeRange: "1,250 - 1,600 Sq Ft" }
        ],
        floorPlans: [
            {
                title: "Sale Kit & Project Brochure",
                subtitle: "Official 28-Page Investor Overview",
                area: "Full Masterplan",
                height: "Master Document",
                view: "Comprehensive Specs",
                image: "assets/images/parkview.png"
            },
            {
                title: "Master Plan & Site Footprint",
                subtitle: "Topographical Ridge Allotment",
                area: "14 Kanal Total Site",
                height: "G + 8 Structure",
                view: "East-West Mountain Axis",
                image: "assets/images/mideast-view2.png"
            },
            {
                title: "Ground Floor - Grand Atrium & Retail",
                subtitle: "Reception Lobby, Valet, & Promenade",
                area: "8,400 Sq Ft Covered",
                height: "14 ft Double Height",
                view: "Front Boulevard Entry",
                image: "assets/images/azan-arcade.png"
            },
            {
                title: "2nd–5th (Typical Floor) - Studio & 1-Bed Chalets",
                subtitle: "Compressed Typical Floor Range (Floors 2 to 5)",
                area: "425 – 900 Sq Ft per Unit",
                height: "10 ft 6 in Clear",
                view: "East-Facing Sunrise Glazing",
                image: "assets/images/floorplan_masterplan.jpg"
            },
            {
                title: "6th–7th (Typical Floor) - 2-Bed Luxury Suites",
                subtitle: "Executive Wing Layout (Floors 6 and 7)",
                area: "1,250 – 1,600 Sq Ft",
                height: "11 ft Clear",
                view: "180° Ridge Valley Panorama",
                image: "assets/images/floorplan_masterplan.jpg"
            },
            {
                title: "8th Floor - Duplex Sky Penthouses",
                subtitle: "Top-Tier Presidential Duplex Units",
                area: "2,200 – 2,650 Sq Ft",
                height: "18 ft Double Height Atrium",
                view: "360° Unobstructed Peaks",
                image: "assets/images/interior.png"
            }
        ],
        paymentPlan: {
            image: "assets/images/payment_plan_chart.jpg",
            duration: "36-Month Milestone Payment Schedule",
            booking: "15% - From PKR 14.25 Lakh",
            confirmation: "10% - From PKR 9.50 Lakh",
            monthly: "45% - ~PKR 1.18 Lakh / mo (1.25%/mo for 3 years)",
            balloon: "15% - From PKR 2.37 Lakh / 6mo (6 Bi-Annual Balloon)",
            possession: "15% - From PKR 14.25 Lakh (On structural completion)",
            rebates: "10% instant rebate on 100% upfront lump-sum payment. 5% rebate on 50% advance booking."
        },
        categorizedAmenities: {
            mainFeatures: ["Hotel Managed Stays", "Central Water Heating & Fireplace", "Panoramic Snow Valley Views", "Elevator Access to All Floors"],
            rooms: ["Serviced Luxury Bedrooms", "Kitchenette with Appliances", "Glass Framed Balcony"],
            business: ["High Speed Satellite WiFi", "Business Center & Lounge"],
            community: ["Bonfire Deck & Barbeque Terrace", "Indoor Games Room", "Kids Activity Zone"],
            healthcare: ["First Aid & Paramedic Facility"],
            nearby: ["Mukshpuri Hiking Track (5 mins)", "Mall Road Nathia Gali (4 mins)"],
            facilities: ["24/7 Front Desk Concierge", "Valet Parking", "Housekeeping & Room Service"]
        },
        nearbyPOIs: [
            { category: "Parks", name: "Ayubia National Park", distance: "12 mins" },
            { category: "Restaurants", name: "Sweet Tooth & Pine Cafe", distance: "4 mins" },
            { category: "Shopping", name: "Nathia Gali Bazaar", distance: "5 mins" }
        ],
        images: [
            { driveFileId: "1pv1", url: "assets/images/parkview.png", caption: "Pine Valley Resort Architectural Render", isPrimary: true },
            { driveFileId: "1pv2", url: "assets/images/interior.png", caption: "Fireplace Living Room & Balcony", isPrimary: false },
            { driveFileId: "1pv3", url: "assets/images/mideast-view2.png", caption: "Mountain Ridge View", isPrimary: false }
        ],
        videos: [],
        documents: [],
        agentId: "user_002",
        agentName: "Tanzil Minhas",
        agentPhone: "+923340091127",
        description: `<h4>Pine Valley Serviced Resort Suites Nathia Gali</h4>
<p>An exceptional alpine development managed exclusively by Kaghan Properties. Offering guaranteed seasonal rental income, 24/7 hospitality care, and high capital appreciation nestled in Nathia Gali's pristine pine hills.</p>
<h5>Investment Highlights:</h5>
<ul>
    <li>Quarterly profit distribution for short-stay tourism.</li>
    <li>Complimentary owner stay vouchers (30 days/year).</li>
    <li>3-year easy installment plan with 25% down payment.</li>
</ul>`,
        metaTitle: "Pine Valley Resort Suites & Chalets in Nathia Gali",
        metaDescription: "Pre-launch hotel suites and serviced chalets for sale in Nathia Gali.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "kaghan-vault-commercial-project",
        title: "The Kaghan Vault & Corporate Tower",
        slug: "kaghan-vault-commercial-project",
        type: "commercial",
        purpose: "sale",
        status: "published",
        isNewProject: true,
        urgency: "super-hot",
        isVerified: true,
        agencyTier: "Titanium",
        addedRelative: "Flagship Tower",
        city: "Islamabad",
        area: "Blue Area",
        sector: "Jinnah Avenue Commercial Corridor",
        address: "Plot 14-B, Jinnah Avenue, Blue Area, Islamabad",
        landmark: "Facing Centaurus Mall & Metro Station",
        coordinates: { lat: 33.7088, lng: 73.0566 },
        price: 42100000,
        priceRangeStr: "PKR 4.21 Crore to 7.24 Crore",
        currency: "PKR",
        size: 4,
        sizeUnit: "marla",
        bedrooms: 0,
        bathrooms: 4,
        floors: 32,
        facing: "Main Boulevard",
        yearBuilt: 2026,
        parkingSpaces: 4,
        photoCount: 35,
        amenities: ["security", "generator", "elevator", "parking"],
        projectUnits: [
            { type: "Retail Ground Floor Shops", priceRange: "PKR 5.20 - 7.24 Crore", sizeRange: "4.1 - 5.8 Marla (920 - 1,300 Sq Ft)", category: "Shops", descriptor: "High-visibility ground floor retail frontage with 18ft double-height ceiling and boulevard drop-off." },
            { type: "Retail First Floor Outlets", priceRange: "PKR 4.21 - 5.80 Crore", sizeRange: "3.05 - 4.9 Marla (680 - 1,100 Sq Ft)", category: "Shops", descriptor: "Fashion, jewelry, and luxury boutique retail outlets facing atrium escalators." },
            { type: "Corporate Executive Offices", priceRange: "PKR 3.80 - 6.10 Crore", sizeRange: "3.5 - 6.2 Marla (800 - 1,400 Sq Ft)", category: "Offices", descriptor: "Grade-A LEED certified corporate suites with fiber optic backbone and centralized HVAC." },
            { type: "Sky Business Suites", priceRange: "PKR 2.95 - 4.50 Crore", sizeRange: "2.8 - 4.2 Marla (630 - 950 Sq Ft)", category: "Commercial", descriptor: "Consulting and tech firm executive office spaces with Margalla hills vistas." },
            { type: "Luxury Penthouses & Lofts", priceRange: "PKR 6.50 - 9.80 Crore", sizeRange: "8.0 - 12.5 Marla (1,800 - 2,800 Sq Ft)", category: "Flats", descriptor: "Ultra-luxury executive residences on levels 28-32 with private express elevators." }
        ],
        floorPlans: [
            {
                title: "Tower Architectural Section & Master Elevation",
                subtitle: "32-Storey Landmark Architectural Blueprint",
                area: "35,000 Sq Ft Ground Footprint",
                height: "LEED Gold Certified Clear Heights",
                view: "Jinnah Avenue Commercial Boulevard",
                image: "assets/images/mideast-view2.png"
            },
            {
                title: "Ground & Mezzanine - Luxury Retail Promenade",
                subtitle: "High-Visibility Front Boulevard Retail Outlets",
                area: "920 – 1,300 Sq Ft Outlets",
                height: "18 ft Double Height Ceilings",
                view: "Centaurus Facing Promenade & Drop-off",
                image: "assets/images/azan-arcade.png"
            },
            {
                title: "Floors 4–18 - Grade-A Corporate Office Suites",
                subtitle: "Column-Free Modular Executive Office Floorplate",
                area: "800 – 1,400 Sq Ft per Office",
                height: "11 ft Clear Finished Ceilings",
                view: "Margalla Hills & City Skyline View",
                image: "assets/images/floorplan_masterplan.jpg"
            },
            {
                title: "Floors 28–32 - Sky Penthouses & Helipad Deck",
                subtitle: "Presidential Sky Suites & Private Helipad Access",
                area: "1,800 – 2,800 Sq Ft Duplex",
                height: "14 ft Full Glass Panorama",
                view: "360° Islamabad Horizon",
                image: "assets/images/interior.png"
            }
        ],
        paymentPlan: {
            image: "assets/images/payment_plan_chart.jpg",
            duration: "48-Month Institutional Milestone Schedule",
            booking: "20% - Down Payment on Formal Registration",
            confirmation: "10% - On Ground-Breaking & Excavation",
            monthly: "40% - 48 Flexible Monthly Installments",
            balloon: "15% - 8 Semi-Annual Milestone Balloons",
            possession: "15% - On Key Handover & Deed Registration",
            rebates: "12% instant developer rebate on 100% upfront lump-sum payment. 6% rebate on 50% advance commitment."
        },
        categorizedAmenities: {
            mainFeatures: ["32-Storey Landmark Tower", "High-Speed Mitsubishi Destination Elevators", "4-Level Underground Dedicated Parking", "Double-Glazed Low-E Glass Facade"],
            rooms: ["Double Height Reception Atrium", "Executive Boardrooms", "Panoramic Terrace Balconies"],
            business: ["Redundant Gigabit Fiber Optic Backbone", "Tier-3 On-Site Server Rooms", "Conference Arcades"],
            community: ["Rooftop Helipad & Executive Club", "Fine Dining Restaurants", "Gymnasium & Health Club"],
            healthcare: ["On-Call Paramedic Emergency Station", "First-Aid Dispensary"],
            nearby: ["Centaurus Mall (2 mins)", "Blue Area Metro Station (1 min)", "Stock Exchange (3 mins)"],
            facilities: ["24/7 Central CCTV & Armed Guards", "Smart BMS Automation", "Dedicated Freight & Service Lifts"]
        },
        nearbyPOIs: [
            { category: "Attractions", name: "Centaurus Mall & Cineplex", distance: "2 mins walk" },
            { category: "Restaurants", name: "Beverly Center Gourmet Strip", distance: "3 mins drive" },
            { category: "Hospitals", name: "Kulsum International Hospital", distance: "4 mins drive" },
            { category: "Schools", name: "Islamabad Model College F-7/2", distance: "5 mins drive" }
        ],
        images: [
            { driveFileId: "kv1", url: "assets/images/mideast-view2.png", caption: "The Kaghan Vault Corporate Tower Architectural Elevation", isPrimary: true },
            { driveFileId: "kv2", url: "assets/images/azan-arcade.png", caption: "Ground Floor Commercial Promenade & Grand Atrium", isPrimary: false },
            { driveFileId: "kv3", url: "assets/images/interior.png", caption: "Executive Boardroom & Corporate Suite Interior", isPrimary: false },
            { driveFileId: "kv4", url: "assets/images/parkview.png", caption: "Jinnah Avenue Sky High Horizon View", isPrimary: false }
        ],
        videos: [],
        documents: [],
        agentId: "user_001",
        agentName: "Mubashir Arham",
        agentPhone: "+923340091127",
        description: `<h4>The Kaghan Vault: Rise Above the Rest</h4>
<p>An iconic 32-storey mixed-use corporate and luxury commercial tower located at the epicenter of Islamabad's financial district on Jinnah Avenue, Blue Area. Designed for elite retailers, multinational corporations, and discerning property investors seeking capital growth and commercial yields.</p>`,
        metaTitle: "The Kaghan Vault & Corporate Tower Blue Area Islamabad",
        metaDescription: "Retail shops, corporate offices, and luxury executive suites in Blue Area Islamabad.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "designer-villa-overseas-block-park-view-city",
        title: "10 Marla Luxury Designer Villa in Overseas Block",
        slug: "designer-villa-overseas-block-park-view-city",
        type: "house",
        purpose: "sale",
        status: "published",
        urgency: "super-hot",
        isVerified: true,
        agencyTier: "Titanium",
        addedRelative: "6 hours ago",
        city: "Islamabad",
        area: "Park View City",
        sector: "Overseas Block",
        address: "Boulevard 4, Overseas Block",
        landmark: "Overlooking Downtown Commercial",
        coordinates: { lat: 33.7058, lng: 73.1812 },
        price: 48000000,
        currency: "PKR",
        size: 10,
        sizeUnit: "marla",
        bedrooms: 5,
        bathrooms: 6,
        floors: 2,
        facing: "East",
        yearBuilt: 2024,
        parkingSpaces: 3,
        photoCount: 29,
        amenities: ["security", "park", "gated", "generator"],
        categorizedAmenities: {
            mainFeatures: ["Double Height Ceilings", "Turkish Travertine Stone Walls", "Smart Climate Control", "Imported Kitchen with Island"],
            rooms: ["5 Master Bedroom Suites", "Double Height Grand Drawing Room", "Executive Dining Hall", "Media & Entertainment Room"],
            business: ["Fiber Internet", "Smart Home Touch Panels"],
            community: ["Downtown Dancing Fountains (3 mins)", "Botanical Gardens", "Gated Security Guard"],
            healthcare: ["National Hospital Park View (4 mins)"],
            nearby: ["Park View City Commercial Hub (2 mins)", "British School (5 mins)"],
            facilities: ["3 Car Covered Porch", "2 Servant Quarters"]
        },
        nearbyPOIs: [
            { category: "Shopping", name: "Downtown Park View Commercial", distance: "2 mins" },
            { category: "Parks", name: "Park View Lake & Fountains", distance: "3 mins" },
            { category: "Schools", name: "Choueifat International School", distance: "6 mins" }
        ],
        images: [
            { driveFileId: "1pvc1", url: "assets/images/hero.png", caption: "Grand Front Elevation", isPrimary: true },
            { driveFileId: "1pvc2", url: "assets/images/interior.png", caption: "Double Height Living Area", isPrimary: false },
            { driveFileId: "1pvc3", url: "assets/images/bahria-villa.png", caption: "Front Lawn & Porch", isPrimary: false }
        ],
        videos: [],
        documents: [],
        agentId: "user_002",
        agentName: "Tanzil Minhas",
        agentPhone: "+923340091127",
        description: `<h4>10 Marla Executive Villa in Overseas Block, Park View City</h4>
<p>Positioned in the highly sought-after Overseas Block of Park View City Islamabad, this 10 Marla residence offers elevated luxury, panoramic Margalla views, and direct access to Downtown Commercial and dancing fountains.</p>
<h5>Features & Finishes:</h5>
<ul>
    <li>5 Executive bedroom suites with Italian vanity fittings.</li>
    <li>Double-height formal lounge with crystal chandelier.</li>
    <li>Imported Turkish porcelain tiles throughout.</li>
    <li>Solid ash wood doors and German kitchen fittings.</li>
</ul>`,
        metaTitle: "10 Marla Luxury Villa in Park View City Islamabad",
        metaDescription: "Brand new 10 Marla house for sale in Overseas Block Park View City Islamabad.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "1-kanal-architectural-house-park-enclave",
        title: "1 Kanal Signature Residence in Park Enclave",
        slug: "1-kanal-architectural-house-park-enclave",
        type: "house",
        purpose: "sale",
        status: "published",
        urgency: "hot",
        isVerified: true,
        agencyTier: "Titanium",
        addedRelative: "1 day ago",
        city: "Islamabad",
        area: "Park Enclave",
        sector: "Phase 1",
        address: "Street 14, Phase 1",
        landmark: "Near Central Lake Park",
        coordinates: { lat: 33.6922, lng: 73.1415 },
        price: 92000000,
        currency: "PKR",
        size: 20,
        sizeUnit: "marla",
        bedrooms: 5,
        bathrooms: 6,
        floors: 2,
        facing: "North-East",
        yearBuilt: 2024,
        parkingSpaces: 4,
        photoCount: 35,
        amenities: ["security", "elevator", "park", "gated"],
        categorizedAmenities: {
            mainFeatures: ["Private Elevator", "Swimming Plunge Pool", "Full Smart Home Automation", "Solar Power Grid 15KW"],
            rooms: ["5 Sprawling Suites", "Formal & Informal Lounges", "Study Room / Home Library", "2 Kitchens (Show & Dirty)"],
            business: ["Cat6 Network Wiring", "Video Surveillance 16 Channel"],
            community: ["CDA Central Lake Park (100m)", "Underground Electrification"],
            healthcare: ["Chatha Hospital Park Road (6 mins)"],
            nearby: ["Islamabad Club (8 mins)", "Serena Hotel (12 mins)"],
            facilities: ["4 Car Porch", "Dual Guard Room with Bath"]
        },
        nearbyPOIs: [
            { category: "Parks", name: "Park Enclave Central Park & Lake", distance: "2 mins" },
            { category: "Restaurants", name: "Park Road Food Valley", distance: "4 mins" },
            { category: "Hospitals", name: "NIH & Chatha Hospital", distance: "6 mins" }
        ],
        images: [
            { driveFileId: "1pe1", url: "assets/images/embassy.png", caption: "Modern Front Façade", isPrimary: true },
            { driveFileId: "1pe2", url: "assets/images/interior.png", caption: "Minimalist Master Lounge", isPrimary: false },
            { driveFileId: "1pe3", url: "assets/images/bahria-villa.png", caption: "Rear Garden & Patio", isPrimary: false }
        ],
        videos: [],
        documents: [],
        agentId: "user_001",
        agentName: "Ali Khan",
        agentPhone: "+923340091127",
        description: `<h4>1 Kanal Masterpiece in CDA Park Enclave Islamabad</h4>
<p>Located in CDA's flagship gated scheme 'Park Enclave' on Park Road. Designed with clean architectural lines, open garden courtyards, smart home automation, and energy-efficient double glazing.</p>
<h5>Property Highlights:</h5>
<ul>
    <li>5 sprawling bedrooms with walk-in dressing rooms and spa baths.</li>
    <li>Swimming plunge pool and landscaped side lawn.</li>
    <li>Fully automated smart home lighting, climate, and security.</li>
    <li>100% CDA transferred clear title property.</li>
</ul>`,
        metaTitle: "1 Kanal Signature House in Park Enclave Islamabad",
        metaDescription: "Luxury 1 Kanal residence for sale in CDA Park Enclave Islamabad.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "contemporary-residence-margalla-enclave",
        title: "8 Marla Modern Mountain View House in Margalla Enclave",
        slug: "contemporary-residence-margalla-enclave",
        type: "house",
        purpose: "sale",
        status: "published",
        urgency: "hot",
        isVerified: true,
        agencyTier: "Titanium",
        addedRelative: "2 days ago",
        city: "Islamabad",
        area: "Margalla Enclave",
        sector: "Main Boulevard",
        address: "Plot 42, Main Boulevard",
        landmark: "Direct Margalla Avenue Access",
        coordinates: { lat: 33.7250, lng: 72.9680 },
        price: 39500000,
        currency: "PKR",
        size: 8,
        sizeUnit: "marla",
        bedrooms: 4,
        bathrooms: 5,
        floors: 2,
        facing: "North",
        yearBuilt: 2024,
        parkingSpaces: 2,
        photoCount: 22,
        amenities: ["security", "generator", "park", "gated"],
        categorizedAmenities: {
            mainFeatures: ["Mountain View Terraces", "A-Grade Construction Warranty", "Double Glazed Windows"],
            rooms: ["4 Master Bedrooms", "Spacious Hall", "Custom Italian Wardrobes"],
            business: ["Fiber Internet Ready"],
            community: ["Margalla Hiking Trail Entry", "Gated Security"],
            nearby: ["Sector D-12 & E-11 (5 mins)", "Margalla Avenue Express Access (1 min)"],
            facilities: ["2 Car Garage", "Water Bore & Storage Tanks"]
        },
        nearbyPOIs: [
            { category: "Parks", name: "Margalla Foothills Park", distance: "1 min" },
            { category: "Shopping", name: "D-12 Markaz Commercial", distance: "4 mins" }
        ],
        images: [
            { driveFileId: "1me1", url: "assets/images/bahria-villa.png", caption: "Mountain Front Elevation", isPrimary: true },
            { driveFileId: "1me2", url: "assets/images/interior.png", caption: "Formal Dining & Drawing", isPrimary: false }
        ],
        videos: [],
        documents: [],
        agentId: "user_002",
        agentName: "Tanzil Minhas",
        agentPhone: "+923340091127",
        description: `<h4>8 Marla Contemporary Residence in Margalla Enclave</h4>
<p>Savor pristine mountain air and direct connection to Margalla Avenue. This newly finished 8 Marla designer house features bespoke architectural woodwork, open-plan spaces, and private balcony vistas.</p>`,
        metaTitle: "8 Marla Modern Mountain View House in Margalla Enclave",
        metaDescription: "Brand new 8 Marla house for sale in Margalla Enclave Islamabad.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "agro-luxury-farmhouse-margalla-orchards",
        title: "4 Kanal Agro-Luxury Farmhouse Estate in Margalla Orchards",
        slug: "agro-luxury-farmhouse-margalla-orchards",
        type: "house",
        purpose: "sale",
        status: "published",
        urgency: "hot",
        isVerified: true,
        agencyTier: "Titanium",
        addedRelative: "3 days ago",
        city: "Islamabad",
        area: "Margalla Orchards",
        sector: "Phase 1 Farmhouses",
        address: "Farm 12, Valley Road",
        landmark: "Surrounded by Margalla Hills",
        coordinates: { lat: 33.7550, lng: 73.0450 },
        price: 145000000,
        currency: "PKR",
        size: 80,
        sizeUnit: "marla",
        bedrooms: 6,
        bathrooms: 7,
        floors: 2,
        facing: "North-West",
        yearBuilt: 2024,
        parkingSpaces: 6,
        photoCount: 38,
        amenities: ["security", "generator", "park", "gated"],
        categorizedAmenities: {
            mainFeatures: ["Private Organic Fruit Orchard", "Fresh Mountain Spring Bore", "Infinity Lawn Deck", "Solar Power Station 30KW"],
            rooms: ["6 Sprawling Suites with Panoramic Glass", "Formal Banquet Hall", "Chef's Kitchen", "Outdoor Patio"],
            community: ["Gated Agro Community", "Horse Riding Track"],
            facilities: ["Staff Quarters (3 Rooms)", "Security Watchtower"]
        },
        nearbyPOIs: [
            { category: "Parks", name: "Margalla Ridge Reserve", distance: "2 mins" },
            { category: "Shopping", name: "Sector E-11 Markaz", distance: "14 mins" }
        ],
        images: [
            { driveFileId: "1mo1", url: "assets/images/hero.png", caption: "Estate Exterior & Grounds", isPrimary: true },
            { driveFileId: "1mo2", url: "assets/images/interior.png", caption: "Banquet Hall & Lounges", isPrimary: false }
        ],
        videos: [],
        documents: [],
        agentId: "user_001",
        agentName: "Ali Khan",
        agentPhone: "+923340091127",
        description: `<h4>4 Kanal Agro Farmhouse Estate in Margalla Orchards</h4>
<p>An exceptional countryside retreat in Islamabad featuring organic citrus orchards, fresh mountain spring water supply, private infinity lawn, and contemporary living spaces.</p>`,
        metaTitle: "4 Kanal Luxury Farmhouse in Margalla Orchards Islamabad",
        metaDescription: "Luxury agro farmhouse for sale in Margalla Orchards Islamabad.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
    },
    {
        id: "mountain-view-suite-murree-hills",
        title: "Panoramic 2-Bed Serviced Suite in Murree Hills",
        slug: "mountain-view-suite-murree-hills",
        type: "apartment",
        purpose: "sale",
        status: "published",
        urgency: "hot",
        isVerified: true,
        agencyTier: "Titanium",
        addedRelative: "4 days ago",
        city: "Murree",
        area: "Murree",
        sector: "Bhurban / Patriata Corridor",
        address: "Suite 402, Pine Crest Heights",
        landmark: "Near PC Bhurban",
        coordinates: { lat: 33.9070, lng: 73.3907 },
        price: 16500000,
        currency: "PKR",
        size: 4,
        sizeUnit: "marla",
        bedrooms: 2,
        bathrooms: 2,
        floors: 1,
        facing: "East",
        yearBuilt: 2024,
        parkingSpaces: 1,
        photoCount: 26,
        amenities: ["elevator", "security", "generator"],
        categorizedAmenities: {
            mainFeatures: ["Double Glazed Pine Valley View", "Central Radiator Heating", "Full Hotel Rental Pool"],
            rooms: ["2 Ensuite Bedrooms", "Dining Nook", "Open Kitchenette"],
            facilities: ["Heated Water Supply", "24/7 Security & Concierge"]
        },
        nearbyPOIs: [
            { category: "Parks", name: "PC Bhurban Golf Course", distance: "4 mins" },
            { category: "Restaurants", name: "Bhurban Valley Terrace", distance: "3 mins" }
        ],
        images: [
            { driveFileId: "1mur1", url: "assets/images/mideast-view1.png", caption: "Pine Valley Panoramic View", isPrimary: true },
            { driveFileId: "1mur2", url: "assets/images/interior.png", caption: "Warm Alpine Interior", isPrimary: false }
        ],
        videos: [],
        documents: [],
        agentId: "user_002",
        agentName: "Tanzil Minhas",
        agentPhone: "+923340091127",
        description: `<h4>2-Bedroom Luxury Vacation Suite in Murree</h4>
<p>Experience alpine serenity with high rental yields. Fully furnished with central heating, private pine-facing balcony, and dedicated hospitality management by Kaghan Properties.</p>`,
        metaTitle: "2 Bedroom Vacation Suite in Murree Hills",
        metaDescription: "Serviced apartment for sale in Murree Hills with guaranteed seasonal rental returns.",
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
    blogPosts: [
        {
            id: "market-update-2026",
            title: "Islamabad & Galyat Property Market Update 2026",
            slug: "islamabad-property-market-update-2026",
            content: "<p>The capital real estate sector is witnessing substantial momentum across Bahria Enclave, Park View City, Margalla Enclave, and Park Enclave. Concurrently, vacation retreats and serviced suites in Murree and Nathia Gali continue to yield record-high tourist rental returns.</p>",
            excerpt: "Key investment insights and high-demand sectors in Islamabad, Murree, and Nathia Gali for 2026.",
            featuredImage: { driveFileId: "", url: "assets/images/mideast-view1.png" },
            category: "market_update",
            authorId: "user_001",
            authorName: "Ali Khan",
            metaTitle: "Islamabad, Murree & Nathia Gali Market Trends 2026",
            metaDescription: "In-depth analysis of Bahria Enclave, Park View City, Margalla Enclave, Murree, and Nathia Gali real estate demand.",
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
        
        // Sync curated societies and remove obsolete societies if present
        const socRef = getSubcollectionRef('societies');
        if (socRef) {
            const obsoleteSocieties = ["dha-islamabad", "bahria-town-islamabad", "g11-sector-islamabad", "nathia-gali-kaghan"];
            for (const obsId of obsoleteSocieties) {
                try {
                    await socRef.doc(obsId).delete();
                } catch (err) {}
            }
            for (const s of DEFAULT_SOCIETIES) {
                await socRef.doc(s.id).set(s, { merge: true });
            }
        }

        // Sync properties and remove obsolete properties if present
        const propRef = getSubcollectionRef('properties');
        if (propRef) {
            const obsoleteProps = ["islamabad-dha-phase2-house-123", "mideast-plaza-g11-commercial-office"];
            for (const obsId of obsoleteProps) {
                try {
                    await propRef.doc(obsId).delete();
                } catch (err) {}
            }
            for (const p of DEFAULT_PROPERTIES) {
                await propRef.doc(p.id).set(p, { merge: true });
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
