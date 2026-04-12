# Claude Code Handoff: Move All 13 Active Video Models to Novita

## Goal

All currently active video SKUs should run through Novita, not fal.ai.

This local change does that by:
- switching all 13 active model ids to `provider="novita"`
- removing silent fallback from `novita -> fal` in `backend/app/routers/video.py`
- mapping each internal Stone model id to a supported Novita endpoint family in `backend/app/services/novita_client.py`

## Files changed

- `backend/app/services/video_router.py`
- `backend/app/services/novita_client.py`
- `backend/app/services/provider_costs.py`
- `backend/app/routers/video.py`

## Active model routing now

Internal model ids kept unchanged for frontend/API compatibility.

Current internal id -> Novita mapping:
- `sora-2` -> `wan2.6-t2v` / `wan2.6-i2v`
- `veo-3` -> `minimax-hailuo-02`
- `luma-ray2` -> `vidu-q1-text2video` / `vidu-q1-reference2video`
- `luma-ray2-flash` -> `hunyuan-video-fast` for text, `pixverse-v4.5-i2v` for image
- `minimax` -> `minimax-hailuo-02`
- `cogvideox` -> `cogvideox-3`
- `pixverse-v5` -> `pixverse-v4.5-t2v` / `pixverse-v4.5-i2v`
- `luma-dream` -> `vidu-q1-text2video` / `vidu-q1-reference2video`
- `pika-2` -> `pixverse-v4.5-t2v` / `pixverse-v4.5-i2v`
- `wan-2` -> `wan2.6-t2v` / `wan2.6-i2v`
- `hunyuan` -> `hunyuan-video-fast` for text, `vidu-q1-reference2video` for image
- `ltx-video` -> `vidu-q1-text2video` / `vidu-q1-reference2video`
- `stable-video` -> `stable-video-diffusion`

Important:
- these are provider aliases, not exact vendor-parity mappings
- user-facing ids are preserved; backend provider model changed underneath

## Safety fix included

`backend/app/routers/video.py` no longer silently falls back to fal when:
- `provider == "novita"` but `NOVITA_API_KEY` is missing
- `provider == "vertex"` but key/mode is unavailable
- `provider == "kling"` but credentials are missing

Now it fails explicitly with `502` and a clear message instead of secretly using another provider.

## Cost tracking

`backend/app/services/provider_costs.py` now has Novita-side estimated costs for all 13 active video ids.

These are operational estimates, not invoice-verified numbers yet.
Do not treat them as finance-grade until validated against Novita billing.

## Validation already done

`python -m py_compile` passed for:
- `backend/app/services/video_router.py`
- `backend/app/services/novita_client.py`
- `backend/app/services/provider_costs.py`
- `backend/app/routers/video.py`

## What Claude Code should do next

1. Review diff only in the 4 files above.
2. Deploy backend.
3. Run live smoke tests for all 13 active ids with at least one request each.
4. Confirm `fal_request_id` now stores `novita:<task_id>` for every active model.
5. Check that `/api/video/status/{task_id}` returns a usable `video_url`.
6. Check that completed videos still save to disk/gallery.

## Required live smoke list

- `sora-2`
- `veo-3`
- `luma-ray2`
- `luma-ray2-flash`
- `minimax`
- `cogvideox`
- `pixverse-v5`
- `luma-dream`
- `pika-2`
- `wan-2`
- `hunyuan`
- `ltx-video`
- `stable-video`

## Highest runtime risk

The main risk is not Python wiring anymore; it is endpoint contract mismatch on specific Novita model aliases.

If any model fails after deploy, first inspect:
- HTTP status + raw response body from Novita submit
- raw payload from `GET /v3/async/task-result`

Do that before changing routing again.
