"""Provider cost tracking and canonical Novita video pricing metadata."""

from app.services.ai_router import MODELS_REGISTRY

# OpenRouter costs per 1M tokens (what WE pay)
# Source: https://openrouter.ai/models
OPENROUTER_COSTS: dict[str, dict[str, float]] = {
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "claude-haiku-4.5": {"input": 0.80, "output": 4.00},
    "gemini-2.0-flash": {"input": 0.10, "output": 0.40},
    "llama-4-maverick": {"input": 0.20, "output": 0.60},
    "mistral-large-25": {"input": 2.00, "output": 6.00},
    "deepseek-r1": {"input": 0.55, "output": 2.19},
    "deepseek-v3": {"input": 0.30, "output": 0.88},
    "deepseek-v3.2": {"input": 0.30, "output": 0.88},
    "gpt-4.1-mini": {"input": 0.40, "output": 1.60},
    "gpt-4.1-nano": {"input": 0.10, "output": 0.40},
    "gemini-2.5-flash": {"input": 0.15, "output": 0.60},
    "claude-sonnet-4": {"input": 3.00, "output": 15.00},
    "claude-sonnet-4.5": {"input": 3.00, "output": 15.00},
    "grok-3-mini": {"input": 0.30, "output": 0.50},
    "qwen-3-235b": {"input": 0.14, "output": 0.70},
    "qwen-qwq": {"input": 0.14, "output": 0.70},
    "minimax-m2.5": {"input": 0.18, "output": 0.66},
    "command-r7": {"input": 0.04, "output": 0.04},
    "mistral-small": {"input": 0.10, "output": 0.30},
    "claude-opus-4": {"input": 15.00, "output": 75.00},
    "claude-opus-4.5": {"input": 15.00, "output": 75.00},
    "gpt-4.1": {"input": 2.00, "output": 8.00},
    "gpt-5.1": {"input": 2.00, "output": 16.00},
    "gpt-5.4": {"input": 2.50, "output": 15.00},
    "gemini-2.5-pro": {"input": 1.25, "output": 10.00},
    "gemini-3-pro": {"input": 1.50, "output": 9.00},
    "grok-3": {"input": 3.00, "output": 15.00},
    "perplexity-sonar-pro": {"input": 3.00, "output": 15.00},
    "kimi-k2.5": {"input": 0.20, "output": 1.50},
    "o4-mini": {"input": 1.10, "output": 4.40},
    "o3": {"input": 2.00, "output": 8.00},
    "claude-haiku-4.5-think": {"input": 0.80, "output": 4.00},
    "gemini-2.5-flash-think": {"input": 0.15, "output": 3.50},
    "devstral": {"input": 0.15, "output": 0.60},
    "nano-banana-pro": {"input": 2.00, "output": 12.00},
    "nano-banana": {"input": 0.15, "output": 0.60},
    "gpt-5-image": {"input": 2.50, "output": 15.00},
    "gpt-5-image-mini": {"input": 0.60, "output": 2.40},
    "gemma-3-27b": {"input": 0.00, "output": 0.00},
    "gemma-3n-4b": {"input": 0.00, "output": 0.00},
    "phi-4": {"input": 0.00, "output": 0.00},
    "llama-3.3-70b": {"input": 0.00, "output": 0.00},
    "qwen-turbo": {"input": 0.05, "output": 0.18},
    "nvidia-nemotron": {"input": 0.00, "output": 0.00},
    "mythomax-13b": {"input": 0.00, "output": 0.00},
    "perplexity-sonar": {"input": 1.00, "output": 1.00},
    "perplexity-sonar-deep": {"input": 2.00, "output": 8.00},
}


FAL_COSTS: dict[str, float] = {
    "sora-2": 0.10,
    "veo-3": 0.40,
    "luma-ray2": 0.50,
    "luma-ray2-flash": 0.20,
    "luma-dream": 0.50,
    "runway-gen3": 0.10,
    "pixverse-v5": 0.04,
    "hunyuan": 0.40,
    "ltx-video": 0.02,
    "cogvideox": 0.20,
    "wan-2": 0.03,
    "stable-video": 0.075,
    "mochi": 0.40,
    "minimax": 0.50,
    "pika-2": 0.05,
}


KLING_COSTS: dict[str, float] = {
    "kling-v2": 0.07,
    "kling-v3": 0.10,
    "kling-v2-master": 0.07,
    "kling-v2-5-master": 0.09,
}


NOVITA_COSTS: dict[str, float] = {
    "sora-2": 0.25,
    "veo-3": 0.25,
    "luma-ray2": 0.18,
    "luma-ray2-flash": 0.10,
    "minimax": 0.25,
    "cogvideox": 0.10,
    "pixverse-v5": 0.07,
    "luma-dream": 0.18,
    "pika-2": 0.07,
    "wan-2": 0.12,
    "hunyuan": 0.10,
    "ltx-video": 0.18,
    "stable-video": 0.12,
}


