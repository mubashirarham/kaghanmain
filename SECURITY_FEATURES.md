# Kaghan Stay - Project Security Features

This document outlines all the security features, policies, and code patterns implemented in the **Kaghan Stay** project. You can use this as a reference or copy the configurations directly to add these features to another project.

---

## 1. CDN Edge & HTTP Security Headers (`netlify.toml`)

To mitigate common web vulnerabilities (like Clickjacking, MIME sniffing, and insecure connection upgrades), HTTP response headers are set at the CDN layer.

### Implementation
Add the following blocks to your `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "upgrade-insecure-requests"
```

### Security Benefits:
- **`X-Frame-Options: DENY`**: Prevents the site from being embedded inside an `<iframe>` on external websites, mitigating Clickjacking attacks.
- **`X-Content-Type-Options: nosniff`**: Instructs the browser to strictly follow the MIME types sent in headers, preventing script-execution exploits disguised as static assets.
- **`Referrer-Policy: strict-origin-when-cross-origin`**: Limits the referrer data passed to external domains while retaining full referrers within secure cross-origin requests.
- **`Content-Security-Policy: upgrade-insecure-requests`**: Automatically forces all HTTP asset references (images, scripts, styles) to load securely over HTTPS.

---

## 2. CDN-Level Serverless Rate Limiting (`netlify/edge-functions/rate-limiter.js`)

To prevent Denial of Service (DoS) attacks, brute-force spamming, and API budget depletion (e.g. from the LLM endpoint), a rate limiter is enforced at the edge/CDN level before reaching the serverless function.

### Configuration (`netlify.toml`)
Map the Edge Function to target endpoints:

```toml
[[edge_functions]]
  path = "/.netlify/functions/chatbot"
  function = "rate-limiter"
```

### Code Implementation (`netlify/edge-functions/rate-limiter.js`)
Create this file to intercept requests and log/block spam:

```javascript
// Netlify Edge Function - CDN-level Rate Limiter
const ipRequestLedger = new Map();

// Configuration: Max 20 requests per 60 seconds per IP
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 20;

export default async (request, context) => {
  // Retrieve client connection IP
  const clientIp = request.headers.get("x-nf-client-connection-ip") || 
                   request.headers.get("x-forwarded-for") || 
                   "unknown-ip";

  const now = Date.now();
  
  if (!ipRequestLedger.has(clientIp)) {
    ipRequestLedger.set(clientIp, []);
  }
  
  const timestamps = ipRequestLedger.get(clientIp);
  const activeTimestamps = timestamps.filter(t => (now - t) < RATE_LIMIT_WINDOW_MS);
  
  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    console.warn(`[CDN Rate Limiter] Blocked IP: ${clientIp} - Exceeded limit (${activeTimestamps.length}/${MAX_REQUESTS_PER_WINDOW} req/min)`);
    
    return new Response(
      JSON.stringify({ 
        error: "Too many requests. Please slow down. Booking servers are rate-limited to prevent automated spam." 
      }), 
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Retry-After": "60"
        }
      }
    );
  }
  
  activeTimestamps.push(now);
  ipRequestLedger.set(clientIp, activeTimestamps);
  
  return await context.next();
};
```

---

## 3. Serverless Backend Security (`netlify/functions/`)

The serverless functions (`chatbot.js` and `booking-email.js`) incorporate backend protection patterns.

### A. HTTP Method Restrictions
Serverless handlers explicitly validate methods and reject unexpected ones with `405 Method Not Allowed`.

```javascript
if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
}
```

### B. Safe JSON Parsing
Incoming request payloads are parsed within `try-catch` scopes to prevent malformed payloads from crashing the serverless backend.

```javascript
try {
    const body = JSON.parse(event.body || '{}');
} catch (error) {
    return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
    };
}
```

### C. LLM Runaway Loop Prevention
To prevent infinite agent loops (which could inflate token usage billing), a safety loop counter is configured in `chatbot.js`:

```javascript
let loop = true;
let loopCounter = 0;
const maxLoops = 5;

while (loop && loopCounter < maxLoops) {
    loopCounter++;
    // ... process tool execution ...
}
```

### D. Secure Environmental Secret Management
Sensitive parameters (like database endpoints, SMTP user credentials, and API tokens) are strictly stored as environment variables rather than client-accessible files.
- `process.env.SMTP_HOST` / `process.env.SMTP_PASS`
- `process.env.GROQ_API_KEY`

---

## 4. Client-Side Authentication & Role-Based Access Controls

Client-side user management is centralized to check active sessions and restrict route entry.

### A. Client Route Guarding (`assets/js/users.js`)
Pages under protected directories `/admin/` and `/user/` query the active session role against required roles during DOM initialization.

```javascript
db.guardRoute = (requiredRole) => {
    const user = db.getCurrentUser();
    if (!user) {
        const currentPath = window.location.pathname;
        window.location.href = currentPath.includes('/admin/') || currentPath.includes('/user/') ? '../login.html' : 'login.html';
        return false;
    }
    if (requiredRole && user.role !== requiredRole) {
        window.location.href = user.role === 'admin' ? '../admin/index.html' : '../user/index.html';
        return false;
    }
    return true;
};
```

### Usage on Protected Pages (`assets/js/admin/dashboard.js` & `assets/js/user/dashboard.js`):
```javascript
document.addEventListener('DOMContentLoaded', () => {
    if (!KaghanDB.guardRoute('admin')) { // or 'user'
        return;
    }
    // Initialize secure page scripts
});
```

### B. Input Normalization (Email Case Normalization)
To prevent duplicates or session spoofing due to capitalizations in login/signup credentials, emails are lowercased and stripped of whitespace before being queried or persisted:
```javascript
email.toLowerCase().trim()
```

---

## 5. Booking Concurrency & Integrity Checks

To prevent race conditions (e.g. double bookings), the backend AI booking tool performs a double-check transaction before executing the confirmation.

```javascript
async function bookRoomTool(roomId, guestName, guestEmail, guestPhone, checkIn, checkOut) {
    // 1. Re-evaluate live occupancy availability on reservation attempt
    const avail = await checkAvailabilityTool(roomId, checkIn, checkOut);
    if (!avail.available) {
        return { success: false, error: avail.reason || 'Room is unavailable.' };
    }
    // 2. Proceed to write booking document if available...
}
```

---

## 6. Service Worker Cache Isolation (`service-worker.js`)

The service worker bypasses offline caching for database calls (`firestore.googleapis.com`) and any stateful requests (non-`GET` calls, e.g. booking or user status changes) to ensure no sensitive transactional response gets incorrectly cached locally.

```javascript
self.addEventListener('fetch', (event) => {
  // Bypass caching entirely for non-GET calls
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Bypass Google Firestore API endpoints and external analytics tracking
  if (url.origin.includes('firestore.googleapis.com') || url.origin.includes('google-analytics.com')) {
    return;
  }
  
  // Respond with caching strategy...
});
```
