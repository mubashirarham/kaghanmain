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
