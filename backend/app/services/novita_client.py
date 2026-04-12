"""Novita.ai video generation client for active Stone video SKUs."""

import json
import logging

import httpx

from app.services.provider_costs import (
    get_default_video_options,
    get_novita_variant_metadata,
)

logger = logging.getLogger(__name__)

NOVITA_API_BASE = "https://api.novita.ai/v3/async"


NOVITA_MODEL_MAP: dict[str, dict] = {
    "sora-2": {
        "text_endpoint": "wan2.6-t2v",
        "image_endpoint": "wan2.6-i2v",
        "family": "wan",
    },
    "veo-3": {
        "text_endpoint": "minimax-video-01",
        "image_endpoint": "minimax-video-01",
        "family": "minimax",
    },
    "luma-ray2": {
        "text_endpoint": "vidu-q1-text2video",
        "image_endpoint": "vidu-q1-reference2video",
        "family": "vidu",
    },
    "luma-ray2-flash": {
        "text_endpoint": "hunyuan-video-fast",
        "image_endpoint": "pixverse-v4.5-i2v",
        "family": "hunyuan_fast",
        "image_family": "pixverse",
    },
    "minimax": {
        "text_endpoint": "minimax-video-01",
        "image_endpoint": "minimax-video-01",
        "family": "minimax",
    },
    "cogvideox": {
        "text_endpoint": "hunyuan-video-fast",
        "image_endpoint": "pixverse-v4.5-i2v",
        "family": "hunyuan_fast",
        "image_family": "pixverse",
    },
    "pixverse-v5": {
        "text_endpoint": "pixverse-v4.5-t2v",
        "image_endpoint": "pixverse-v4.5-i2v",
        "family": "pixverse",
    },
    "luma-dream": {
        "text_endpoint": "vidu-q1-text2video",
        "image_endpoint": "vidu-q1-reference2video",
        "family": "vidu",
    },
    "pika-2": {
        "text_endpoint": "pixverse-v4.5-t2v",
        "image_endpoint": "pixverse-v4.5-i2v",
        "family": "pixverse",
    },
    "wan-2": {
        "text_endpoint": "wan2.6-t2v",
        "image_endpoint": "wan2.6-i2v",
        "family": "wan",
    },
    "hunyuan": {
        "text_endpoint": "hunyuan-video-fast",
        "image_endpoint": "vidu-q1-reference2video",
        "family": "hunyuan_fast",
        "image_family": "vidu",
    },
    "ltx-video": {
        "text_endpoint": "vidu-q1-text2video",
        "image_endpoint": "vidu-q1-reference2video",
        "family": "vidu",
    },
    "stable-video": {
        "text_endpoint": "wan2.6-t2v",
        "image_endpoint": "wan2.6-i2v",
        "family": "wan",
    },
    "kling-v2": {
        "text_endpoint": "kling-v2.1-t2v-master",
        "image_endpoint": "kling-v2.1-i2v-master",
        "family": "kling",
    },
}


def _headers(api_key: str) -> dict:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def _wan_size(resolution: str) -> str:
    return "1920*1080" if resolution == "1080P" else "1280*720"


def _build_minimax_body(prompt: str, source_image_url: str | None, *, duration: int, resolution: str) -> dict:
    body: dict = {
        "prompt": prompt,
        "duration": duration,
        "resolution": resolution,
        "enable_prompt_expansion": True,
    }
    if source_image_url:
        body["image"] = source_image_url
    return body


def _build_wan_body(prompt: str, source_image_url: str | None, *, duration: int, resolution: str) -> dict:
    body: dict = {
        "input": {"prompt": prompt},
        "parameters": {
            "size": _wan_size(resolution),
            "duration": duration,
            "prompt_extend": True,
            "watermark": False,
        },
    }
    if source_image_url:
        body["input"]["img_url"] = source_image_url
    return body


def _build_vidu_body(prompt: str, source_image_url: str | None, *, duration: int, resolution: str) -> dict:
    body: dict = {
        "prompt": prompt,
        "duration": duration,
        "aspect_ratio": "16:9",
        "resolution": resolution.lower(),
        "movement_amplitude": "medium",
    }
    if source_image_url:
        body["images"] = [source_image_url]
    return body


def _build_pixverse_body(
    prompt: str,
    source_image_url: str | None,
    *,
    resolution: str,
    quality: str,
) -> dict:
    body: dict = {
        "prompt": prompt,
        "aspect_ratio": "16:9",
        "resolution": resolution.lower(),
        "fast_mode": quality == "fast",
    }
    if source_image_url:
        body["image"] = source_image_url
    return body


def _build_hunyuan_fast_body(prompt: str, *, width: int = 1280, height: int = 720) -> dict:
    return {
        "model_name": "hunyuan-video-fast",
        "prompt": prompt,
        "width": width,
        "height": height,
        "steps": 30,
        "seed": -1,
    }


def _build_kling_body(prompt: str, source_image_url: str | None, *, duration: int) -> dict:
    body: dict = {
        "prompt": prompt,
        "duration": str(duration),
    }
    if source_image_url:
        body["image"] = source_image_url
    return body


