import pytest
from httpx import AsyncClient
from app.services.translation_service import TranslationService


def test_translation_allowlist_filtering():
    """Verify Content Classification Allowlist accepts generic content and blocks forbidden categories."""
    # Generic AI explanations -> ALLOWED
    assert TranslationService.is_allowed_content("High 78% congestion demand warrants +20s green time.") is True
    assert TranslationService.is_allowed_content("Average travel speed degraded by 12% across highway.") is True

    # Forbidden PII / sensitive keywords -> BLOCKED
    assert TranslationService.is_allowed_content("Citizen complaint text", category="citizen_pii") is False
    assert TranslationService.is_allowed_content("Patient name John Doe", category="patient_details") is False
    assert TranslationService.is_allowed_content("text containing phone_number field") is False
    assert TranslationService.is_allowed_content("text containing secret_token credential") is False


def test_translation_pii_scrubbing_defense_in_depth():
    """Verify defense-in-depth regex PII scrubber replaces sensitive patterns."""
    raw_text = "User test@example.com with phone 555-123-4567 driving HR26AB1234."
    scrubbed = TranslationService.scrub_pii(raw_text)

    assert "[EMAIL]" in scrubbed
    assert "[PHONE]" in scrubbed
    assert "[VEHICLE_PLATE]" in scrubbed
    assert "test@example.com" not in scrubbed
    assert "555-123-4567" not in scrubbed


@pytest.mark.asyncio
async def test_translation_offline_fallback():
    """Verify offline fallback behavior when GOOGLE_TRANSLATION_API_KEY is omitted."""
    res = await TranslationService.translate_text(
        text="High congestion detected at Central Plaza.",
        target_lang="hi",
        category="generic_text",
    )

    assert res["original_text"] == "High congestion detected at Central Plaza."
    assert res["translated_text"] == "High congestion detected at Central Plaza."
    assert res["target_lang"] == "hi"
    assert res["allowed"] is True
    assert res["service"] == "OFFLINE_FALLBACK"


@pytest.mark.asyncio
async def test_api_translate_endpoint_role_permissions(
    async_client: AsyncClient,
    police_jwt_token: str,
    admin_jwt_token: str,
    valid_jwt_token: str,
):
    """Verify RBAC permissions on POST /api/v1/translate."""
    payload = {
        "text": "Signal phase updated to green wave mode.",
        "target_lang": "hi",
        "category": "generic_text",
    }

    # 1. TRAFFIC_POLICE -> 200 OK (Allowed)
    police_res = await async_client.post(
        "/api/v1/translate",
        json=payload,
        headers={"Authorization": f"Bearer {police_jwt_token}"},
    )
    assert police_res.status_code == 200
    assert police_res.json()["allowed"] is True

    # 2. ADMIN -> 200 OK (Allowed)
    admin_res = await async_client.post(
        "/api/v1/translate",
        json=payload,
        headers={"Authorization": f"Bearer {admin_jwt_token}"},
    )
    assert admin_res.status_code == 200

    # 3. CITIZEN -> 403 Forbidden (Denied)
    citizen_res = await async_client.post(
        "/api/v1/translate",
        json=payload,
        headers={"Authorization": f"Bearer {valid_jwt_token}"},
    )
    assert citizen_res.status_code == 403

    # 4. Unauthenticated -> 401 Unauthorized
    unauth_res = await async_client.post("/api/v1/translate", json=payload)
    assert unauth_res.status_code == 401
