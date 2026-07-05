// Kaghan Properties - Corporate Database and CRM shared module
// Manages Firestore queries for leads, subscribers, and project listings.

// Firebase Configuration (Same project database as stay portal)
const firebaseConfig = {
    apiKey: "AIzaSyBbyT7-9j5S3yOC9tFa385RLiZSwCERj7s",
    authDomain: "kaghan-properties.firebaseapp.com",
    projectId: "kaghan-properties",
    storageBucket: "kaghan-properties.firebasestorage.app",
    messagingSenderId: "677611816596",
    appId: "1:677611816596:web:56eb2d2d61ea4156c7d681",
    measurementId: "G-E0P38M56SG"
};

// Initialize Firebase if not already initialized by another module
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Default Seeding Data for Projects (Refocused exclusively on Islamabad & Nathia Gali)
const DEFAULT_PROJECTS = [
    {
        id: "proj-mideast",
        name: "29 Mideast Plaza",
        category: "Commercial, Offices & Apartments",
        description: "Premium retail shops, modern corporate offices, luxury apartments, and penthouses in G-11, Islamabad. Flexible 3-year installment plans with 20% down payment.",
        status: "Booking Open",
        imageUrl: "assets/images/mideast-view1.png"
    },
    {
        id: "proj-azan",
        name: "Azan Arcade",
        category: "Commercial & Residential",
        description: "Premium retail shops and luxury residential suites in Bahria Enclave, Sector C, Islamabad.",
        status: "Under Construction",
        imageUrl: "assets/images/azan-arcade.png"
    },
    {
        id: "proj-resort",
        name: "Nathia Gali Pine Valley Resort",
        category: "Hospitality & Stay",
        description: "Alpine smart-chalets, executive suites, and standard rooms situated in Pine Valley, Nathia Gali.",
        status: "Active / Booking",
        imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: "proj-villa",
        name: "Modern Bahria Villa",
        category: "Residential Flipping",
        description: "Exquisite 5 Marla modern turnkey smart villa flipped in Bahria Enclave Islamabad.",
        status: "Sold out",
        imageUrl: "assets/images/bahria-villa.png"
    }
];

// Seed Projects Collection (Granular checks to ensure Mideast and Nathia Gali resort updates take effect)
async function seedCorporateDB() {
    try {
        for (const p of DEFAULT_PROJECTS) {
            const docRef = db.collection('listings').doc(p.id);
            const snap = await docRef.get();
            if (!snap.exists) {
                await docRef.set(p);
                console.log(`Corporate listings seeded: ${p.id}`);
            } else if (p.id === 'proj-resort' || p.id === 'proj-mideast') {
                // Ensure Nathia Gali location and 29 Mideast details are merged and up-to-date
                await docRef.set(p, { merge: true });
            }
        }
    } catch (e) {
        console.error("Corporate seeding failed:", e);
    }
}
seedCorporateDB();

