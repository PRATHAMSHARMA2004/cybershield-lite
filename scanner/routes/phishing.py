import asyncio
import logging
from fastapi import APIRouter
from models.response_models import PhishingRequest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/analyze/phishing")
async def analyze_phishing(request: PhishingRequest) -> dict:
    from services.phishing_analyzer import analyze_phishing_email

    logger.info("Phishing analysis requested")
    loop   = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, analyze_phishing_email, request.email_content)
    return result
