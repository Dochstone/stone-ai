"""Kling AI direct API client — video generation, image generation, lip sync, effects."""

import time
import logging
import jwt
import httpx

logger = logging.getLogger(__name__)

KLING_API_BASE = "https://api-singapore.klingai.com"


def generate_kling_token(access_key: str, secret_key: str) -> str:
    """Generate JWT token for Kling API authentication."""
    now = int(time.time())
    payload = {
        "iss": access_key,
        "iat": now,
        "exp": now + 1800,
        "nbf": now - 5,
    }
    return jwt.encode(payload, secret_key, algorithm="HS256")


def _headers(access_key: str, secret_key: str) -> dict:
    return {
        "Authorization": f"Bearer {generate_kling_token(access_key, secret_key)}",
        "Content-Type": "application/json",
    }


# ═══════════════════════════════════════════
# VIDEO GENERATION
# ═══════════════════════════════════════════

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
    """Submit video generation task. Returns {"task_id": str} or {"error": str}."""
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
        resp = await client.post(endpoint, json=body, headers=_headers(access_key, secret_key))
        data = resp.json()

        if data.get("code") != 0:
            logger.error(f"Kling video create error: {data}")
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
    """Check video generation status. Returns {"status": ..., "video_url"?: ...}."""
    endpoint_type = "image2video" if is_image2video else "text2video"
    url = f"{KLING_API_BASE}/v1/videos/{endpoint_type}/{task_id}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, headers=_headers(access_key, secret_key))
        data = resp.json()

        if data.get("code") != 0:
            return {"status": "processing"}

        task_data = data.get("data", {})
        status = task_data.get("task_status", "processing")

        if status == "succeed":
            videos = task_data.get("task_result", {}).get("videos", [])
            video_url = videos[0].get("url") if videos else None
            return {"status": "COMPLETED", "video_url": video_url}
        elif status == "failed":
            return {"status": "FAILED", "error": task_data.get("task_status_msg", "Failed")}
        else:
            return {"status": "processing"}


# ═══════════════════════════════════════════
# IMAGE GENERATION (KOLORS)
# ═══════════════════════════════════════════

async def create_kling_image(
    access_key: str,
    secret_key: str,
    prompt: str,
    model: str = "kolors-v2",
    aspect_ratio: str = "1:1",
    image_count: int = 1,
    negative_prompt: str = "",
) -> dict:
    """Generate image with KOLORS. Returns {"task_id": str} or {"error": str}."""
    body = {
        "model_name": model,
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "image_count": image_count,
    }
    if negative_prompt:
        body["negative_prompt"] = negative_prompt

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{KLING_API_BASE}/v1/images/kolors",
            json=body,
            headers=_headers(access_key, secret_key),
        )
        data = resp.json()

        if data.get("code") != 0:
            logger.error(f"Kling image create error: {data}")
            return {"error": data.get("message", "Kling API error")}

        task_data = data.get("data", {})
        return {
            "task_id": task_data.get("task_id"),
            "status": task_data.get("task_status", "submitted"),
        }


async def check_kling_image_status(
    access_key: str,
    secret_key: str,
    task_id: str,
) -> dict:
    """Check image generation status. Returns {"status": ..., "images"?: [...]}."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"{KLING_API_BASE}/v1/images/kolors/{task_id}",
            headers=_headers(access_key, secret_key),
        )
        data = resp.json()

        if data.get("code") != 0:
            return {"status": "processing"}

        task_data = data.get("data", {})
        status = task_data.get("task_status", "processing")

        if status == "succeed":
            images = task_data.get("task_result", {}).get("images", [])
            image_urls = [img.get("url") for img in images if img.get("url")]
            return {"status": "COMPLETED", "images": image_urls}
        elif status == "failed":
            return {"status": "FAILED", "error": task_data.get("task_status_msg", "Failed")}
        else:
            return {"status": "processing"}


# ═══════════════════════════════════════════
# VIDEO EFFECTS (anime, flames, etc.)
# ═══════════════════════════════════════════

async def create_kling_effect_video(
    access_key: str,
    secret_key: str,
    image_url: str,
    effect_id: str = "simple_bloom",
    model: str = "kling-v1-6",
    mode: str = "std",
    duration: str = "5",
) -> dict:
    """Apply effect to image and generate video."""
    body = {
        "model_name": model,
        "image": image_url,
        "effect": effect_id,
        "duration": duration,
        "mode": mode,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{KLING_API_BASE}/v1/videos/image2video-effects",
            json=body,
            headers=_headers(access_key, secret_key),
        )
        data = resp.json()

        if data.get("code") != 0:
            logger.error(f"Kling effects error: {data}")
            return {"error": data.get("message", "Kling API error")}

        task_data = data.get("data", {})
        return {
            "task_id": task_data.get("task_id"),
            "status": task_data.get("task_status", "submitted"),
        }


# ═══════════════════════════════════════════
# LIP SYNC
# ═══════════════════════════════════════════

async def create_kling_lipsync(
    access_key: str,
    secret_key: str,
    video_url: str,
    audio_url: str,
) -> dict:
    """Apply lip sync to video with audio."""
    body = {
        "video_url": video_url,
        "audio_url": audio_url,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{KLING_API_BASE}/v1/videos/lipsync",
            json=body,
            headers=_headers(access_key, secret_key),
        )
        data = resp.json()

        if data.get("code") != 0:
            logger.error(f"Kling lipsync error: {data}")
            return {"error": data.get("message", "Kling API error")}

        task_data = data.get("data", {})
        return {
            "task_id": task_data.get("task_id"),
            "status": task_data.get("task_status", "submitted"),
        }


# ═══════════════════════════════════════════
# VIRTUAL TRY-ON
# ═══════════════════════════════════════════

async def create_kling_tryon(
    access_key: str,
    secret_key: str,
    person_image_url: str,
    garment_image_url: str,
    model: str = "kolors-virtual-try-on-v1.5",
) -> dict:
    """Virtual try-on — fit garment onto person."""
    body = {
        "model_name": model,
        "human_image": person_image_url,
        "cloth_image": garment_image_url,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{KLING_API_BASE}/v1/images/virtual-try-on",
            json=body,
            headers=_headers(access_key, secret_key),
        )
        data = resp.json()

        if data.get("code") != 0:
            logger.error(f"Kling try-on error: {data}")
            return {"error": data.get("message", "Kling API error")}

        task_data = data.get("data", {})
        return {
            "task_id": task_data.get("task_id"),
            "status": task_data.get("task_status", "submitted"),
        }
