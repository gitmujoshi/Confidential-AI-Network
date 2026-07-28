/**
 * Edge middleware: terminate TLS on can.dpi-apps.space and proxy to local via ngrok.
 */
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

export default async function middleware(request) {
  const origin = (process.env.NGROK_ORIGIN || '').replace(/\/$/, '');
  if (!origin) {
    return new Response(
      'NGROK_ORIGIN is not configured. Start the local gateway + ngrok, then set NGROK_ORIGIN on this Vercel project.',
      { status: 503, headers: { 'content-type': 'text/plain' } }
    );
  }

  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, `${origin}/`);

  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }
  headers.set('ngrok-skip-browser-warning', 'true');
  headers.set('host', target.host);

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(target.toString(), init);
    const outHeaders = new Headers(upstream.headers);
    outHeaders.delete('content-security-policy');
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outHeaders,
    });
  } catch (err) {
    return new Response(`Upstream error: ${err.message}`, {
      status: 502,
      headers: { 'content-type': 'text/plain' },
    });
  }
}
