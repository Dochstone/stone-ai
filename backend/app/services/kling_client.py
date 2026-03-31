"""Kling AI direct API client — video generation via klingai.com."""

import time
import logging
import jwt
import httpx

logger = logging.getLogger(__name__)

KLING_API_BASE = "https://api.klingai.com"


def generate_kling_token(access_key: str, secret_key: str) -> str:
    """Generate JWT token for Kling API authentication."""
    now = int(time.time())
    payload = {
        "iss": access_key,
        "iat": now,
        "exp": now + 1800,  # 30 minutes
        "nbf": now - 5,
    }
    return jwt.encode(payload, secret_key, algorithm="HS256")


async def create_kling_video(
    access_key: str,
    secret_key: str,
    prompt: str,
    model: str = "kling-v2-master",
    duration: str = "5",
    aspect_ratio: str = "16:9",
    mode: str = "std",
    source_image_url: str | None = None,
) -> dict:
    """Submit video generation task to Kling API.

    Returns: {"task_id": str, "status": str}
    """
    token = generate_kling_token(access_key, secret_key)
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    # Text-to-video or image-to-video
    if source_image_url:
        endpoint = f"{KLING_API_BASE}/v1/videos/image2video"
        body = {
            "model_name": model,
            "prompt": prompt,
            "image": source_image_url,
            "duration": duration,
            "mode": mode,
        }
    else:
        endpoint = f"{KLING_API_BASE}/v1/videos/text2video"
        body = {
            "model_name": model,
            "prompt": prompt,
            "duration": duration,
            "aspect_ratio": aspect_ratio,
            "mode": mode,
            "cfg_scale": 0.5,
        }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(endpoint, json=body, headers=headers)
        data = resp.json()

        if data.get("code") != 0:
            logger.error(f"Kling create error: {data}")
            return {"error": data.get("message", "Kling API error")}

        task_data = data.get("data", {})
        return {
            "task_id": task_data.get("task_id"),
            "status": task_data.get("task_status", "submitted"),
        }


async def check_kling_status(
    access_key: str,
    secret_key: str,
    task_id: str,
    is_image2video: bool = False,
) -> dict:
    """Check Kling video generation status.

    Returns: {"status": "processing"|"COMPLETED"|"FAILED", "video_url"?: str}
    """
    token = generate_kling_token(access_key, secret_key)
    headers = {"Authorization": f"Bearer {token}"}

    endpoint_type = "image2video" if is_image2video else "text2video"
    url = f"{KLING_API_BASE}/v1/videos/{endpoint_type}/{task_id}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, headers=headers)
        data = resp.json()

        if data.get("code") != 0:
            logger.warning(f"Kling status error: {data}")
            return {"status": "processing"}

        task_data = data.get("data", {})
        status = task_data.get("task_status", "processing")

        if status == "succeed":
            videos = task_data.get("task_result", {}).get("videos", [])
            video_url = videos[0].get("url") if videos else None
            return {
                "status": "COMPLETED",
                "video_url": video_url,
            }
        elif status == "failed":
            return {
                "status": "FAILED",
                "error": task_data.get("task_status_msg", "Generation failed"),
            }
        else:
            return {"status": "processing"}
