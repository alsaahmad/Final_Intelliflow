from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.security import get_current_user_payload
from app.services.translation_service import TranslationService

router = APIRouter()


class TranslationRequestSchema(BaseModel):
    text: str = Field(..., min_length=1, description="Text to translate")
    target_lang: str = Field("hi", description="Target language code (e.g., 'hi')")
    category: Optional[str] = Field("generic_text", description="Content classification category")


class TranslationResponseSchema(BaseModel):
    original_text: str
    translated_text: str
    target_lang: str
    cached: bool
    allowed: bool
    service: str


ALLOWED_TRANSLATE_ROLES = {"TRAFFIC_POLICE", "CITY_OPERATIONS", "COMMAND_CENTER", "ADMIN"}


@router.post(
    "/translate",
    response_model=TranslationResponseSchema,
    summary="Translate dynamic natural-language content",
    description="Translates generic natural-language text with Content Classification Allowlist, PII scrubbing, caching, and fallback.",
)
async def translate_text(
    payload: TranslationRequestSchema,
    user_payload: Dict[str, Any] = Depends(get_current_user_payload),
):
    """Authenticated endpoint for translation with RBAC enforcement."""
    user_role = user_payload.get("role")
    if user_role not in ALLOWED_TRANSLATE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' is not authorized to access translation endpoint.",
            },
        )

    result = await TranslationService.translate_text(
        text=payload.text,
        target_lang=payload.target_lang,
        category=payload.category,
    )
    return result
