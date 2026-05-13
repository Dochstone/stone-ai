const BING_SITE_AUTH_XML = `<?xml version="1.0"?>
<users>
	<user>A8BE50E224BB75FD5D07FE141BD3E157</user>
</users>
`;

export const dynamic = "force-static";

export function GET() {
  return new Response(BING_SITE_AUTH_XML, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
