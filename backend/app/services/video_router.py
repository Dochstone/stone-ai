"""Video generation service via fal.ai API."""

import json
import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

FAL_QUEUE_URL = "https://queue.fal.run"

VIDEO_MODELS_REGISTRY = [
    {"id": "kling-v2",    "name": "Kling v2",          "company": "Kuaishou",  "fal_model": "fal-ai/kling-video/v2/master",    "duration": "5-10s", "cost": 0.10, "price": 0.35, "active": True},
    {"id": "runway-gen3", "name": "Runway Gen-3 Alpha", "company": "Runway",    "fal_model": "fal-ai/runway-gen3/turbo/image-to-video", "duration": "5-10s", "cost": 0.25, "price": 0.85, "active": True},
    {"id": "pika-2",      "name": "Pika 2.0",          "company": "Pika",      "fal_model": "fal-ai/pika/v2",                  "duration": "3-5s",  "cost": 0.05, "price": 0.18, "active": True},
    {"id": "stable-video", "name": "Stable Video",     "company": "Stability", "fal_model": "fal-ai/stable-video",             "duration": "4s",    "cost": 0.04, "price": 0.15, "active": True},
    {"id": "luma-dream",  "name": "Luma Dream Machine", "company": "Luma",     "fal_model": "fal-ai/luma-dream-machine",       "duration": "5s",    "cost": 0.15, "price": 0.50, "active": True},
]

VIDEO_MODEL_MAP = {m["id"]: m for m in VIDEO_MODELS_REGISTRY}


def get_video_model(model_id: str) -> dict | None:
    return VIDEO_MODEL_MAP.get(model_id)


def get_video_price(model_id: str) -> float:
    m = VIDEO_MODEL_MAP.get(model_id)
    return m["price"] if m else 0.0


def get_video_models_list() -> list[dict]:
    return [
        {
            "id": m["id"],
            "name": m["name"],
            "company": m["company"],
            "duration": m["duration"],
            "price_usd": m["price"],
            "category": "video",
        }
        for m in VIDEO_MODELS_REGISTRY
        if m.get("active", True)
    ]


async def submit_video_generation(
    model_id: str,
    prompt: str,
    source_image_url: str | None = None,
) -> dict:
    """
    Submit video generation to fal.ai queue.

    Returns: {"request_id": str} on success, {"error": str} on failure.
    """
    settings = get_settings()
    model = VIDEO_MODEL_MAP.get(model_id)
    if not model:
        return {"error": f"Unknown video model: {model_id}"}

    fal_model = model["fal_model"]
    headers = {
        "Authorization": f"Key {settings.fal_api_key}",
        "Content-Type": "application/json",
    }

    payload: dict = {"prompt": prompt}
    if source_image_url:
        payload["image_url"] = source_image_url

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{FAL_QUEUE_URL}/{fal_model}",
                headers=headers,
                json=payload,
            )

            if resp.status_code != 200:
                error = resp.text[:500]
                logger.error(f"fal.ai submit error {resp.status_code}: {error}")
                return {"error": f"fal.ai error {resp.status_code}: {error}"}

            data = resp.json()
            request_id = data.get("request_id")
            if not request_id:
                return {"error": "fal.ai did not return request_id"}

            return {"request_id": request_id}

    except httpx.TimeoutException:
        return {"error": "fal.ai timeout"}
    except Exception as e:
        logger.error(f"fal.ai submit exception: {e}")
        return {"error": str(e)}


async def check_video_status(model_id: str, fal_request_id: str) -> dict:
    """
    Check status of a video generation request on fal.ai.

    Returns: {"status": "IN_QUEUE"|"IN_PROGRESS"|"COMPLETED"|"FAILED", "video_url"?: str, ...}
    """
    settings = get_settings()
    model = VIDEO_MODEL_MAP.get(model_id)
    if not model:
        return {"status": "FAILED", "error": "Unknown model"}

    fal_model = model["fal_model"]
    headers = {"Authorization": f"Key {settings.fal_api_key}"}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{FAL_QUEUE_URL}/{fal_model}/requests/{fal_request_id}/status",
                headers=headers,
            )

            if resp.status_code != 200:
                return {"status": "FAILED", "error": f"Status check failed: {resp.status_code}"}

            data = resp.json()
            status = data.get("status", "UNKNOWN")

            if status == "COMPLETED":
                # Fetch the actual result
                result_resp = await client.get(
                    f"{FAL_QUEUE_URL}/{fal_model}/requests/{fal_request_id}",
                    headers=headers,
                )
                if result_resp.status_code == 200:
                    result = result_resp.json()
                    video_url = result.get("video", {}).get("url") or result.get("output", {}).get("video", {}).get("url") or result.get("video_url")
                    return {
                        "status": "COMPLETED",
                        "video_url": video_url,
                    }

            return {"status": status}

    except Exception as e:
        logger.error(f"fal.ai status check error: {e}")
        return {"status": "FAILED", "error": str(e)}
