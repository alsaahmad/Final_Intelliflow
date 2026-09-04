import re
import hashlib
import logging
import httpx
from typing import Tuple, Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger("translation_service")

# In-memory fallback cache
_in_memory_cache: Dict[str, str] = {}

# Defense-in-depth PII scrubbing patterns
PII_PATTERNS = [
    (re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'), '[EMAIL]'),
    (re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'), '[PHONE]'),
    (re.compile(r'\b[A-Z]{2}\s?\d{2}\s?[A-Z]{1,2}\s?\d{4}\b', re.IGNORECASE), '[VEHICLE_PLATE]'),
    (re.compile(r'\b(?:eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b'), '[TOKEN]'),
]

# Sensitive / Forbidden keywords that fail the allowlist check
FORBIDDEN_KEYWORDS = [
    "citizen_name", "phone_number", "aadhaar", "passport",
    "patient_name", "triage_note", "echallan", "license_plate",
    "password", "secret_token", "private_operational_note",
]


class TranslationService:
    """Translation service with Content Allowlist, PII Scrubber, Caching, and Offline Fallback."""

    @classmethod
    def is_allowed_content(cls, text: str, category: Optional[str] = None) -> bool:
        """Enforces Content Classification Allowlist check before external translation."""
        if category in ["citizen_pii", "complaint_pii", "patient_details", "triage_notes", "vehicle_data", "credentials"]:
            return False

        text_lower = text.lower()
        for kw in FORBIDDEN_KEYWORDS:
            if kw in text_lower:
                return False

        return True

    @classmethod
    def scrub_pii(cls, text: str) -> str:
        """Applies defense-in-depth regex scrubbing for allowed content categories."""
        scrubbed = text
        for pattern, replacement in PII_PATTERNS:
            scrubbed = pattern.sub(replacement, scrubbed)
        return scrubbed

    @classmethod
    async def translate_text(
        cls,
        text: str,
        target_lang: str = "hi",
        category: Optional[str] = "generic_text",
    ) -> Dict[str, Any]:
        """Translates text with allowlist validation, PII scrubbing, caching, and fallback."""
        if not text or not text.strip():
            return {
                "original_text": text,
                "translated_text": text,
                "target_lang": target_lang,
                "cached": False,
                "allowed": True,
                "service": "NO_OP",
            }

        # 1. Enforce Content Classification Allowlist
        if not cls.is_allowed_content(text, category):
            logger.warning("Translation request blocked by Content Classification Allowlist.")
            return {
                "original_text": text,
                "translated_text": text,
                "target_lang": target_lang,
                "cached": False,
                "allowed": False,
                "service": "ALLOWLIST_BLOCKED",
            }

        # 2. Defense-in-Depth PII Scrubbing
        scrubbed_text = cls.scrub_pii(text)

        # 3. Cache Lookup Key
        cache_key = hashlib.md5(f"{scrubbed_text}:{target_lang}".encode("utf-8")).hexdigest()
        if cache_key in _in_memory_cache:
            return {
                "original_text": text,
                "translated_text": _in_memory_cache[cache_key],
                "target_lang": target_lang,
                "cached": True,
                "allowed": True,
                "service": "CACHE_HIT",
            }

        # 4. Check if Google Cloud Translation API Key is configured
        api_key = settings.GOOGLE_TRANSLATION_API_KEY.strip() if settings.GOOGLE_TRANSLATION_API_KEY else ""

        if not api_key:
            logger.info("Google Translation API key not set; operating in offline fallback mode.")
            # Store in cache to avoid redundant logs
            _in_memory_cache[cache_key] = scrubbed_text
            return {
                "original_text": text,
                "translated_text": scrubbed_text,
                "target_lang": target_lang,
                "cached": False,
                "allowed": True,
                "service": "OFFLINE_FALLBACK",
            }

        # 5. External Google Cloud Translation API Invocation
        try:
            url = "https://translation.googleapis.com/language/translate/v2"
            params = {
                "q": scrubbed_text,
                "target": target_lang,
                "key": api_key,
            }
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    translated = data["data"]["translations"][0]["translatedText"]
                    _in_memory_cache[cache_key] = translated
                    return {
                        "original_text": text,
                        "translated_text": translated,
                        "target_lang": target_lang,
                        "cached": False,
                        "allowed": True,
                        "service": "GOOGLE_CLOUD_TRANSLATION",
                    }
                else:
                    logger.warning(f"Google Translation API returned status {response.status_code}. Using fallback.")
        except Exception as err:
            logger.error(f"Google Translation API request error: {err}. Using fallback.")

        # Fallback if API call failed
        _in_memory_cache[cache_key] = scrubbed_text
        return {
            "original_text": text,
            "translated_text": scrubbed_text,
            "target_lang": target_lang,
            "cached": False,
            "allowed": True,
            "service": "OFFLINE_FALLBACK",
        }
