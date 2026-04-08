"""Video generation service via fal.ai API."""

import json
import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

FAL_QUEUE_URL = "https://queue.fal.run"

VIDEO_MODELS_REGISTRY = [
    # Tier 1: Premium (best quality)
    {"id": "kling-v3",    "name": "Kling 3.0 Pro",     "company": "Kuaishou",  "fal_model": "direct-kling",                    "duration": "5-10s", "cost": 0.10, "price": 0.30, "active": False},  # Direct Kling API — disabled
    {"id": "sora-2",      "name": "Sora 2 Pro",        "company": "OpenAI",    "fal_model": "fal-ai/sora-2/text-to-video/pro", "duration": "5-10s", "cost": 0.15, "price": 0.50, "active": True},
    {"id": "veo-3",       "name": "Veo 3.1",           "company": "Google",    "fal_model": "fal-ai/veo3.1",                   "duration": "5-10s", "cost": 0.20, "price": 0.65, "active": True},
    {"id": "luma-ray2",   "name": "Luma Ray 2",        "company": "Luma",      "fal_model": "fal-ai/luma-dream-machine/ray-2", "duration": "5-10s", "cost": 0.15, "price": 0.50, "active": True},
    {"id": "luma-ray2-flash", "name": "Luma Ray 2 Flash", "company": "Luma",   "fal_model": "fal-ai/luma-dream-machine/ray-2-flash", "duration": "5-10s", "cost": 0.08, "price": 0.30, "active": True},
    {"id": "runway-gen3", "name": "Runway Gen-3 Alpha", "company": "Runway",   "fal_model": "fal-ai/runway-gen3/turbo/image-to-video", "duration": "5-10s", "cost": 0.25, "price": 0.85, "active": False},
    # Tier 2: Working models
    {"id": "kling-v2",    "name": "Kling v2 Master",   "company": "Kuaishou",  "fal_model": "direct-kling",                    "duration": "5-10s", "cost": 0.07, "price": 0.25, "active": False},  # Direct Kling API — disabled
    {"id": "minimax",     "name": "MiniMax Hailuo",    "company": "MiniMax",   "fal_model": "fal-ai/minimax-video",            "duration": "5-10s", "cost": 0.08, "price": 0.28, "active": True},
    {"id": "cogvideox",   "name": "CogVideoX 5B",     "company": "THUDM",     "fal_model": "fal-ai/cogvideox-5b",             "duration": "5s",    "cost": 0.06, "price": 0.20, "active": True},
    {"id": "mochi",       "name": "Mochi v1",          "company": "Genmo",     "fal_model": "fal-ai/mochi-v1",                 "duration": "5s",    "cost": 0.05, "price": 0.18, "active": True},
    {"id": "pixverse-v5", "name": "PixVerse v4.5",     "company": "PixVerse",  "fal_model": "fal-ai/pixverse/v4.5",            "duration": "5-10s", "cost": 0.06, "price": 0.22, "active": True},
    {"id": "luma-dream",  "name": "Luma Dream Machine", "company": "Luma",    "fal_model": "fal-ai/luma-dream-machine",       "duration": "5s",    "cost": 0.10, "price": 0.35, "active": True},
    {"id": "pika-2",      "name": "Pika 2.0",          "company": "Pika",     "fal_model": "fal-ai/pika/v2",                  "duration": "3-5s",  "cost": 0.05, "price": 0.18, "active": True},
    # Tier 3: Budget
    {"id": "wan-2",       "name": "Wan 2.6",           "company": "Alibaba",   "fal_model": "fal-ai/wan/v2.6/text-to-video",   "duration": "5-10s", "cost": 0.05, "price": 0.15, "active": False},  # disabled — hangs on fal.ai
    {"id": "hunyuan",     "name": "Hunyuan Video",     "company": "Tencent",   "fal_model": "fal-ai/hunyuan-video",            "duration": "5s",    "cost": 0.06, "price": 0.18, "active": False},  # disabled — hangs on fal.ai
    {"id": "ltx-video",   "name": "LTX Video 2.3",    "company": "Lightricks", "fal_model": "fal-ai/ltx-2-19b",               "duration": "5s",    "cost": 0.04, "price": 0.12, "active": True},
    {"id": "stable-video", "name": "Stable Video",     "company": "Stability", "fal_model": "fal-ai/stable-video",             "duration": "4s",    "cost": 0.04, "price": 0.15, "active": True},
]

