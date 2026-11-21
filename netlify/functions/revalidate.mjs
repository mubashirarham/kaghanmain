// On-Demand Cache Revalidation Endpoint for Netlify Durable CDN Cache
// Triggered automatically when Admin Panel edits Projects, Listings, Site Content, or Settings.

import { purgeCache } from '@netlify/cache';

export default async (req) => {
    if (req.method !== 'POST') {
        return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
    }

    let tags = ['kaghan-ssr'];
    try {
        const body = await req.json();
        if (body && Array.isArray(body.tags) && body.tags.length > 0) {
            tags = body.tags.map(t => String(t).trim()).filter(Boolean).slice(0, 20);
        }
    } catch (e) {}

    try {
        await purgeCache({ tags });
        return Response.json(
            { success: true, purged: tags, timestamp: new Date().toISOString() },
            { status: 202, headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (err) {
        console.error('[Revalidate] purgeCache failed:', err);
        return Response.json(
            { success: false, error: err.message },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }
};
