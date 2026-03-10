"""
main.py — CyberShield Scanner v3.0
Entry point: python main.py
"""

import os
import sys
import time
import platform
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger
import uvicorn

from routes.scan     import router as scan_router
from routes.phishing import router as phishing_router

# ── Loguru setup ──────────────────────────────────────────────────────────────
is_prod = os.getenv("NODE_ENV") == "production"

logger.remove()  # Remove default handler
if is_prod:
    # JSON format for log aggregators (Datadog, CloudWatch)
    logger.add(
        sys.stdout,
        format='{"timestamp":"{time:YYYY-MM-DDTHH:mm:ss}","level":"{level}","message":"{message}","service":"cybershield-scanner"}',
        level="INFO",
        serialize=False,
    )
else:
    # Human-readable for dev
    logger.add(sys.stdout, format="{time:HH:mm:ss} [{level}] {message}", level="DEBUG", colorize=True)

# ── Rate limiter — 10 scans/min per IP ────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])

# ── App ───────────────────────────────────────────────────────────────────────
START_TIME = time.time()

app = FastAPI(
    title    = "CyberShield Scanner",
    version  = "3.0.0",
    docs_url = "/docs" if not is_prod else None,
    redoc_url = None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["POST", "GET"], allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url}: {exc}")
    return JSONResponse(status_code=500, content={"error": "Internal scanner error", "detail": str(exc)})


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
@app.head("/health")
def health():
    return {
        "status":    "ok",  }


app.include_router(scan_router)
app.include_router(phishing_router)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=not is_prod, workers=1)
