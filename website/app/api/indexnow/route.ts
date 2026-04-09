import { NextResponse } from "next/server";

const INDEXNOW_KEY = "stoneai2026indexnow";
const HOST = "https://stoneai.ru";

export async function POST(request: Request) {
  try {
    const { urls } = await request.json();
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: "urls array required" }, { status: 400 });
    }

    const response = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: "stoneai.ru",
        key: INDEXNOW_KEY,
        keyLocation: `${HOST}/${INDEXNOW_KEY}.txt`,
        urlList: urls.map((u: string) => u.startsWith("http") ? u : `${HOST}${u}`),
      }),
    });

    return NextResponse.json({
      status: response.status,
      submitted: urls.length,
    });
  } catch (error) {
    return NextResponse.json({ error: "IndexNow submission failed" }, { status: 500 });
  }
}