VERTEX_COSTS: dict[str, float] = {
    "veo-3": 0.25,
}


IMAGE_GEN_COSTS: dict[str, float] = {
    "flux-schnell": 0.003,
    "stable-diffusion-xl": 0.01,
}


WHISPER_COST_PER_MINUTE = 0.006


THREED_COSTS: dict[str, float] = {
    "tripo-v3": 0.05,
    "meshy-6": 0.08,
}


VIDEO_POINTS_MIN = 1


def cost_to_points(cost_usd: float) -> int:
    """Map provider cost to user-facing monthly video points."""
    if cost_usd <= 0.30:
        return 1
    if cost_usd <= 0.50:
        return 2
    if cost_usd <= 1.00:
        return 4
    return 6


def _variant(
    duration: int,
    resolution: str,
    mode: str,
    quality: str,
    cost_usd: float,
    *,
    provider_mode: str | None = None,
) -> dict[str, str | int | float]:
    return {
        "duration": duration,
        "resolution": resolution,
        "mode": mode,
        "quality": quality,
        "cost_usd": round(cost_usd, 4),
        "points": max(VIDEO_POINTS_MIN, cost_to_points(cost_usd)),
        "provider_mode": provider_mode or mode,
    }


def _normalize_resolution(value: str) -> str:
    return (value or "720P").strip().upper().replace(" ", "")


def _normalize_quality(value: str) -> str:
    normalized = (value or "standard").strip().lower()
    if normalized == "fast_mode":
        return "fast"
    return normalized


def _normalize_mode(value: str) -> str:
    normalized = (value or "t2v").strip().lower()
    if normalized == "ref2v":
        return "i2v"
    return normalized


NOVITA_PUBLIC_MODEL_FAMILY: dict[str, str] = {
    # Marketing/public SKUs are preserved, but points/pricing come from the
    # underlying Novita family that actually handles the request.
    "sora-2": "wan-2",
    "veo-3": "minimax",
    "minimax": "minimax",
    "wan-2": "wan-2",
    "luma-ray2": "vidu-q1",
    "luma-dream": "vidu-q1",
    "ltx-video": "vidu-q1",
    "pixverse-v5": "pixverse-v4.5",
    "pika-2": "pixverse-v4.5",
    "hunyuan": "hunyuan-video-fast",
    "luma-ray2-flash": "hunyuan-video-fast",
    "stable-video": "stable-video",
}


NOVITA_PRICING_TABLE: dict[str, list[dict[str, str | int | float]]] = {
    "minimax": [
        _variant(6, "768P", "i2v", "fast", 0.19),
        _variant(10, "768P", "i2v", "fast", 0.32),
        _variant(6, "1080P", "i2v", "fast", 0.33),
        _variant(6, "768P", "i2v", "standard", 0.28),
        _variant(10, "768P", "i2v", "standard", 0.56),
        _variant(6, "1080P", "i2v", "standard", 0.49),
        _variant(6, "768P", "t2v", "standard", 0.28),
        _variant(10, "768P", "t2v", "standard", 0.56),
        _variant(6, "1080P", "t2v", "standard", 0.49),
    ],
    "wan-2": [
        _variant(5, "720P", "t2v", "standard", 0.50),
        _variant(10, "720P", "t2v", "standard", 1.00),
        _variant(15, "720P", "t2v", "standard", 1.50),
        _variant(5, "1080P", "t2v", "standard", 0.75),
        _variant(10, "1080P", "t2v", "standard", 1.50),
        _variant(15, "1080P", "t2v", "standard", 2.25),
        _variant(5, "720P", "i2v", "standard", 0.50),
        _variant(10, "720P", "i2v", "standard", 1.00),
        _variant(15, "720P", "i2v", "standard", 1.50),
        _variant(5, "1080P", "i2v", "standard", 0.75),
        _variant(10, "1080P", "i2v", "standard", 1.50),
        _variant(15, "1080P", "i2v", "standard", 2.25),
    ],
    "vidu-q1": [
        _variant(5, "1080P", "t2v", "standard", 0.36),
        _variant(5, "1080P", "i2v", "standard", 0.36, provider_mode="ref2v"),
    ],
    "pixverse-v4.5": [
        _variant(5, "360P", "t2v", "standard", 0.25),
        _variant(5, "540P", "t2v", "standard", 0.25),
        _variant(5, "720P", "t2v", "standard", 0.35),
        _variant(5, "1080P", "t2v", "standard", 0.70),
        _variant(5, "360P", "i2v", "standard", 0.25),
        _variant(5, "540P", "i2v", "standard", 0.25),
        _variant(5, "720P", "i2v", "standard", 0.35),
        _variant(5, "1080P", "i2v", "standard", 0.70),
        _variant(5, "360P", "t2v", "fast", 0.50),
        _variant(5, "540P", "t2v", "fast", 0.50),
        _variant(5, "720P", "t2v", "fast", 0.70),
        _variant(5, "360P", "i2v", "fast", 0.50),
        _variant(5, "540P", "i2v", "fast", 0.50),
        _variant(5, "720P", "i2v", "fast", 0.70),
    ],
    "hunyuan-video-fast": [
        _variant(5, "720P", "t2v", "standard", 0.30),
    ],
    "stable-video": [
        _variant(4, "1024X576", "i2v", "standard", 0.0134),
        _variant(4, "1024X576", "i2v", "xt", 0.0240),
    ],
}


