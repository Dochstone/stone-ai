export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "POST" && request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    const googleUrl = "https://generativelanguage.googleapis.com" + url.pathname + url.search;

    // Only forward essential headers — strip IP/geo headers so Google sees Cloudflare's IP
    const headers = new Headers();
    headers.set("Content-Type", request.headers.get("Content-Type") || "application/json");
    const apiKey = request.headers.get("x-goog-api-key");
    if (apiKey) {
      headers.set("x-goog-api-key", apiKey);
    }

    const googleResponse = await fetch(googleUrl, {
      method: request.method,
      headers: headers,
      body: request.method === "POST" ? request.body : undefined,
    });

    // Return response with CORS headers
    const responseHeaders = new Headers(googleResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(googleResponse.body, {
      status: googleResponse.status,
      headers: responseHeaders,
    });
  },
};
