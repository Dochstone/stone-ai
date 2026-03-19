"""3D generation service via fal.ai API — Tripo and TripoSR."""

import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

FAL_QUEUE_URL = "https://queue.fal.run"

THREED_MODELS_REGISTRY = [
    {"id": "tripo-v2.5", "name": "Tripo v2.5", "company": "Tripo3D", "fal_model": "fal-ai/tripo/v2.5/image-to-3d", "time": "25-100s", "cost": 0.20, "price": 0.60, "supports_text": True, "supports_image": True, "active": True},
    {"id": "triposr",    "name": "TripoSR",    "company": "Stability", "fal_model": "fal-ai/triposr",                "time": "<1s",    "cost": 0.07, "price": 0.21, "supports_text": False, "supports_image": True, "active": True},
]

THREED_MODEL_MAP = {m["id"]: m for m in THREED_MODELS_REGISTRY}


def get_threed_model(model_id: str) -> dict | None:
    return THREED_MODEL_MAP.get(model_id)


def get_threed_price(model_id: str) -> float:
    m = THREED_MODEL_MAP.get(model_id)
    return m["price"] if m else 0.0


def get_threed_models_list() -> list[dict]:
    return [
        {
            "id": m["id"],
            "name": m["name"],
            "company": m["company"],
            "time": m["time"],
            "price_usd": m["price"],
            "supports_text": m["supports_text"],
            "supports_image": m["supports_image"],
            "category": "3d",
        }
        for m in THREED_MODELS_REGISTRY
        if m.get("active", True)
    ]


async def submit_threed_generation(
    model_id: str,
    prompt: str | None = None,
    image_url: str | None = None,
) -> dict:
    """
    Submit 3D generation to fal.ai queue.
    Returns: {"request_id": str} on success, {"error": str} on failure.
    """
    settings = get_settings()
    model = THREED_MODEL_MAP.get(model_id)
    if not model:
        return {"error": f"Unknown 3D model: {model_id}"}

    if not model["supports_text"] and not image_url:
        return {"error": f"{model['name']} requires an image input"}

    fal_model = model["fal_model"]
    headers = {
        "Authorization": f"Key {settings.fal_api_key}",
        "Content-Type": "application/json",
    }

    payload: dict = {}
    if image_url:
        payload["image_url"] = image_url
    if prompt:
        payload["prompt"] = prompt

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{FAL_QUEUE_URL}/{fal_model}",
                headers=headers,
                json=payload,
            )

            if resp.status_code != 200:
                error = resp.text[:500]
                logger.error(f"fal.ai 3D submit error {resp.status_code}: {error}")
                return {"error": f"fal.ai error {resp.status_code}: {error}"}

            data = resp.json()
            request_id = data.get("request_id")
            if not request_id:
                # TripoSR may return result directly (sync)
                model_url = data.get("mesh", {}).get("url") or data.get("model_mesh", {}).get("url") or data.get("output", {}).get("model", {}).get("url")
                if model_url:
                    return {"request_id": "__sync__", "model_url": model_url}
                return {"error": "fal.ai did not return request_id"}

            return {"request_id": request_id}

    except httpx.TimeoutException:
        return {"error": "fal.ai timeout"}
    except Exception as e:
        logger.error(f"fal.ai 3D submit exception: {e}")
        return {"error": str(e)}


async def check_threed_status(model_id: str, fal_request_id: str) -> dict:
    """
    Check status of a 3D generation request on fal.ai.
    Returns: {"status": "COMPLETED"|"IN_PROGRESS"|"FAILED", "model_url"?: str}
    """
    settings = get_settings()
    model = THREED_MODEL_MAP.get(model_id)
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
                result_resp = await client.get(
                    f"{FAL_QUEUE_URL}/{fal_model}/requests/{fal_request_id}",
                    headers=headers,
                )
                if result_resp.status_code == 200:
                    result = result_resp.json()
                    model_url = (
                        result.get("mesh", {}).get("url")
                        or result.get("model_mesh", {}).get("url")
                        or result.get("output", {}).get("model", {}).get("url")
                        or result.get("glb_url")
                    )
                    return {"status": "COMPLETED", "model_url": model_url}

            return {"status": status}

    except Exception as e:
        logger.error(f"fal.ai 3D status check error: {e}")
        return {"status": "FAILED", "error": str(e)}