def get_novita_pricing_family(model_id: str) -> str | None:
    return NOVITA_PUBLIC_MODEL_FAMILY.get(model_id)


def get_novita_video_variants(model_id: str) -> list[dict[str, str | int | float]]:
    family = get_novita_pricing_family(model_id)
    if not family:
        return []
    return [dict(variant) for variant in NOVITA_PRICING_TABLE.get(family, [])]


def get_default_video_options(model_id: str, *, mode: str | None = None) -> dict[str, str | int]:
    """Return the cheapest valid variant for a public video model."""
    variants = get_novita_video_variants(model_id)
    normalized_mode = _normalize_mode(mode or "t2v")
    mode_variants = [variant for variant in variants if variant["mode"] == normalized_mode]
    pool = mode_variants or variants
    if not pool:
        return {
            "duration": 5,
            "resolution": "720P",
            "mode": normalized_mode,
            "quality": "standard",
        }

    best = min(
        pool,
        key=lambda item: (
            int(item["points"]),
            float(item["cost_usd"]),
            int(item["duration"]),
            str(item["resolution"]),
            str(item["quality"]),
        ),
    )
    return {
        "duration": int(best["duration"]),
        "resolution": str(best["resolution"]),
        "mode": str(best["mode"]),
        "quality": str(best["quality"]),
    }


def get_novita_variant_metadata(
    model_id: str,
    duration: int = 5,
    resolution: str = "720P",
    mode: str = "t2v",
    quality: str = "standard",
) -> dict[str, str | int | float]:
    family = get_novita_pricing_family(model_id)
    if not family:
        raise ValueError(f"Unknown Novita pricing family for model: {model_id}")

    normalized_duration = int(duration or 5)
    normalized_resolution = _normalize_resolution(resolution)
    normalized_mode = _normalize_mode(mode)
    normalized_quality = _normalize_quality(quality)

    for variant in NOVITA_PRICING_TABLE.get(family, []):
        if (
            int(variant["duration"]) == normalized_duration
            and str(variant["resolution"]) == normalized_resolution
            and str(variant["mode"]) == normalized_mode
            and str(variant["quality"]) == normalized_quality
        ):
            return dict(variant)

    raise ValueError(
        f"Unsupported video variant: model={model_id}, duration={duration}, resolution={resolution}, "
        f"mode={mode}, quality={quality}"
    )


def get_novita_video_cost_and_points(
    model_id: str,
    duration: int = 5,
    resolution: str = "720P",
    mode: str = "t2v",
    quality: str = "standard",
) -> tuple[float, int]:
    variant = get_novita_variant_metadata(
        model_id=model_id,
        duration=duration,
        resolution=resolution,
        mode=mode,
        quality=quality,
    )
    return float(variant["cost_usd"]), int(variant["points"])


def calculate_chat_provider_cost(model_id: str, tokens_in: int, tokens_out: int) -> float:
    costs = OPENROUTER_COSTS.get(model_id)
    if not costs:
        return 0.0
    return round((tokens_in * costs["input"] + tokens_out * costs["output"]) / 1_000_000, 6)


def calculate_video_provider_cost(model_id: str) -> float:
    return (
        NOVITA_COSTS.get(model_id, 0.0)
        or VERTEX_COSTS.get(model_id, 0.0)
        or FAL_COSTS.get(model_id, 0.0)
        or KLING_COSTS.get(model_id, 0.0)
    )


def calculate_image_provider_cost(model_id: str, tokens_in: int = 0, tokens_out: int = 0) -> float:
    fixed = IMAGE_GEN_COSTS.get(model_id)
    if fixed is not None:
        return fixed
    costs = OPENROUTER_COSTS.get(model_id)
    if costs:
        return round((tokens_in * costs["input"] + tokens_out * costs["output"]) / 1_000_000, 6)
    return 0.0


def calculate_audio_provider_cost(duration_seconds: float) -> float:
    minutes = duration_seconds / 60.0
    return round(minutes * WHISPER_COST_PER_MINUTE, 6)


def calculate_threed_provider_cost(model_id: str) -> float:
    return THREED_COSTS.get(model_id, 0.05)