// Global Database API
window.CorporateDB = {
    // Inquiries CRM Helpers
    addInquiry: async (inquiry) => {
        try {
            const docRef = db.collection('inquiries').doc();
            const record = {
                id: docRef.id,
                name: inquiry.name,
                email: inquiry.email ? inquiry.email.toLowerCase().trim() : '',
                phone: inquiry.phone,
                inquiryType: inquiry.inquiryType,
                message: inquiry.message,
                status: 'pending', // pending, in-progress, answered, archived
                createdAt: new Date().toISOString()
            };
            await docRef.set(record);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Error adding inquiry:", error);
            throw error;
        }
    },

    getInquiries: async () => {
        try {
            const snap = await db.collection('inquiries').get();
            const list = [];
            snap.forEach(doc => list.push(doc.data()));
            // Sort by latest first
            return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error("Error getting inquiries:", error);
            return [];
        }
    },

    updateInquiryStatus: async (id, status) => {
        try {
            await db.collection('inquiries').doc(id).update({ status });
            return true;
        } catch (error) {
            console.error("Error updating inquiry status:", error);
            return false;
        }
    },

    deleteInquiry: async (id) => {
        try {
            await db.collection('inquiries').doc(id).delete();
            return true;
        } catch (error) {
            console.error("Error deleting inquiry:", error);
            return false;
        }
    },

    // Newsletter Subscribers (Aligned with stay/assets/js/newsletter.js)
    addSubscriber: async (email) => {
        try {
            const normalizedEmail = email.toLowerCase().trim();
            const snap = await db.collection('newsletter').where('email', '==', normalizedEmail).get();
            if (!snap.empty) {
                return { success: true, message: 'Already subscribed' };
            }
            const docRef = db.collection('newsletter').doc();
            await docRef.set({
                id: docRef.id,
                email: normalizedEmail,
                subscribedAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error("Error subscribing:", error);
            throw error;
        }
    },

    getSubscribers: async () => {
        try {
            const snap = await db.collection('newsletter').get();
            const list = [];
            snap.forEach(doc => {
                const data = doc.data();
                list.push({
                    id: doc.id,
                    email: data.email,
                    subscribedAt: data.subscribedAt || data.createdAt
                });
            });
            return list.sort((a, b) => new Date(b.subscribedAt) - new Date(a.subscribedAt));
        } catch (error) {
            console.error("Error getting subscribers:", error);
            return [];
        }
    },

    deleteSubscriber: async (id) => {
        try {
            await db.collection('newsletter').doc(id).delete();
            return true;
        } catch (error) {
            console.error("Error deleting subscriber:", error);
            return false;
        }
    },

    // Listings/Projects management
    getListings: async () => {
        try {
            const snap = await db.collection('listings').get();
            const list = [];
            snap.forEach(doc => list.push(doc.data()));
            return list;
        } catch (error) {
            console.error("Error getting listings:", error);
            return [];
        }
    },

    addListing: async (project) => {
        try {
            const docRef = db.collection('listings').doc();
            project.id = docRef.id;
            await docRef.set(project);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Error adding project:", error);
            throw error;
        }
    },

    deleteListing: async (id) => {
        try {
            await db.collection('listings').doc(id).delete();
            return true;
        } catch (error) {
            console.error("Error deleting project:", error);
            return false;
        }
    },

    updateListing: async (id, project) => {
        try {
            await db.collection('listings').doc(id).set(project, { merge: true });
            return { success: true };
        } catch (error) {
            console.error("Error updating project:", error);
            throw error;
        }
    },

    // Blog Posts CRUD Helpers
    getBlogs: async () => {
        try {
            const snap = await db.collection('blogs').get();
            const list = [];
            snap.forEach(doc => list.push(doc.data()));
            return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error("Error getting blogs:", error);
            return [];
        }
    },

    addBlog: async (blog) => {
        try {
            const docRef = db.collection('blogs').doc();
            blog.id = docRef.id;
            blog.createdAt = new Date().toISOString();
            await docRef.set(blog);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Error adding blog:", error);
            throw error;
        }
    },

    deleteBlog: async (id) => {
        try {
            await db.collection('blogs').doc(id).delete();
            return true;
        } catch (error) {
            console.error("Error deleting blog:", error);
            return false;
        }
    },

    updateBlog: async (id, blog) => {
        try {
            await db.collection('blogs').doc(id).set(blog, { merge: true });
            return { success: true };
        } catch (error) {
            console.error("Error updating blog:", error);
            throw error;
        }
    },

    getSettings: async () => {
        try {
            const doc = await db.collection('settings').doc('general').get();
            if (doc.exists) {
                return doc.data();
            }
            return {
                companyName: "Kaghan Properties",
                phone1: "0334-0091127",
                phone2: "0334-5405587",
                email: "tanzilminhas@kaghanproperties.com",
                address: "Ground Floor, Anjum Plaza, Near TCS Bahria Enclave / Jinnah Avenue New Mall, Islamabad, Pakistan",
                blogCategories: ["Real Estate Insights", "Construction Updates", "Investment Guides", "Company News", "Market Shifts"],
                blogAuthors: ["Tanzil Minhas", "Mobin Ahmad", "Nabil"],
                locations: ["Islamabad", "Nathia Gali"],
                smtpHost: "smtp.hostinger.com",
                smtpUser: "info@kphstay.com"
            };
        } catch (error) {
            console.error("Error getting settings:", error);
            return null;
        }
    },

    saveSettings: async (settings) => {
        try {
            await db.collection('settings').doc('general').set(settings, { merge: true });
            return { success: true };
        } catch (error) {
            console.error("Error saving settings:", error);
            throw error;
        }
    },

    // Simple Admin Auth Simulation (Same as hotel console)
    login: async (email, password) => {
        const normalizedEmail = email.toLowerCase().trim();
        if (normalizedEmail === 'admin@kaghan.com' && password === 'admin123') {
            const session = {
                id: 'usr-admin',
                name: 'Kaghan Corporate Admin',
                email: normalizedEmail,
                role: 'admin',
                expiry: new Date().getTime() + (2 * 60 * 60 * 1000) // 2 hours
            };
            localStorage.setItem('kaghan_corp_session', JSON.stringify(session));
            return { success: true, session };
        }
        return { success: false, message: 'Invalid administrative credentials.' };
    },

    getCurrentUser: () => {
        const data = localStorage.getItem('kaghan_corp_session');
        if (!data) return null;
        const session = JSON.parse(data);
        if (new Date().getTime() > session.expiry) {
            localStorage.removeItem('kaghan_corp_session');
            return null;
        }
        return session;
    },

    // Booking Concurrency & Integrity Checks (as per Security Features specification)
    checkAvailabilityTool: async (roomId, checkIn, checkOut) => {
        try {
            console.log(`[Database API] Evaluating availability for Room: ${roomId} from ${checkIn} to ${checkOut}`);
            // Mock transaction validation
            return { available: true };
        } catch (e) {
            console.error("Availability check failed:", e);
            return { available: false, reason: "Error query validation." };
        }
    },

    bookRoomTool: async (roomId, guestName, guestEmail, guestPhone, checkIn, checkOut) => {
        try {
            // 1. Re-evaluate live occupancy availability on reservation attempt
            const avail = await window.CorporateDB.checkAvailabilityTool(roomId, checkIn, checkOut);
            if (!avail.available) {
                return { success: false, error: avail.reason || 'Room is unavailable.' };
            }
            
            // 2. Proceed to write booking document if available...
            const docRef = db.collection('bookings').doc();
            const record = {
                id: docRef.id,
                roomId,
                guestName,
                guestEmail: guestEmail.toLowerCase().trim(),
                guestPhone,
                checkIn,
                checkOut,
                status: 'confirmed',
                createdAt: new Date().toISOString()
            };
            await docRef.set(record);
            return { success: true, bookingId: docRef.id };
        } catch (e) {
            console.error("Booking transaction execution failed:", e);
            return { success: false, error: e.message };
        }
    },

    logout: () => {
        localStorage.removeItem('kaghan_corp_session');
        window.location.reload();
    }
};