def _build_body(
    config: dict,
    prompt: str,
    source_image_url: str | None,
    *,
    duration: int,
    resolution: str,
    quality: str,
) -> tuple[str, dict]:
    use_image = bool(source_image_url)
    endpoint = config["image_endpoint"] if use_image else config["text_endpoint"]
    family = config.get("image_family") if use_image and config.get("image_family") else config["family"]

    if family == "minimax":
        body = _build_minimax_body(
            prompt,
            source_image_url,
            duration=duration,
            resolution=resolution,
        )
    elif family == "wan":
        body = _build_wan_body(
            prompt,
            source_image_url,
            duration=duration,
            resolution=resolution,
        )
    elif family == "vidu":
        body = _build_vidu_body(
            prompt,
            source_image_url,
            duration=duration,
            resolution=resolution,
        )
    elif family == "pixverse":
        body = _build_pixverse_body(
            prompt,
            source_image_url,
            resolution=resolution,
            quality=quality,
        )
    elif family == "hunyuan_fast":
        body = _build_hunyuan_fast_body(prompt)
    elif family == "kling":
        body = _build_kling_body(prompt, source_image_url, duration=duration)
    else:
        body = {"prompt": prompt}
        if source_image_url:
            body["image"] = source_image_url

    return endpoint, body


def _extract_video_url(data: dict) -> str | None:
    task = data.get("task", {})
    videos = data.get("videos") or task.get("videos") or task.get("outputs") or []

    if isinstance(videos, list) and videos:
        first = videos[0]
        if isinstance(first, dict):
            return first.get("video_url") or first.get("url") or first.get("media_url")
        if isinstance(first, str) and first.startswith("http"):
            return first

    output = data.get("output") or {}
    return (
        data.get("video_url")
        or task.get("video_url")
        or output.get("video_url")
        or output.get("url")
    )


async def create_novita_video(
    api_key: str,
    prompt: str,
    model: str = "minimax",
    source_image_url: str | None = None,
    duration: int | None = None,
    resolution: str | None = None,
    quality: str | None = None,
    mode: str | None = None,
) -> dict:
    """Submit video generation to Novita.ai."""
    config = NOVITA_MODEL_MAP.get(model)
    if not config:
        return {"error": f"Unknown Novita model: {model}"}

    requested_mode = mode or ("i2v" if source_image_url else "t2v")
    selected = get_default_video_options(model, mode=requested_mode)
    if duration is not None:
        selected["duration"] = duration
    if resolution is not None:
        selected["resolution"] = resolution
    if quality is not None:
        selected["quality"] = quality
    selected["mode"] = requested_mode

    try:
        variant = get_novita_variant_metadata(
            model_id=model,
            duration=int(selected["duration"]),
            resolution=str(selected["resolution"]),
            mode=str(selected["mode"]),
            quality=str(selected["quality"]),
        )
    except ValueError as e:
        return {"error": str(e)}

    if source_image_url and str(variant["mode"]) != "i2v":
        return {"error": f"Model {model} does not support image-to-video for this variant"}
    if not source_image_url and str(variant["mode"]) != "t2v":
        return {"error": f"Model {model} requires a source image for this variant"}

    endpoint, body = _build_body(
        config,
        prompt,
        source_image_url,
        duration=int(variant["duration"]),
        resolution=str(variant["resolution"]),
        quality=str(variant["quality"]),
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{NOVITA_API_BASE}/{endpoint}",
                json=body,
                headers=_headers(api_key),
            )

            if resp.status_code not in (200, 201, 202):
                error = resp.text[:500]
                logger.error(f"Novita submit error {resp.status_code} for {model}: {error}")
                return {"error": f"Novita error {resp.status_code}: {error}"}

            try:
                data = resp.json()
            except json.JSONDecodeError:
                error = resp.text[:500]
                logger.error(f"Novita non-JSON submit response for {model}: {error}")
                return {"error": f"Novita non-JSON response: {error}"}

            task_id = data.get("task_id")
            if not task_id:
                logger.error(f"Novita no task_id in response for {model}: {data}")
                return {"error": "Novita did not return task_id"}

            return {
                "task_id": task_id,
                "resolved_options": {
                    "duration": int(variant["duration"]),
                    "resolution": str(variant["resolution"]),
                    "mode": str(variant["mode"]),
                    "quality": str(variant["quality"]),
                },
            }

    except httpx.TimeoutException:
        return {"error": "Novita timeout"}
    except Exception as e:
        logger.error(f"Novita submit exception for {model}: {e}")
        return {"error": str(e)}


async def check_novita_status(api_key: str, task_id: str) -> dict:
    """Check Novita.ai video status."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{NOVITA_API_BASE}/task-result",
                params={"task_id": task_id},
                headers=_headers(api_key),
            )

            if resp.status_code != 200:
                logger.warning(f"Novita task-result HTTP {resp.status_code} for task {task_id}: {resp.text[:300]}")
                return {"status": "processing"}

            try:
                data = resp.json()
            except json.JSONDecodeError:
                logger.warning(f"Novita task-result non-JSON for task {task_id}: {resp.text[:300]}")
                return {"status": "processing"}

            task = data.get("task", {})
            status = task.get("status", "UNKNOWN")

            if status in ("TASK_STATUS_SUCCEED", "TASK_STATUS_COMPLETED"):
                video_url = _extract_video_url(data)
                if video_url:
                    return {"status": "COMPLETED", "video_url": video_url}
                logger.error(f"Novita COMPLETED but no video_url: {data}")
                return {"status": "FAILED", "error": "No video URL in response"}

            if status in ("TASK_STATUS_FAILED", "TASK_STATUS_CANCELED"):
                reason = task.get("reason") or task.get("message") or "Generation failed"
                return {"status": "FAILED", "error": reason}

            return {"status": "processing"}

    except Exception as e:
        logger.error(f"Novita status check error: {e}")
        return {"status": "processing"}
