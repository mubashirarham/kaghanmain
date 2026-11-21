// Netlify Serverless SSR Function with Durable On-Demand Caching
// Renders live Firestore data into full HTML on the server and caches globally in Netlify Edge + Durable Cache
// with Stale-While-Revalidate and tag-based on-demand purging (modern successor to legacy On-Demand Builders).

import fs from 'node:fs/promises';
import path from 'node:path';
import {
    fetchSiteSettings,
    fetchSiteContent,
    fetchProjects,
    fetchProperties,
    fetchBlogPosts
} from '../lib/firestore.mjs';

const templateCache = new Map();

async function loadTemplate(filename) {
    if (templateCache.has(filename)) return templateCache.get(filename);
    const candidates = [
        path.resolve(process.cwd(), filename),
        path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../', filename)
    ];
    for (const filePath of candidates) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            templateCache.set(filename, content);
            return content;
        } catch (err) {}
    }
    throw new Error(`SSR template not found: ${filename}`);
}

function escHtml(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function safeJsonForScript(obj) {
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

function fmtPrice(val) {
    if (!val || isNaN(val)) return 'Call for Price';
    const num = Number(val);
    if (num >= 10000000) return `PKR ${(num / 10000000).toFixed(2).replace(/\.00$/, '')} Crore`;
    if (num >= 100000) return `PKR ${(num / 100000).toFixed(2).replace(/\.00$/, '')} Lakh`;
    return `PKR ${Math.round(num).toLocaleString('en-US')}`;
}

function getPrimaryPhoto(p) {
    if (Array.isArray(p.images) && p.images.length) {
        const first = p.images.find(i => !i.type || i.type === 'image') || p.images[0];
        if (first) return typeof first === 'string' ? first : (first.url || '');
    }
    if (Array.isArray(p.gallery)) {
        const img = p.gallery.find(g => g.type === 'image' && g.url);
        if (img) return img.url;
    }
    return '';
}

function hasVideo(p) {
    return (Array.isArray(p.videos) && p.videos.length > 0) ||
           (Array.isArray(p.gallery) && p.gallery.some(g => g.type === 'video'));
}

function absoluteUrl(url, origin) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${origin}/${url.replace(/^\/+/, '')}`;
}

function replaceElementInnerById(html, id, innerHtml) {
    const openRe = new RegExp(`<([a-zA-Z0-9]+)[^>]*\\bid=["']${id}["'][^>]*>`, 'i');
    const m = openRe.exec(html);
    if (!m) return html;
    const tag = m[1];
    const startInner = m.index + m[0].length;
    const tokenRe = new RegExp(`<(\\/)?${tag}\\b[^>]*>`, 'gi');
    tokenRe.lastIndex = startInner;
    let depth = 1;
    let tm;
    while ((tm = tokenRe.exec(html)) !== null) {
        if (tm[1]) depth--;
        else if (!tm[0].endsWith('/>')) depth++;
        if (depth === 0) {
            return html.slice(0, startInner) + innerHtml + html.slice(tm.index);
        }
    }
    return html;
}

function removeHiddenClassById(html, id) {
    const re = new RegExp(`(<[a-zA-Z0-9]+[^>]*\\bid=["']${id}["'][^>]*\\bclass=["'][^"']*)\\bhidden\\b\\s*`, 'i');
    return html.replace(re, '$1');
}

function injectHeadPayload(html, { title, description, ogImage, canonicalUrl, jsonLd, ssrState }) {
    let out = html;
    if (title) {
        out = out.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title id="page-title">${escHtml(title)}</title>`);
    }
    if (description) {
        out = out.replace(/<meta[^>]*name=["']description["'][^>]*>/i, `<meta name="description" content="${escHtml(description)}">`);
    }
    if (canonicalUrl) {
        out = out.replace(/<link[^>]*rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${escHtml(canonicalUrl)}">`);
    }

    const headExtras = [
        `<meta property="og:type" content="website">`,
        title ? `<meta property="og:title" content="${escHtml(title)}">` : '',
        description ? `<meta property="og:description" content="${escHtml(description)}">` : '',
        canonicalUrl ? `<meta property="og:url" content="${escHtml(canonicalUrl)}">` : '',
        ogImage ? `<meta property="og:image" content="${escHtml(ogImage)}">` : '',
        `<meta name="twitter:card" content="summary_large_image">`,
        title ? `<meta name="twitter:title" content="${escHtml(title)}">` : '',
        description ? `<meta name="twitter:description" content="${escHtml(description)}">` : '',
        ogImage ? `<meta name="twitter:image" content="${escHtml(ogImage)}">` : '',
        jsonLd ? `<script type="application/ld+json">${safeJsonForScript(jsonLd)}</script>` : '',
        `<script>window.__KAGHAN_SSR__=${safeJsonForScript(ssrState)};</script>`
    ].filter(Boolean).join('\n    ');

    return out.replace('</head>', `    ${headExtras}\n</head>`);
}

function renderListingCardsHtml(list, waDigits) {
    if (!list.length) {
        return `<div class="col-span-full py-12 text-center text-slate-500 text-xs bg-white rounded-2xl border-2 border-slate-300">No published listings yet.</div>`;
    }
    return list.map(p => {
        const img = getPrimaryPhoto(p);
        const vid = hasVideo(p);
        const price = fmtPrice(p.price);
        const sizeText = p.sqYards ? `${p.sqYards} Sq Yds` : (p.size ? `${p.size} ${p.sizeUnit || ''}` : '');
        const url = `property.html?slug=${encodeURIComponent(p.slug || p.id)}`;
        const waUrl = waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent('Hi, I am interested in ' + p.title)}` : 'contact.html';
        const loc = [p.plotSector || p.sector || p.area, p.city].filter(Boolean).join(', ');
        return `
            <article class="kp-card rounded-2xl overflow-hidden flex flex-col group">
                <a href="${url}" class="relative h-52 bg-slate-100 overflow-hidden flex items-center justify-center border-b-2 border-slate-200">
                    ${img ? `<img src="${escHtml(img)}" alt="${escHtml(p.title)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">` : `<i class="fa-solid fa-image text-3xl text-slate-300"></i>`}
                    ${p.plotNumber ? `<span class="absolute top-3 left-3 bg-emerald-600 border border-white/40 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1"><i class="fa-solid fa-map-pin text-[10px]"></i> ${escHtml(p.plotNumber)}</span>` : ''}
                    ${vid ? `<span class="absolute top-3 right-3 bg-rose-600 border border-white/40 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1"><i class="fa-brands fa-youtube"></i> Video</span>` : ''}
                    ${sizeText ? `<span class="absolute bottom-3 right-3 bg-slate-900/90 border border-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">${escHtml(sizeText)}</span>` : ''}
                </a>
                <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                        <div class="text-xl font-extrabold outfit text-emerald-800">${escHtml(price)}</div>
                        <h3 class="font-bold text-sm text-slate-900 line-clamp-1 mt-0.5"><a href="${url}">${escHtml(p.title)}</a></h3>
                        ${loc ? `<div class="text-xs text-slate-500 mt-1 flex items-center gap-1 line-clamp-1"><i class="fa-solid fa-location-dot text-emerald-600 text-[10px]"></i><span>${escHtml(loc)}</span></div>` : ''}
                    </div>
                    <div class="pt-3 border-t-2 border-slate-100 flex items-center gap-2">
                        <a href="${url}" class="flex-1 text-center py-2 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold transition-colors">View Plot &amp; Map</a>
                        <a href="${waUrl}" ${waDigits ? 'target="_blank" rel="noopener"' : ''} aria-label="WhatsApp" class="py-2 px-3.5 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-600 text-emerald-700 hover:text-white text-xs font-bold transition-colors flex items-center gap-1"><i class="fa-brands fa-whatsapp text-sm"></i></a>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function renderProjectCardsHtml(projects, properties) {
    return projects.map(pr => {
        const count = properties.filter(p => p.projectId === pr.id || (!p.projectId && p.societyId === pr.id)).length;
        const url = `project-detail.html?slug=${encodeURIComponent(pr.slug || pr.id)}`;
        return `
            <a href="${url}" class="kp-card rounded-2xl overflow-hidden flex flex-col group">
                <div class="relative h-52 bg-slate-100 overflow-hidden border-b-2 border-slate-200 flex items-center justify-center">
                    ${pr.coverImage ? `<img src="${escHtml(pr.coverImage)}" alt="${escHtml(pr.name)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">` : `<i class="fa-solid fa-city text-4xl text-slate-300"></i>`}
                    <span class="absolute top-3 right-3 bg-white/95 border border-slate-300 text-slate-900 text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow">${count} Listing${count === 1 ? '' : 's'}</span>
                    ${pr.startingPrice ? `<span class="absolute bottom-3 left-3 bg-emerald-700 border border-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow">From ${escHtml(pr.startingPrice)}</span>` : ''}
                </div>
                <div class="p-4 flex items-center justify-between gap-2">
                    <div class="min-w-0">
                        <h3 class="font-extrabold outfit text-base text-slate-900 truncate group-hover:text-emerald-700 transition-colors">${escHtml(pr.name)}</h3>
                        <p class="text-xs text-slate-500 truncate mt-0.5"><i class="fa-solid fa-location-dot text-emerald-600 text-[10px] mr-1"></i>${escHtml([pr.location, pr.city].filter(Boolean).join(', '))}</p>
                    </div>
                    <span class="w-9 h-9 rounded-xl bg-slate-100 border border-slate-300 group-hover:bg-emerald-700 group-hover:text-white text-slate-700 flex items-center justify-center shrink-0 transition-colors"><i class="fa-solid fa-arrow-right text-xs"></i></span>
                </div>
            </a>
        `;
    }).join('');
}

async function renderHome(url) {
    const [template, siteSettings, siteContent, projects, properties] = await Promise.all([
        loadTemplate('index.html'),
        fetchSiteSettings(),
        fetchSiteContent(),
        fetchProjects(true),
        fetchProperties(true)
    ]);

    const hero = (siteContent && siteContent.hero) || {};
    const siteName = siteSettings.siteName || 'Kaghan Properties';
    const waDigits = ((siteSettings.contact && siteSettings.contact.phone) || '').replace(/[^0-9]/g, '');

    let html = template;
    if (hero.badge) {
        html = removeHiddenClassById(html, 'hero-badge-wrap');
        html = replaceElementInnerById(html, 'hero-badge', escHtml(hero.badge));
    }
    html = replaceElementInnerById(html, 'hero-title', escHtml(hero.title || siteName));
    if (hero.subtitle) html = replaceElementInnerById(html, 'hero-subtitle', escHtml(hero.subtitle));

    if (projects.length) {
        html = removeHiddenClassById(html, 'home-projects-section');
        html = replaceElementInnerById(html, 'home-projects-grid', renderProjectCardsHtml(projects, properties));
    }
    html = replaceElementInnerById(html, 'home-listings-grid', renderListingCardsHtml(properties.slice(0, 9), waDigits));

    if (siteContent.seoGuide && (siteContent.seoGuide.heading || siteContent.seoGuide.body)) {
        html = removeHiddenClassById(html, 'home-seo-section');
        html = replaceElementInnerById(html, 'seo-eyebrow', escHtml(siteContent.seoGuide.eyebrow || 'Market Guide'));
        html = replaceElementInnerById(html, 'seo-heading', escHtml(siteContent.seoGuide.heading || ''));
        const paras = String(siteContent.seoGuide.body || '').split(/\n+/).filter(Boolean).map(p => `<p>${escHtml(p)}</p>`).join('');
        html = replaceElementInnerById(html, 'seo-body', paras);
    }

    if (Array.isArray(siteContent.faqs) && siteContent.faqs.length) {
        html = removeHiddenClassById(html, 'home-seo-section');
        const faqHtml = siteContent.faqs.map((f, i) => `
            <details class="kp-faq-item" ${i === 0 ? 'open' : ''}>
                <summary class="px-4 py-3.5 flex items-center justify-between gap-3 text-xs sm:text-[13px] font-bold text-slate-900">
                    <span>${escHtml(f.question)}</span>
                    <i class="fa-solid fa-chevron-down kp-faq-chevron text-slate-400 text-[11px] transition-transform"></i>
                </summary>
                <div class="px-4 pb-4 pt-1 border-t border-slate-200 text-xs text-slate-600 leading-relaxed">${escHtml(f.answer)}</div>
            </details>
        `).join('');
        html = replaceElementInnerById(html, 'home-faq-list', faqHtml);
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: siteName,
        url: `${url.origin}/`,
        telephone: (siteSettings.contact && siteSettings.contact.phone) || undefined,
        address: (siteSettings.contact && siteSettings.contact.address) || undefined
    };

    const ogImg = absoluteUrl(hero.posterUrl || (projects[0] && projects[0].coverImage) || 'assets/images/hero.png', url.origin);
    html = injectHeadPayload(html, {
        title: hero.metaTitle || `${siteName} | Verified Real Estate`,
        description: hero.metaDescription || hero.subtitle || siteSettings.footerBio || '',
        ogImage: ogImg,
        canonicalUrl: `${url.origin}/`,
        jsonLd,
        ssrState: { route: 'home', ts: Date.now(), siteSettings, siteContent, projects, properties }
    });

    return { html, tags: ['kaghan-ssr', 'page-home', 'projects', 'properties', 'site-content', 'site-settings'] };
}

async function renderProjectsList(url) {
    const [template, siteSettings, projects, properties] = await Promise.all([
        loadTemplate('projects.html'),
        fetchSiteSettings(),
        fetchProjects(true),
        fetchProperties(true)
    ]);

    const siteName = siteSettings.siteName || 'Kaghan Properties';
    const waDigits = ((siteSettings.contact && siteSettings.contact.phone) || '').replace(/[^0-9]/g, '');

    let html = template;
    html = replaceElementInnerById(html, 'results-count', String(properties.length));
    html = replaceElementInnerById(html, 'properties-card-list', renderListingCardsHtml(properties, waDigits));
    html = injectHeadPayload(html, {
        title: `Verified Listings | ${siteName}`,
        description: `Browse ${properties.length} verified real estate listings and interactive pinned plot maps.`,
        ogImage: absoluteUrl((properties[0] && getPrimaryPhoto(properties[0])) || 'assets/images/logo.png', url.origin),
        canonicalUrl: `${url.origin}/projects.html`,
        ssrState: { route: 'listings', ts: Date.now(), siteSettings, projects, properties }
    });

    return { html, tags: ['kaghan-ssr', 'page-listings', 'projects', 'properties', 'site-settings'] };
}

async function renderPropertyDetail(url, paramSlug) {
    const slug = (paramSlug || url.searchParams.get('slug') || url.searchParams.get('id') || '').toLowerCase().trim();
    const [template, siteSettings, projects, properties] = await Promise.all([
        loadTemplate('property.html'),
        fetchSiteSettings(),
        fetchProjects(true),
        fetchProperties(false)
    ]);

    const siteName = siteSettings.siteName || 'Kaghan Properties';
    const prop = slug
        ? properties.find(p => (p.slug || '').toLowerCase() === slug || String(p.id || '').toLowerCase() === slug)
        : properties[0];

    let html = template;
    let title = `Property Details | ${siteName}`;
    let description = siteSettings.footerBio || '';
    let ogImage = '';
    let jsonLd = null;
    const tags = ['kaghan-ssr', 'page-property', 'properties', 'site-settings'];

    if (prop) {
        const price = fmtPrice(prop.price);
        const img = getPrimaryPhoto(prop);
        title = `${prop.title} — ${price} | ${siteName}`;
        description = (prop.description || `${prop.title} — ${price}`).replace(/<[^>]+>/g, '').slice(0, 160);
        ogImage = absoluteUrl(img, url.origin);
        tags.push(`property-${prop.id}`);

        html = replaceElementInnerById(html, 'detail-h1', escHtml(prop.title));
        html = replaceElementInnerById(html, 'rail-price', escHtml(price));
        html = replaceElementInnerById(html, 'mobile-cta-price', escHtml(price));
        html = replaceElementInnerById(html, 'spec-plot', escHtml(prop.plotNumber || '—'));
        html = replaceElementInnerById(html, 'spec-size', escHtml(prop.plotDimensions || (prop.sqYards ? `${prop.sqYards} Sq Yds` : (prop.size ? `${prop.size} ${prop.sizeUnit || ''}` : '—'))));
        if (prop.description) html = replaceElementInnerById(html, 'property-description', escHtml(prop.description));
        if (img) {
            html = html.replace(
                /<img id="gallery-main-photo"[^>]*>/i,
                `<img id="gallery-main-photo" src="${escHtml(img)}" alt="${escHtml(prop.title)}" class="w-full h-full object-cover">`
            );
        }

        jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'RealEstateListing',
            name: prop.title,
            description,
            url: `${url.origin}/property.html?slug=${encodeURIComponent(prop.slug || prop.id)}`,
            image: ogImage || undefined,
            offers: prop.price ? { '@type': 'Offer', price: prop.price, priceCurrency: 'PKR' } : undefined
        };
    }

    html = injectHeadPayload(html, {
        title,
        description,
        ogImage,
        canonicalUrl: prop ? `${url.origin}/property.html?slug=${encodeURIComponent(prop.slug || prop.id)}` : `${url.origin}/property.html`,
        jsonLd,
        ssrState: { route: 'property', ts: Date.now(), siteSettings, projects, properties }
    });

    return { html, tags };
}

async function renderProjectDetail(url, paramSlug) {
    const slug = (paramSlug || url.searchParams.get('slug') || url.searchParams.get('id') || '').toLowerCase().trim();
    const [template, siteSettings, projects, properties] = await Promise.all([
        loadTemplate('project-detail.html'),
        fetchSiteSettings(),
        fetchProjects(false),
        fetchProperties(true)
    ]);

    const siteName = siteSettings.siteName || 'Kaghan Properties';
    const proj = slug
        ? projects.find(p => (p.slug || '').toLowerCase() === slug || String(p.id || '').toLowerCase() === slug)
        : projects[0];

    let html = template;
    let title = `Project Details | ${siteName}`;
    let description = siteSettings.footerBio || '';
    let ogImage = '';
    const tags = ['kaghan-ssr', 'page-project', 'projects', 'properties', 'site-settings'];

    if (proj) {
        const assigned = properties.filter(p => p.projectId === proj.id || (!p.projectId && p.societyId === proj.id));
        const waDigits = ((siteSettings.contact && siteSettings.contact.phone) || '').replace(/[^0-9]/g, '');
        title = `${proj.name} | ${siteName}`;
        description = (proj.description || `${proj.name} — ${proj.location || ''}`).slice(0, 160);
        ogImage = absoluteUrl(proj.coverImage, url.origin);
        tags.push(`project-${proj.id}`);

        html = replaceElementInnerById(html, 'proj-hero-title', escHtml(proj.name));
        html = replaceElementInnerById(html, 'proj-hero-badge', escHtml([proj.location, proj.city].filter(Boolean).join(' • ') || 'Project'));
        html = replaceElementInnerById(html, 'proj-hero-subtitle', escHtml(proj.startingPrice ? `Starting from ${proj.startingPrice}` : ''));
        if (proj.description) {
            html = removeHiddenClassById(html, 'proj-hero-desc');
            html = replaceElementInnerById(html, 'proj-hero-desc', escHtml(proj.description));
        }
        if (proj.coverImage) {
            html = html.replace(
                /<img id="proj-cover-img"[^>]*>/i,
                `<img id="proj-cover-img" src="${escHtml(proj.coverImage)}" alt="${escHtml(proj.name)}" class="w-full h-full object-cover">`
            );
        }
        html = replaceElementInnerById(html, 'project-plots-grid', renderListingCardsHtml(assigned, waDigits));
    }

    html = injectHeadPayload(html, {
        title,
        description,
        ogImage,
        canonicalUrl: proj ? `${url.origin}/project-detail.html?slug=${encodeURIComponent(proj.slug || proj.id)}` : `${url.origin}/project-detail.html`,
        ssrState: { route: 'project', ts: Date.now(), siteSettings, projects, properties }
    });

    return { html, tags };
}

async function renderSimplePage(route, filename, url) {
    const jobs = [loadTemplate(filename), fetchSiteSettings(), fetchSiteContent(), fetchProjects(true)];
    if (route === 'blog') jobs.push(fetchBlogPosts(true));
    const [template, siteSettings, siteContent, projects, blogPosts = []] = await Promise.all(jobs);

    const siteName = siteSettings.siteName || 'Kaghan Properties';
    let html = template;
    let title = `${route.charAt(0).toUpperCase() + route.slice(1)} | ${siteName}`;
    let description = siteSettings.footerBio || '';

    if (route === 'about' && siteContent.about) {
        title = `${siteContent.about.title || 'About'} | ${siteName}`;
        description = (siteContent.about.bio || description).slice(0, 160);
        html = replaceElementInnerById(html, 'about-title', escHtml(siteContent.about.title || siteName));
        if (siteContent.about.bio) {
            html = replaceElementInnerById(html, 'about-bio', String(siteContent.about.bio).split(/\n+/).filter(Boolean).map(p => `<p>${escHtml(p)}</p>`).join(''));
        }
    }

    html = injectHeadPayload(html, {
        title,
        description,
        canonicalUrl: `${url.origin}/${filename}`,
        ssrState: { route, ts: Date.now(), siteSettings, siteContent, projects, blogPosts }
    });

    return { html, tags: ['kaghan-ssr', `page-${route}`, 'site-content', 'site-settings', ...(route === 'blog' ? ['blogs'] : [])] };
}

export default async (req, context) => {
    const url = new URL(req.url);
    const pathname = url.pathname.toLowerCase();
    const paramSlug = (context && context.params && context.params.slug) || '';

    try {
        let result;
        if (pathname === '/' || pathname === '/index.html') {
            result = await renderHome(url);
        } else if (pathname === '/projects' || pathname === '/projects.html' || pathname === '/properties') {
            result = await renderProjectsList(url);
        } else if (pathname.startsWith('/property')) {
            result = await renderPropertyDetail(url, paramSlug);
        } else if (pathname.startsWith('/project-detail') || pathname.startsWith('/project/')) {
            result = await renderProjectDetail(url, paramSlug);
        } else if (pathname.startsWith('/about')) {
            result = await renderSimplePage('about', 'about.html', url);
        } else if (pathname.startsWith('/contact')) {
            result = await renderSimplePage('contact', 'contact.html', url);
        } else if (pathname.startsWith('/blog')) {
            result = await renderSimplePage('blog', 'blog.html', url);
        } else {
            return new Response('Not Found', { status: 404 });
        }

        return new Response(result.html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                // Browser Cache: fresh for 60s, serves stale up to 5m while refreshing in background
                'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
                // Netlify Durable On-Demand Builder Cache: shared global durable cache fresh 5m, SWR 24h
                'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=300, stale-while-revalidate=86400',
                // Vary CDN cache ONLY on meaningful app params (ignore utm_*, fbclid, etc.)
                'Netlify-Vary': 'query=slug|id|project|type|keyword|priceRange',
                // Cache tags for instant on-demand revalidation when Admin edits Firestore
                'Netlify-Cache-Tag': result.tags.join(','),
                'X-Rendered-By': 'Kaghan-Netlify-SSR',
                'X-Content-Type-Options': 'nosniff',
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            }
        });
    } catch (err) {
        console.error('[SSR Error]:', err);
        return new Response('Temporary rendering error. Please refresh.', {
            status: 500,
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
        });
    }
};

export const config = {
    path: [
        '/',
        '/index.html',
        '/projects',
        '/projects.html',
        '/properties',
        '/property',
        '/property.html',
        '/property/:slug',
        '/project-detail',
        '/project-detail.html',
        '/project/:slug',
        '/about',
        '/about.html',
        '/contact',
        '/contact.html',
        '/blog',
        '/blog.html'
    ],
    method: ['GET', 'HEAD']
};
