// Server-side Firestore REST reader for Netlify SSR & Durable On-Demand Caching
// Zero hardcoded data — fetches live documents directly from Firebase project smmp-4b3cc.

const PROJECT_ID = 'smmp-4b3cc';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function unwrapValue(val) {
    if (!val || typeof val !== 'object') return null;
    if ('stringValue' in val) return val.stringValue;
    if ('integerValue' in val) return Number(val.integerValue);
    if ('doubleValue' in val) return Number(val.doubleValue);
    if ('booleanValue' in val) return Boolean(val.booleanValue);
    if ('timestampValue' in val) return val.timestampValue;
    if ('nullValue' in val) return null;
    if ('arrayValue' in val) {
        const vals = val.arrayValue && Array.isArray(val.arrayValue.values) ? val.arrayValue.values : [];
        return vals.map(unwrapValue);
    }
    if ('mapValue' in val) {
        const fields = (val.mapValue && val.mapValue.fields) || {};
        return unwrapFields(fields);
    }
    return null;
}

function unwrapFields(fields = {}) {
    const out = {};
    for (const [k, v] of Object.entries(fields)) {
        out[k] = unwrapValue(v);
    }
    return out;
}

function unwrapDocument(doc) {
    if (!doc || !doc.name) return null;
    const id = doc.name.split('/').pop();
    return {
        id,
        ...unwrapFields(doc.fields || {})
    };
}

async function fetchJsonSafe(url, timeoutMs = 6000) {
    try {
        const res = await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(timeoutMs)
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn('[SSR Firestore] Fetch failed:', url, err.message);
        return null;
    }
}

export async function fetchDocument(docPath) {
    const data = await fetchJsonSafe(`${BASE_URL}/${docPath}`);
    return data && data.fields ? unwrapDocument(data) : {};
}

export async function fetchCollection(colPath, pageSize = 200) {
    const data = await fetchJsonSafe(`${BASE_URL}/${colPath}?pageSize=${pageSize}`);
    if (!data || !Array.isArray(data.documents)) return [];
    return data.documents
        .map(unwrapDocument)
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function fetchSiteSettings() {
    return await fetchDocument('kaghan_properties/siteSettings');
}

export async function fetchSiteContent() {
    return await fetchDocument('kaghan_properties/siteContent');
}

export async function fetchProjects(onlyPublished = true) {
    const list = await fetchCollection('kaghan_properties/main/projects', 100);
    return onlyPublished ? list.filter(p => p.status !== 'draft') : list;
}

export function getBadgeRank(p) {
    const u = String((p && (p.urgency || p.badge)) || '').toLowerCase().trim();
    if (u === 'superhot' || u === 'super_hot' || u === 'super hot') return 2;
    if (u === 'hot') return 1;
    return 0;
}

export async function fetchProperties(onlyPublished = true) {
    const list = await fetchCollection('kaghan_properties/main/properties', 300);
    const filtered = onlyPublished ? list.filter(p => !p.status || p.status === 'published') : list;
    return filtered.sort((a, b) => {
        const diff = getBadgeRank(b) - getBadgeRank(a);
        if (diff !== 0) return diff;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
}

export async function fetchBlogPosts(onlyPublished = true) {
    const list = await fetchCollection('kaghan_properties/main/blogPosts', 100);
    return onlyPublished ? list.filter(b => !b.status || b.status === 'published') : list;
}
