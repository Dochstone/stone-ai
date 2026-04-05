"""WordPress integration — publish SEO articles to WordPress sites."""

import logging
import base64

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/wordpress", tags=["wordpress"])


class WPConfig(BaseModel):
    site_url: str = Field(max_length=500)  # https://example.com
    username: str = Field(max_length=100)
    app_password: str = Field(max_length=100)  # WordPress Application Password


class PublishRequest(BaseModel):
    site_url: str = Field(max_length=500)
    username: str = Field(max_length=100)
    app_password: str = Field(max_length=100)
    title: str = Field(max_length=500)
    content: str  # HTML content
    status: str = Field(default="draft", pattern="^(draft|publish|pending)$")
    categories: list[str] = []
    tags: list[str] = []
    featured_image_url: str | None = None


@router.post("/test")
async def test_connection(
    body: WPConfig,
    tg_user: dict = Depends(get_current_user),
):
    """Test WordPress connection."""
    try:
        auth = base64.b64encode(f"{body.username}:{body.app_password}".encode()).decode()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{body.site_url.rstrip('/')}/wp-json/wp/v2/users/me",
                headers={"Authorization": f"Basic {auth}"},
            )
            if resp.status_code == 200:
                data = resp.json()
                return {"ok": True, "user": data.get("name", ""), "site": body.site_url}
            else:
                return {"ok": False, "error": f"HTTP {resp.status_code}: {resp.text[:200]}"}
    except Exception as e:
        return {"ok": False, "error": str(e)[:200]}


@router.post("/publish")
async def publish_to_wordpress(
    body: PublishRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Publish an article to WordPress."""
    auth = base64.b64encode(f"{body.username}:{body.app_password}".encode()).decode()
    api_url = f"{body.site_url.rstrip('/')}/wp-json/wp/v2"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            # Get or create categories
            category_ids = []
            for cat_name in body.categories[:5]:
                cat_resp = await client.get(
                    f"{api_url}/categories",
                    params={"search": cat_name, "per_page": 1},
                    headers={"Authorization": f"Basic {auth}"},
                )
                if cat_resp.status_code == 200 and cat_resp.json():
                    category_ids.append(cat_resp.json()[0]["id"])
                else:
                    create_resp = await client.post(
                        f"{api_url}/categories",
                        headers={"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
                        json={"name": cat_name},
                    )
                    if create_resp.status_code == 201:
                        category_ids.append(create_resp.json()["id"])

            # Get or create tags
            tag_ids = []
            for tag_name in body.tags[:10]:
                tag_resp = await client.get(
                    f"{api_url}/tags",
                    params={"search": tag_name, "per_page": 1},
                    headers={"Authorization": f"Basic {auth}"},
                )
                if tag_resp.status_code == 200 and tag_resp.json():
                    tag_ids.append(tag_resp.json()[0]["id"])
                else:
                    create_resp = await client.post(
                        f"{api_url}/tags",
                        headers={"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
                        json={"name": tag_name},
                    )
                    if create_resp.status_code == 201:
                        tag_ids.append(create_resp.json()["id"])

            # Create post
            post_data = {
                "title": body.title,
                "content": body.content,
                "status": body.status,
            }
            if category_ids:
                post_data["categories"] = category_ids
            if tag_ids:
                post_data["tags"] = tag_ids

            resp = await client.post(
                f"{api_url}/posts",
                headers={"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
                json=post_data,
            )

            if resp.status_code in (200, 201):
                post = resp.json()
                return {
                    "ok": True,
                    "post_id": post["id"],
                    "url": post.get("link", ""),
                    "status": post.get("status", ""),
                }
            else:
                error_text = resp.text[:300]
                logger.error(f"WordPress publish error {resp.status_code}: {error_text}")
                raise HTTPException(502, f"WordPress ошибка: {resp.status_code}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"WordPress publish error: {e}")
        raise HTTPException(502, f"Ошибка подключения к WordPress: {str(e)[:200]}")


@router.get("/categories")
async def get_categories(
    site_url: str,
    username: str,
    app_password: str,
    tg_user: dict = Depends(get_current_user),
):
    """Get WordPress categories."""
    auth = base64.b64encode(f"{username}:{app_password}".encode()).decode()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{site_url.rstrip('/')}/wp-json/wp/v2/categories",
                params={"per_page": 50},
                headers={"Authorization": f"Basic {auth}"},
            )
            if resp.status_code == 200:
                return {"categories": [{"id": c["id"], "name": c["name"]} for c in resp.json()]}
    except Exception:
        pass
    return {"categories": []}
