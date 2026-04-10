"""Provider cost tracking — what Stone AI PAYS to API providers.

Used to calculate margin: user_revenue - provider_cost = profit.
Prices from OpenRouter, FAL.ai, Kling, OpenAI pricing pages.
"""

from app.services.ai_router import MODELS_REGISTRY

# ─── OpenRouter costs per 1M tokens (what WE pay) ───
# Source: https://openrouter.ai/models
OPENROUTER_COSTS: dict[str, dict[str, float]] = {
    # Tier 1: Lite
    "gpt-4o-mini":       {"input": 0.15,  "output": 0.60},
    "claude-haiku-4.5":  {"input": 0.80,  "output": 4.00},
    "gemini-2.0-flash":  {"input": 0.10,  "output": 0.40},
    "llama-4-maverick":  {"input": 0.20,  "output": 0.60},
    "mistral-large-25":  {"input": 2.00,  "output": 6.00},
    # Tier 2: Mid-range
    "deepseek-r1":       {"input": 0.55,  "output": 2.19},
    "deepseek-v3":       {"input": 0.30,  "output": 0.88},
    "deepseek-v3.2":     {"input": 0.30,  "output": 0.88},
    "gpt-4.1-mini":      {"input": 0.40,  "output": 1.60},
    "gpt-4.1-nano":      {"input": 0.10,  "output": 0.40},
    "gemini-2.5-flash":  {"input": 0.15,  "output": 0.60},
    "claude-sonnet-4":   {"input": 3.00,  "output": 15.00},
    "claude-sonnet-4.5": {"input": 3.00,  "output": 15.00},
    "grok-3-mini":       {"input": 0.30,  "output": 0.50},
    "qwen-3-235b":       {"input": 0.14,  "output": 0.70},
    "qwen-qwq":          {"input": 0.14,  "output": 0.70},
    "minimax-m2.5":      {"input": 0.18,  "output": 0.66},
    "command-r7":        {"input": 0.04,  "output": 0.04},
    "mistral-small":     {"input": 0.10,  "output": 0.30},
    # Tier 3: Premium
    "claude-opus-4":     {"input": 15.00, "output": 75.00},
    "claude-opus-4.5":   {"input": 15.00, "output": 75.00},
    "gpt-4.1":           {"input": 2.00,  "output": 8.00},
    "gpt-5.1":           {"input": 2.00,  "output": 16.00},
    "gpt-5.4":           {"input": 2.50,  "output": 15.00},
    "gemini-2.5-pro":    {"input": 1.25,  "output": 10.00},
    "gemini-3-pro":      {"input": 1.50,  "output": 9.00},
    "grok-3":            {"input": 3.00,  "output": 15.00},
    "perplexity-sonar-pro": {"input": 3.00, "output": 15.00},
    "kimi-k2.5":         {"input": 0.20,  "output": 1.50},
    "o4-mini":           {"input": 1.10,  "output": 4.40},
    "o3":                {"input": 2.00,  "output": 8.00},
    "claude-haiku-4.5-think": {"input": 0.80, "output": 4.00},
    "gemini-2.5-flash-think": {"input": 0.15, "output": 3.50},
    "devstral":          {"input": 0.15,  "output": 0.60},
    # Tier 4: Image (via OpenRouter)
    "nano-banana-pro":   {"input": 2.00,  "output": 12.00},
    "nano-banana":       {"input": 0.15,  "output": 0.60},
    "gpt-5-image":       {"input": 2.50,  "output": 15.00},
    "gpt-5-image-mini":  {"input": 0.60,  "output": 2.40},
    # Tier 5: Free/cheap on OpenRouter
    "gemma-3-27b":       {"input": 0.00,  "output": 0.00},
    "gemma-3n-4b":       {"input": 0.00,  "output": 0.00},
    "phi-4":             {"input": 0.00,  "output": 0.00},
    "llama-3.3-70b":     {"input": 0.00,  "output": 0.00},
    "qwen-turbo":        {"input": 0.05,  "output": 0.18},
    "nvidia-nemotron":   {"input": 0.00,  "output": 0.00},
    "mythomax-13b":      {"input": 0.00,  "output": 0.00},
    # Tier 6: Search
    "perplexity-sonar":       {"input": 1.00, "output": 1.00},
    "perplexity-sonar-deep":  {"input": 2.00, "output": 8.00},
}

# ─── FAL.ai costs per generation ───
FAL_COSTS: dict[str, float] = {
    "sora-2": 0.10,
    "veo-3.1": 0.08,
    "luma-ray-2": 0.05,
    "runway-gen3": 0.10,
    "pixverse-v4.5": 0.04,
    "hunyuan": 0.03,
    "ltx-video": 0.02,
    "cogvideox-5b": 0.03,
    "wan-2.1": 0.03,
    "stable-video": 0.04,
}

# ─── Kling direct API costs per generation ───
KLING_COSTS: dict[str, float] = {
    "kling-v2-master": 0.07,
    "kling-v2-5-master": 0.09,
}

# ─── Image generation costs (non-OpenRouter) ───
IMAGE_GEN_COSTS: dict[str, float] = {
    "flux-schnell": 0.003,
    "stable-diffusion-xl": 0.01,
}

# ─── OpenAI Whisper ───
WHISPER_COST_PER_MINUTE = 0.006  # $0.006/min

# ─── 3D generation costs ───
THREED_COSTS: dict[str, float] = {
    "tripo-v3": 0.05,
    "meshy-6": 0.08,
}


def calculate_chat_provider_cost(model_id: str, tokens_in: int, tokens_out: int) -> float:
    """Calculate what WE pay OpenRouter for a chat request."""
    costs = OPENROUTER_COSTS.get(model_id)
    if not costs:
        return 0.0
    return round((tokens_in * costs["input"] + tokens_out * costs["output"]) / 1_000_000, 6)


def calculate_video_provider_cost(model_id: str) -> float:
    """Calculate what WE pay FAL.ai/Kling for a video generation."""
    return FAL_COSTS.get(model_id, 0.0) or KLING_COSTS.get(model_id, 0.0)


def calculate_image_provider_cost(model_id: str, tokens_in: int = 0, tokens_out: int = 0) -> float:
    """Calculate provider cost for image generation (OpenRouter or fixed)."""
    fixed = IMAGE_GEN_COSTS.get(model_id)
    if fixed is not None:
        return fixed
    costs = OPENROUTER_COSTS.get(model_id)
    if costs:
        return round((tokens_in * costs["input"] + tokens_out * costs["output"]) / 1_000_000, 6)
    return 0.0


def calculate_audio_provider_cost(duration_seconds: float) -> float:
    """Calculate what WE pay OpenAI for Whisper STT."""
    minutes = duration_seconds / 60.0
    return round(minutes * WHISPER_COST_PER_MINUTE, 6)


def calculate_threed_provider_cost(model_id: str) -> float:
    """Calculate provider cost for 3D generation."""
    return THREED_COSTS.get(model_id, 0.05)