VIDEO_MODEL_MAP = {m["id"]: m for m in VIDEO_MODELS_REGISTRY}


def get_video_model(model_id: str) -> dict | None:
    m = VIDEO_MODEL_MAP.get(model_id)
    if m and not m.get("active", True):
        return None
    return m


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

            if resp.status_code not in (200, 202):
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
    # Base model path for status (strip version suffix like /v3/pro, /v2/master)
    # e.g. fal-ai/kling-video/v3/pro → fal-ai/kling-video
    fal_base = fal_model.split("/")[0] + "/" + fal_model.split("/")[1] if "/" in fal_model else fal_model
    # Keep first two path segments: fal-ai/kling-video, fal-ai/minimax-video, etc.
    parts = fal_model.split("/")
    if len(parts) >= 2:
        fal_base = parts[0] + "/" + parts[1]
    else:
        fal_base = fal_model
    headers = {"Authorization": f"Key {settings.fal_api_key}"}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Try full path first, fallback to base path
            resp = await client.get(
                f"{FAL_QUEUE_URL}/{fal_model}/requests/{fal_request_id}/status",
                headers=headers,
            )

            if resp.status_code not in (200, 202) and fal_base != fal_model:
                # Retry with base model path (fal.ai quirk for versioned models)
                resp = await client.get(
                    f"{FAL_QUEUE_URL}/{fal_base}/requests/{fal_request_id}/status",
                    headers=headers,
                )

            if resp.status_code not in (200, 202):
                return {"status": "FAILED", "error": f"Status check failed: {resp.status_code}"}

            data = resp.json()
            status = data.get("status", "UNKNOWN")
            inference_time = data.get("metrics", {}).get("inference_time", 0)

            if status == "COMPLETED":
                # Fetch the actual result — try full path, then base
                result = None
                for path in [fal_model, fal_base] if fal_base != fal_model else [fal_model]:
                    try:
                        result_resp = await client.get(
                            f"{FAL_QUEUE_URL}/{path}/requests/{fal_request_id}",
                            headers=headers,
                        )
                        if result_resp.status_code == 200 and result_resp.text.strip():
                            result = result_resp.json()
                            logger.info(f"fal.ai result via {path}: keys={list(result.keys())}")
                            break
                    except Exception as e:
                        logger.warning(f"fal.ai result fetch error ({path}): {e}")

                video_url = None
                if result:
                    # Try every known response format
                    video_url = (
                        result.get("video", {}).get("url") if isinstance(result.get("video"), dict) else None
                    ) or (
                        result.get("output", {}).get("video", {}).get("url") if isinstance(result.get("output"), dict) else None
                    ) or result.get("video_url") or (
                        result.get("data", {}).get("video", {}).get("url") if isinstance(result.get("data"), dict) else None
                    ) or (
                        result.get("video") if isinstance(result.get("video"), str) and result.get("video", "").startswith("http") else None
                    )
                    if not video_url:
                        import re
                        urls = re.findall(r'https?://[^\s"\']+\.mp4[^\s"\']*', str(result))
                        if not urls:
                            urls = re.findall(r'https?://[^\s"\']+(?:video|\.webm|\.mov|fal\.media)[^\s"\']*', str(result))
                        if urls:
                            video_url = urls[0]
                    if not video_url:
                        logger.error(f"fal.ai COMPLETED but no video_url for {model_id}: {str(result)[:1000]}")
                else:
                    logger.error(f"fal.ai COMPLETED but empty result for {model_id}, request_id={fal_request_id}")

                if not video_url:
                    # Don't mark as completed without URL — keep polling
                    return {"status": "IN_PROGRESS"}

                return {
                    "status": "COMPLETED",
                    "video_url": video_url,
                }

            return {"status": status}

    except Exception as e:
        logger.error(f"fal.ai status check error: {e}")
        return {"status": "FAILED", "error": str(e)}
