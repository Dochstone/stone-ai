"""Novita.ai video generation client — text-to-video and image-to-video.

Each model has its own async endpoint on Novita (not a shared txt2video).
"""

import logging

import httpx

logger = logging.getLogger(__name__)

NOVITA_API_BASE = "https://api.novita.ai/v3/async"

# model_id -> (novita_endpoint_slug, default params)
NOVITA_MODEL_MAP: dict[str, dict] = {
    "minimax": {
        "endpoint": "minimax-hailuo-02",
        "params": {"duration": 6, "resolution": "768P"},
    },
    "hunyuan": {
        "endpoint": "hunyuan-video",
        "params": {},
    },
    "cogvideox": {
        "endpoint": "cogvideox-3",
        "params": {},
    },
    "wan-2": {
        "endpoint": "wan-2.1",
        "params": {},
    },
    "stable-video": {
        "endpoint": "stable-video-diffusion",
        "params": {},
    },
}


def _headers(api_key: str) -> dict:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


async def create_novita_video(
    api_key: str,
    prompt: str,
    model: str = "minimax",
    source_image_url: str | None = None,
) -> dict:
    """Submit video generation to Novita.ai. Returns {"task_id": str} or {"error": str}."""
    model_info = NOVITA_MODEL_MAP.get(model)
    if not model_info:
        return {"error": f"Unknown Novita model: {model}"}

    slug = model_info["endpoint"]

    body: dict = {"prompt": prompt, **model_info["params"]}
    if source_image_url:
        body["image"] = source_image_url

    endpoint = f"{NOVITA_API_BASE}/{slug}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(endpoint, json=body, headers=_headers(api_key))

            if resp.status_code not in (200, 201, 202):
                error = resp.text[:500]
                logger.error(f"Novita submit error {resp.status_code}: {error}")
                return {"error": f"Novita error {resp.status_code}: {error}"}

            data = resp.json()
            task_id = data.get("task_id")
            if not task_id:
                logger.error(f"Novita no task_id in response: {data}")
                return {"error": "Novita did not return task_id"}

            return {"task_id": task_id}

    except httpx.TimeoutException:
        return {"error": "Novita timeout"}
    except Exception as e:
        logger.error(f"Novita submit exception: {e}")
        return {"error": str(e)}


async def check_novita_status(api_key: str, task_id: str) -> dict:
    """Check Novita.ai video status. Returns {"status": ..., "video_url"?: str}."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{NOVITA_API_BASE}/task-result",
                params={"task_id": task_id},
                headers=_headers(api_key),
            )

            if resp.status_code != 200:
                return {"status": "processing"}

            data = resp.json()
            task = data.get("task", {})
            status = task.get("status", "UNKNOWN")

            if status == "TASK_STATUS_SUCCEED":
                videos = data.get("videos", [])
                video_url = videos[0].get("video_url") if videos else None
                if video_url:
                    return {"status": "COMPLETED", "video_url": video_url}
                logger.error(f"Novita COMPLETED but no video_url: {data}")
                return {"status": "FAILED", "error": "No video URL in response"}

            if status in ("TASK_STATUS_FAILED", "TASK_STATUS_CANCELED"):
                reason = task.get("reason", "Generation failed")
                return {"status": "FAILED", "error": reason}

            return {"status": "processing"}

    except Exception as e:
        logger.error(f"Novita status check error: {e}")
        return {"status": "processing"}
