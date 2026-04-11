"""Google Generative Language client for Veo video generation."""

import logging

import httpx

logger = logging.getLogger(__name__)

VERTEX_API_BASE = "https://generativelanguage.googleapis.com/v1beta"


def _headers(api_key: str) -> dict:
    return {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json",
    }


async def create_vertex_video(
    api_key: str,
    prompt: str,
    model: str = "veo-3.1-generate-preview",
    duration_seconds: int = 5,
) -> dict:
    """Submit Veo generation. Returns {"task_id": str} or {"error": str}."""
    body = {
        "instances": [
            {
                "prompt": prompt,
                "parameters": {
                    "aspectRatio": "16:9",
                    "durationSeconds": str(duration_seconds),
                },
            }
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{VERTEX_API_BASE}/models/{model}:predictLongRunning",
                json=body,
                headers=_headers(api_key),
            )

            if resp.status_code not in (200, 201, 202):
                error = resp.text[:500]
                logger.error(f"Vertex submit error {resp.status_code}: {error}")
                return {"error": f"Vertex error {resp.status_code}: {error}"}

            data = resp.json()
            operation_name = data.get("name")
            if not operation_name:
                logger.error(f"Vertex no operation name in response: {data}")
                return {"error": "Vertex did not return operation name"}

            return {"task_id": operation_name}

    except httpx.TimeoutException:
        return {"error": "Vertex timeout"}
    except Exception as e:
        logger.error(f"Vertex submit exception: {e}")
        return {"error": str(e)}


async def check_vertex_status(api_key: str, operation_name: str) -> dict:
    """Check Veo generation status. Returns {"status": ..., "video_url"?: str}."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{VERTEX_API_BASE}/{operation_name}",
                headers=_headers(api_key),
            )

            if resp.status_code != 200:
                error = resp.text[:500]
                logger.warning(f"Vertex status error {resp.status_code}: {error}")
                return {"status": "processing"}

            data = resp.json()
            if not data.get("done"):
                return {"status": "processing"}

            if data.get("error"):
                message = data["error"].get("message") or "Generation failed"
                return {"status": "FAILED", "error": message}

            samples = (
                data.get("response", {})
                .get("generateVideoResponse", {})
                .get("generatedSamples", [])
            )
            video_url = None
            if samples:
                video_url = samples[0].get("video", {}).get("uri")

            if video_url:
                return {"status": "COMPLETED", "video_url": video_url}

            logger.error(f"Vertex COMPLETED but no video url: {data}")
            return {"status": "FAILED", "error": "No video URL in response"}

    except Exception as e:
        logger.error(f"Vertex status check error: {e}")
        return {"status": "processing"}
